import { ByteReader } from '@gmc/game/ByteReader'
import { filterChat } from '@gmc/game/CommonGame.svelte'
import { OneTurnClient, OneTurnGame } from '@gmc/game/OneTurnGame.svelte'
import type { BaseGameRoom } from '@gmc/remote/BaseGameRoom'

import { type ActionlessMode, defaultMode } from './gamemode'
import { C2S, S2C } from './protocol'

class ActionlessClient extends OneTurnClient {
  wins = $state(0)
  losses = $state(0)
  total = $state(0)
  streak = $state(0)

  resetScore () {
    this.wins = 0
    this.losses = 0
    this.total = 0
    this.streak = 0
  }

  override readWelcome (m: ByteReader): void {
    super.readWelcome(m)

    this.wins = m.getInt()
    this.losses = m.getInt()
    this.total = this.wins + this.losses
    this.streak = m.getInt()
  }
}

export interface ActionlessGameHistory {
  playerCount: number
  wins: ActionlessGameHistoryWin[]
}

export interface ActionlessGameHistoryWin {
  id: number
  win: boolean
  players: string[]
  meIndex?: number
}

export class ActionlessGame extends OneTurnGame<ActionlessClient, ActionlessGameHistory> {
  mode: ActionlessMode = $state(defaultMode())

  INTERMISSION_TIME = 5000
  ROUND_TIME = 3000

  override newClient () { return new ActionlessClient }

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
  }

  protected processWelcomeMode (m: ByteReader): void {
    this.mode.optIndependent = m.getBool()
    this.mode.optTeams = m.getInt()
  }

  protected processEndRound (m: ByteReader): void {
    const winCount = m.getInt()
    const wins = Array.from({ length: winCount }, () => m.getBool())
    const playerCount = Math.min(m.getInt(), this.roundPlayers.length)

    const gameHistoryEntry: ActionlessGameHistory = {
      playerCount,
      wins: wins.map((w, i) => ({
        id: i,
        win: w,
        players: []
      }))
    }

    for (let i = 0; i < playerCount; i++) {
      const cn = m.getCN()
      const p = this.clients[cn]
      if (!p) continue

      const win = i % winCount
      if (wins[win]) {
        p.wins++
        if (p.streak < 0) p.streak = 0
        p.streak++
      } else {
        p.losses++
        if (p.streak > 0) p.streak = 0
        p.streak--
      }
      p.total++

      const entry = gameHistoryEntry.wins[win]
      if (p == this.localClient) entry.meIndex = entry.players.length
      entry.players.push(p.formatName())
    }
    this.updatePlayers()
    this.addHistory(gameHistoryEntry)
  }

  protected override readonly playersSortProps = [
    (p: ActionlessClient) => p.streak,
    (p: ActionlessClient) => p.wins - p.losses,
    (p: ActionlessClient) => p.wins,
  ]
}
