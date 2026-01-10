import { ByteReader } from '@gmc/game/ByteReader'
import { filterChat } from '@gmc/game/CommonGame.svelte'
import { OneTurnClient, OneTurnGame } from '@gmc/game/OneTurnGame.svelte'
import type { BaseGameRoom } from '@gmc/remote/BaseGameRoom'
import type { Repeat } from '@/util'

import { defaultMode, type RPSMode } from './gamemode'

const enum S2C {
  WELCOME,
  JOIN,
  LEAVE,
  RESET,
  RENAME,
  PING,
  PING_TIME,
  CHAT,
  ACTIVE,
  ROUND_WAIT,
  ROUND_INTERM,
  ROUND_START,
  READY,
  END_ROUND,
  MOVE_CONFIRM,
}

const enum C2S {
  RESET,
  RENAME,
  PONG,
  CHAT,
  ACTIVE,
  READY,
  MOVE,
}

class RPSClient extends OneTurnClient {
  roundScore = $state(0)
  roundStreak = $state(0)

  roundWins = $state(0)
  roundLosses = $state(0)
  roundTies = $state(0)

  battleWins = $state(0n)
  battleLosses = $state(0n)
  battleTies = $state(0n)

  roundTotal = $state(0)
  battleTotal = $state(0n)
  battleScore = $state(0n)

  resetScore () {
    this.roundScore = 0
    this.roundStreak = 0

    this.roundWins = 0
    this.roundLosses = 0
    this.roundTies = 0

    this.battleWins = 0n
    this.battleLosses = 0n
    this.battleTies = 0n

    this.roundTotal = 0
    this.battleTotal = 0n
    this.battleScore = 0n
  }

  canResetScore () {
    return this.roundTotal
  }

  override readWelcome (m: ByteReader): void {
    super.readWelcome(m)

    this.roundScore = m.getInt()
    this.roundStreak = m.getInt()
    this.roundWins = m.getInt()
    this.roundLosses = m.getInt()
    this.roundTies = m.getInt()
    this.battleWins = m.getUint64()
    this.battleLosses = m.getUint64()
    this.battleTies = m.getUint64()

    this.roundTotal = this.roundWins + this.roundLosses + this.roundTies
    this.battleTotal = this.battleWins + this.battleLosses + this.battleTies
    this.battleScore = this.battleWins - this.battleLosses
  }
}

export interface RPSGameHistory {
  local?: RPSGameHistoryLocal
  outcomes: number3
  count: Number3
  botCount: Number3
  moves: RPSGameHistoryMove[]
  detRandBits: number
}

interface RPSGameHistoryLocal {
  move: number
  battleLTW: Number3
  newStreak: number
}

interface RPSGameHistoryMove {
  ltw: Number3
  players: string[]
  meIndex?: number
}

export class RPSGame extends OneTurnGame<RPSClient, RPSGameHistory> {
  mode: RPSMode = $state(defaultMode())

  pendingMove = $state(0)

  get ROUND_TIME () { return this.mode.optRoundTime }
  INTERMISSION_TIME = 5000

  override newClient () { return new RPSClient }

  enterGame (room: BaseGameRoom, name: string): void {
    this.setupGame(room)
    this.sendf('is', this.PROTOCOL_VERSION, name)
  }

  sendReset (): void { this.sendf('i', C2S.RESET) }
  sendRename (newName: string): void { this.sendf('is', C2S.RENAME, newName) }
  sendPong (t: number): void { this.sendf('i2', C2S.PONG, t) }
  sendChat (s: string, flags: number, target = -1): void { this.sendf('i3s', C2S.CHAT, flags, target, filterChat(s)) }
  sendActive (): void { this.sendf('i', C2S.ACTIVE) }
  sendReady (): void { this.sendf('i', C2S.READY) }
  sendMove (n: number): void { this.sendf('i2', C2S.MOVE, n) }

  MESSAGE_HANDLERS: Record<number, (this: this, m: ByteReader) => void> = {
    [S2C.WELCOME]: this.processWelcome,
    [S2C.JOIN]: this.processJoin,
    [S2C.LEAVE]: this.processLeave,
    [S2C.RESET]: this.processReset,
    [S2C.RENAME]: this.processRename,
    [S2C.PING]: this.processPing,
    [S2C.PING_TIME]: this.processPingTime,
    [S2C.CHAT]: this.processChat,
    [S2C.ACTIVE]: this.processActive,
    [S2C.ROUND_WAIT]: this.processRoundWait,
    [S2C.ROUND_INTERM]: this.processRoundInterm,
    [S2C.ROUND_START]: this.processRoundStart,
    [S2C.READY]: this.processReady,
    [S2C.END_ROUND]: this.processEndRound,
    [S2C.MOVE_CONFIRM]: this.processMoveConfirm,
  }

