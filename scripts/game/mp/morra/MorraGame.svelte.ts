import { ByteReader } from '@gmc/game/ByteReader'
import { filterChat } from '@gmc/game/CommonGame.svelte'
import { OneTurnClient, OneTurnGame } from '@gmc/game/OneTurnGame.svelte'
import type { BaseGameRoom } from '@gmc/remote/BaseGameRoom'

import { defaultMode, type MorraMode } from './gamemode'

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

class MorraClient extends OneTurnClient {
  wins = $state(0)
  loss = $state(0)
  streak = $state(0)

  score = $state(0)
  total = $state(0)

  resetScore () {
    this.wins = 0
    this.loss = 0
    this.streak = 0
    this.score = 0
    this.total = 0
  }

  canResetScore () {
    return this.total
  }

  addWin () {
    if (this.streak < 0) this.streak = 0
    this.streak++
    this.score++
    this.wins++
    this.total++
  }

  addLoss () {
    if (this.streak > 0) this.streak = 0
    this.streak--
    this.score--
    this.loss++
    this.total++
  }

  override readWelcome (m: ByteReader): void {
    super.readWelcome(m)

    this.wins = m.getInt()
    this.loss = m.getInt()
    this.streak = m.getInt()

    this.score = this.wins - this.loss
    this.total = this.wins + this.loss
  }
}

export interface MorraGameHistory {
  playerCount: number
  moveSum: bigint
  moveRnd: number
  winner: number
  inverted: boolean
  teams: MorraGameHistoryTeam[]
}

export interface MorraGameHistoryTeam {
  winner: boolean
  moveSum: bigint
  players: MorraGameHistoryPlayer[]
  meIndex?: number
}

export interface MorraGameHistoryPlayer {
  name: string
  cn: number
  move: bigint
}

export class MorraGame extends OneTurnGame<MorraClient, MorraGameHistory> {
  mode: MorraMode = $state(defaultMode())

  pendingMove = $state(0)
  pendingMoveAck = $state(0)

  INTERMISSION_TIME = 5000
  ROUND_TIME = 3000

  override newClient () { return new MorraClient }

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
  sendMove (): void { this.sendf('iU', C2S.MOVE, BigInt(this.pendingMove)) }

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
    this.mode.optInverted = !!(modeFlags & (1 << 0))
    this.mode.optAddRandom = !!(modeFlags & (1 << 1))
    this.mode.optTeams = m.getInt()
  }

  protected override processRoundStart (m: ByteReader): void {
    super.processRoundStart(m)

    if (this.localClient.inRound) {
      this.pendingMove = Math.floor(Math.random() * (this.mode.optTeams || this.roundPlayers.length))
      this.sendMove()
    }
  }

  protected processMoveConfirm (m: ByteReader): void {
    this.pendingMoveAck = Number(m.getUint64())
  }

  protected processEndRound (m: ByteReader): void {
    const teamCount = Math.min(m.getInt(), this.clients.length)
    const moveSum = m.getUint64()
    const moveRnd = m.getInt()
    const playerCount = Math.min(m.getInt(), this.clients.length)
    const inverted = this.mode.optInverted
    const winner = Number(moveSum % BigInt(teamCount))

    const gameHistoryEntry: MorraGameHistory = {
      playerCount,
      moveSum,
      moveRnd,
      winner,
      inverted,
      teams: Array.from({ length: teamCount }, (_, id) => ({
        id,
        winner: (id === winner) !== inverted,
        moveSum: 0n,
        players: [] as MorraGameHistoryPlayer[]
      })),
    }

    for (let i = 0; i < playerCount; i++) {
      const cn = m.getCN()
      if (cn < 0) break
      const move = m.getUint64()

      const p = this.clients[cn]
      if (!p) continue

      const team = i % teamCount
      const teamObj = gameHistoryEntry.teams[team]

      p[teamObj.winner ? 'addWin' : 'addLoss']()

      if (p == this.localClient) teamObj.meIndex = teamObj.players.length
      teamObj.moveSum += move
      teamObj.players.push({
        name: p.name,
        cn: p.cn,
        move
      })
    }
    this.updatePlayers()
    this.addHistory(gameHistoryEntry)
  }

  protected override readonly playersSortProps = [
    (p: MorraClient) => p.streak,
    (p: MorraClient) => p.score,
    (p: MorraClient) => p.wins,
  ]
}
