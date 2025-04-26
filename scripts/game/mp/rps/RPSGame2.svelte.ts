import { MAX_PLAYERS, filterName, sortAndRankPlayers, formatClientName } from '@gmc/game/common'
import { ByteReader } from '@gmc/game/ByteReader'
import { ByteWriter } from '@gmc/game/ByteWriter'
import { OneTurnClient, OneTurnGame } from '@gmc/game/OneTurnGame.svelte'
import type { BaseGameRoom } from '@gmc/remote/BaseGameRoom'

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
  MOVE_CONFIRM,
  END_ROUND,
  END_TURN, // unused
}

const enum C2S {
  RESET,
  RENAME,
  PONG,
  CHAT,
  ACTIVE,
  READY,
  MOVE,
  MOVE_END,
}

class RPSClient extends OneTurnClient {
  roundScore = $state(0)
  roundStreak = $state(0)

  roundWins = $state(0)
  roundLosses = $state(0)
  roundTies = $state(0)
  roundTotal = $state(0)

  battleWins = $state(0)
  battleLosses = $state(0)
  battleTies = $state(0)
  battleTotal = $state(0)

  resetScore () {
    this.roundScore = 0
    this.roundStreak = 0

    this.roundWins = 0
    this.roundLosses = 0
    this.roundTies = 0
    this.roundTotal = 0

    this.battleWins = 0
    this.battleLosses = 0
    this.battleTies = 0
    this.battleTotal = 0
  }

  override readWelcome (m: ByteReader): void {
    super.readWelcome(m)

    this.roundScore = m.getInt()
    this.roundStreak = m.getInt()
    this.roundWins = m.getInt()
    this.roundLosses = m.getInt()
    this.roundTies = m.getInt()
    this.roundTotal = this.roundWins + this.roundLosses + this.roundTies
    this.battleWins = m.getFloat64()
    this.battleLosses = m.getFloat64()
    this.battleTies = m.getFloat64()
    this.battleTotal = this.battleWins + this.battleLosses + this.battleTies
  }
}

export interface RPSGameHistory {
  local?: RPSGameHistoryLocal
  outcomes: number3
  count: number3
  botCount: number3
  moves: RPSGameHistoryMove[]
  detRandBits: number
}

interface RPSGameHistoryLocal {
  move: number
  battleLTW: number3
  newStreak: number
}

interface RPSGameHistoryMove {
  ltw: number3
  players: string[]
}

const MAX_NAME_LEN = 20
const MAX_CHAT_LEN = 100

const PROTOCOL_VERSION = 0

const INTERMISSION_TIME = 5000

export class RPSGame extends OneTurnGame<RPSClient, RPSGameHistory> {
  mode: RPSMode = $state(defaultMode())

  pendingMove = $state(0)

  override newClient () { return new RPSClient }

  enterGame (room: BaseGameRoom, name: string): void {
    this.setupGame(room)
    this.sendf('is', PROTOCOL_VERSION, name)
  }

  sendReset (): void { this.sendf('i', C2S.RESET) }
  sendRename (newName: string): void { this.sendf('is', C2S.RENAME, newName) }
  sendActive (active: boolean): void { this.sendf('ib', C2S.ACTIVE, active) }
  sendChat (s: string, flags: number, target = -1): void { this.sendf('i3s', C2S.CHAT, flags, target, s.slice(0, MAX_CHAT_LEN)) }
  sendReady (ready: boolean): void { this.sendf('ib', C2S.READY, ready) }
  sendMove (n: number): void { this.sendf('i2', C2S.MOVE, n) }
  sendMoveEnd (): void { this.sendf('i', C2S.MOVE_END) }

