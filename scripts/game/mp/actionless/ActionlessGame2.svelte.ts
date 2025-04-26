import { MAX_PLAYERS, filterName, sortAndRankPlayers, formatClientName } from '@gmc/game/common'
import { ByteReader } from '@gmc/game/ByteReader'
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
}

const MAX_NAME_LEN = 20
const MAX_CHAT_LEN = 100

const PROTOCOL_VERSION = 0

const INTERMISSION_TIME = 5000
const ROUND_TIME = 3000

export class ActionlessGame extends OneTurnGame<ActionlessClient, ActionlessGameHistory> {
  mode: ActionlessMode = $state(defaultMode())

  override newClient () { return new ActionlessClient }

  enterGame (room: BaseGameRoom, name: string): void {
    this.setupGame(room)
    this.sendf('is', PROTOCOL_VERSION, name)
  }

  sendReset (): void { this.sendf('i', C2S.RESET) }
  sendRename (newName: string): void { this.sendf('is', C2S.RENAME, newName) }
  sendActive (active: boolean): void { this.sendf('ib', C2S.ACTIVE, active) }
  sendChat (s: string, flags: number, target = -1): void { this.sendf('i3s', C2S.CHAT, flags, target, s.slice(0, MAX_CHAT_LEN)) }
  sendReady (ready: boolean): void { this.sendf('ib', C2S.READY, ready) }

  override processMessage (m: ByteReader): void {
    const type = m.getInt()
    switch (type) {
      case S2C.WELCOME: {
        const protocol = m.getInt()
        if (protocol !== PROTOCOL_VERSION) {
          alert(`different protocol version (client: ${PROTOCOL_VERSION}, server: ${protocol})\nrefresh the page for updates?`)
        }

        this.clients.length = 0

        const myCn = m.getCN()

        this.mode.optIndependent = m.getBool()
        this.mode.optTeams = m.getInt()

        for (let i = 0; i <= MAX_PLAYERS; i++) {
          const cn = m.getCN()
          if (cn < 0) break
          const player = cn == myCn ? this.localClient : new ActionlessClient()
          player.cn = cn
          player.readWelcome(m)
          this.clients[cn] = player
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

        const newPlayer = new ActionlessClient()
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
        this.sendf('i2', C2S.PONG, m.getInt())
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
        this.roundStart(ROUND_TIME)
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
      case S2C.END_ROUND:
        this.processEndRound(m)
        break
      default:
        throw new Error('tag type')
    }
  }

  private processEndRound (m: ByteReader): void {
    const winCount = m.getInt()
    const wins = Array(winCount).fill(false).map(() => m.getBool())
    const playerCount = Math.min(m.getInt(), this.clients.map(Boolean).length)

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

      gameHistoryEntry.wins[win].players.push(p.formatName())
    }
    this.updatePlayers()
    this.addHistory(gameHistoryEntry)
  }

  private updatePlayers (): void {
    this.leaderboard = sortAndRankPlayers(this.clients, [
      (p) => p.streak,
      (p) => p.wins - p.losses,
      (p) => p.wins,
    ])
  }
}