  protected processWelcomeMode (m: ByteReader): void {
    const modeFlags = m.get()
    this.mode.optClassic = !!(modeFlags & (1 << 0))
    this.mode.optInverted = !!(modeFlags & (1 << 1))
    this.mode.optCount = !!(modeFlags & (1 << 2))
    this.mode.optRoundTime = m.getInt()
    this.mode.optBotBalance = m.getInt64()
  }

  protected processMoveConfirm (m: ByteReader): void {
    this.pendingMove = m.getInt()
  }

  protected processEndRound (m: ByteReader): void {
    const detRandBits = m.getInt()
    const outcomes: number3 = [filterOutcome(m.getInt()), filterOutcome(m.getInt()), filterOutcome(m.getInt())]
    const count: Number3 = [m.getUint64(), m.getUint64(), m.getUint64()]
    const botCount = count.slice() as Number3
    const humanCount = Math.min(m.getInt(), this.clients.length)

    const ltw = calculateLTW(count, outcomes)

    const moves: RPSGameHistoryMove[] = ltw.map((x) => ({
      ltw: x,
      players: [] as string[],
    }))

    let localEntry: RPSGameHistoryLocal | undefined
    for (let i = 0; i < humanCount; i++) {
      const cn = m.getCN()
      const move = m.getInt()

      const p = this.clients[cn]
      if (!(p && 0 <= move && move < 3)) continue

      botCount[move]--
      moves[move].players.push(p.formatName())

      const battleLTW = ltw[move]
      p.battleLosses += battleLTW[0]
      p.battleTies += battleLTW[1]
      p.battleWins += battleLTW[2]
      p.battleTotal += battleLTW[0] + battleLTW[1] + battleLTW[2]
      p.battleScore += battleLTW[2] - battleLTW[0]

      if (battleLTW[2] > battleLTW[0]) {
        p.roundWins++
        if (p.roundStreak < 0) p.roundStreak = 0
        p.roundStreak++
        p.roundScore += p.roundStreak > 2 && !this.mode.optClassic ? p.roundStreak - 1 : 1
      } else if (battleLTW[2] < battleLTW[0]) {
        p.roundLosses++
        if (p.roundStreak > 0) p.roundStreak = 0
        p.roundStreak--
        p.roundScore--
      } else {
        p.roundTies++
      }
      p.roundTotal++

      if (p === this.localClient) {
        moves[move].meIndex = moves[move].players.length - 1
        localEntry = {
          move,
          battleLTW,
          newStreak: p.roundStreak,
        }
      }
    }

    const gameHistoryEntry: RPSGameHistory = {
      local: localEntry,
      outcomes,
      count,
      botCount,
      moves,
      detRandBits,
    }
    this.updatePlayers()
    this.addHistory(gameHistoryEntry)
  }

  protected override readonly playersSortProps = [
    (p: RPSClient) => p.roundStreak,
    (p: RPSClient) => p.roundScore,
    (p: RPSClient) => p.roundWins,
    (p: RPSClient) => p.battleWins - p.battleLosses,
    (p: RPSClient) => p.battleWins,
  ]
}

function filterOutcome (o: number): number {
  return o < 0 ? -1 : o > 0 ? 1 : 0
}

type number3 = Repeat<number, 3>
type Number3 = Repeat<bigint, 3>
type Number33 = [Number3, Number3, Number3]

function calculateLTW (count: Number3, battleResults: number3): Number33 {
  const ltw: Number33 = [[0n, 0n, 0n], [0n, 0n, 0n], [0n, 0n, 0n]]
  for (let i = 0; i < 3; i++) {
    if (count[i]) {
      ltw[i][1] += count[i] - 1n
      ltw[i][1 + battleResults[i]] += count[(i + 1) % 3]
      ltw[i][1 - battleResults[(i + 2) % 3]] += count[(i + 2) % 3]
    }
  }
  return ltw
}