  processMessage (m: ByteReader): void {
    const type = m.getInt()
    switch (type) {
      case S2C.WELCOME: {
        const protocol = m.getInt()
        if (protocol !== PROTOCOL_VERSION) {
          alert(`different protocol version (client: ${PROTOCOL_VERSION}, server: ${protocol})\nrefresh the page for updates?`)
        }

        this.clients.length = 0

        const myCn = m.getCN()

        this.mode.optClassic = m.getBool()
        this.mode.optInverted = m.getBool()
        this.mode.optCount = m.getBool()
        this.mode.optRoundTime = m.getInt()
        this.mode.optBotBalance = m.getInt()

        for (let i = 0; i <= MAX_PLAYERS; i++) {
          const cn = m.getCN()
          if (cn < 0) break
          const p = cn == myCn ? this.localClient : new RPSClient()
          p.cn = cn
          p.readWelcome(m)
          this.clients[cn] = p
        }

        const roundState = m.getInt()
        if (roundState === 0) {
          this.roundWait()
        } else if (roundState === 1) {
          this.roundIntermission(m.getInt())
          for (let i = 0; i <= MAX_PLAYERS; i++) {
            const cn = m.getCN()
            if (cn < 0) break
            const p = this.clients[cn]
            if (!p) continue
            p.ready = true
          }
        } else if (roundState === 2) {
          this.roundStart(m.getInt())
        }

        const curRoundPlayers = []
        for (let i = 0; i <= MAX_PLAYERS; i++) {
          const cn = m.getCN()
          if (cn < 0) break
          const p = this.clients[cn]
          if (!p) continue
          p.inRound = true
          curRoundPlayers.push(p)
        }
        this.roundPlayers = curRoundPlayers

        const curRoundQueue = []
        for (let i = 0; i <= MAX_PLAYERS; i++) {
          const cn = m.getCN()
          if (cn < 0) break
          const p = this.clients[cn]
          if (!p) continue
          curRoundQueue.push(p)
        }
        this.roundPlayerQueue = curRoundQueue

        this.updatePlayers()
        break
      }
      case S2C.JOIN: {
        const cn = m.getCN()
        const name = filterName(m.getString(MAX_NAME_LEN))
        if (this.clients[cn]) break

        const newPlayer = new RPSClient()
        newPlayer.cn = cn
        newPlayer.name = name

        this.clients[cn] = newPlayer

        this.chat.playerJoined(newPlayer.formatName())
        this.updatePlayers()
        break
      }
      case S2C.LEAVE: {
        const cn = m.getCN()
        const player = this.clients[cn]
        if (!player) break
        if (player.active) {
          this.playerDeactivated(player)
        }
        this.chat.playerLeft(player.formatName())
        delete this.clients[cn]
        this.updatePlayers()
        break
      }
      case S2C.RESET: {
        const cn = m.getCN()
        const player = this.clients[cn]
        if (player) {
          player.resetScore()
          this.updatePlayers()
          this.chat.playerReset(player.formatName())
        }
        break
      }
      case S2C.RENAME: {
        const cn = m.getCN()
        const newName = filterName(m.getString(MAX_NAME_LEN))
        const player = this.clients[cn]
        if (player) {
          this.chat.playerRename(player.formatName(), newName)
          player.name = newName
        }
        break
      }
      case S2C.PING: {
        // send pong
        this.room?.send(new ByteWriter()
          .putInt(C2S.PONG)
          .putInt(m.getInt())
          .toArray()
        )
        break
      }
      case S2C.PING_TIME: {
        // ping times
        for (let i = 0; i <= MAX_PLAYERS; i++) {
          const cn = m.getCN()
          if (cn < 0) break
          const ping = m.getInt()
          const player = this.clients[cn]
          if (player) {
            player.ping = ping
          }
        }
        break
      }

      case S2C.CHAT: {
        const cn = m.getCN()
        const flags = m.getInt()
        const target = m.getInt()
        const msg = m.getString(MAX_CHAT_LEN)

        const player = this.clients[cn]
        const playerName = formatClientName(player, cn)
        const targetPlayer = this.clients[target]
        const targetName = targetPlayer
          ? player === this.localClient
            ? 'you'
            : formatClientName(targetPlayer, target)
          : undefined
        this.chat.addChatMessage(playerName, msg, flags, targetName)
        break
      }
      case S2C.ACTIVE: {
        // active
        const cn = m.getCN()
        const active = m.getBool()
        const p = this.clients[cn]
        if (p) {
          p.active = active
          if (active) {
            this.playerActivated(p)
          } else {
            this.playerDeactivated(p)
          }
          this.updatePlayers()
        }
        break
      }
      case S2C.ROUND_WAIT:
        this.roundWait()
        break
      case S2C.ROUND_INTERM:
        this.roundIntermission(INTERMISSION_TIME)
        break
      case S2C.ROUND_START: {
        this.unsetInRound()
        const curRoundPlayers = []
        for (let i = 0; i <= MAX_PLAYERS; i++) {
          const cn = m.getCN()
          if (cn < 0) break
          const p = this.clients[cn]
          if (!p) continue
          p.inRound = true
          curRoundPlayers.push(p)
        }

        this.roundPlayers = curRoundPlayers
        this.roundPlayerQueue = []
        this.roundStart(this.mode.optRoundTime)
        break
      }
      case S2C.READY: {
        const cn = m.getCN()
        const ready = m.getBool()
        const p = this.clients[cn]
        if (p) {
          p.ready = ready
        }
        break
      }
      case S2C.MOVE_CONFIRM:
        this.pendingMove = m.getInt()
        break
      case S2C.END_TURN:
        break
      case S2C.END_ROUND:
        this.processEndRound(m)
        break
      default:
        throw new Error('tag type')
    }
  }

  private processEndRound (m: ByteReader): void {
    const detRandBits = m.getInt()
    const outcomes: number3 = [filterOutcome(m.getInt()), filterOutcome(m.getInt()), filterOutcome(m.getInt())]
    const count: number3 = [m.getFloat64(), m.getFloat64(), m.getFloat64()]
    const botCount = count.slice() as number3
    const humanCount = Math.min(m.getInt(), this.clients.length)

    const ltw = calculateLTW(count, outcomes)

    const moves = ltw.map((x) => ({
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

  private updatePlayers (): void {
    this.leaderboard = sortAndRankPlayers(this.clients, [
      (p) => p.roundStreak,
      (p) => p.roundWins - p.roundLosses,
      (p) => p.roundWins,
      (p) => p.battleWins - p.battleLosses,
      (p) => p.battleWins,
    ])
  }
}

function filterOutcome (o: number): number {
  return o < 0 ? -1 : o > 0 ? 1 : 0
}

type number3 = [number, number, number]
type number33 = [number3, number3, number3]

function calculateLTW (count: number3, battleResults: number3): number33 {
  const ltw: number33 = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
  for (let i = 0; i < 3; i++) {
    if (count[i]) {
      ltw[i][1] += count[i] - 1
      ltw[i][1 + battleResults[i]] += count[(i + 1) % 3]
      ltw[i][1 - battleResults[(i + 2) % 3]] += count[(i + 2) % 3]
    }
  }
  return ltw
}
