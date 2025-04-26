import { filterCN, MAX_PLAYERS, filterName, sortAndRankPlayers, formatClientName } from '@gmc/game/common'
import { ByteReader } from '@gmc/game/ByteReader'
import { ByteWriter } from '@gmc/game/ByteWriter'
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

class MorraClient extends OneTurnClient {
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

export interface MorraGameHistory {
  playerCount: number
  moveSum: number
  moveRnd: number
  winner: number
  inverted: boolean
  teams: MorraGameHistoryTeam[]
}

export interface MorraGameHistoryTeam {
  winner: boolean
  moveSum: number
  players: MorraGameHistoryPlayer[]
}

export interface MorraGameHistoryPlayer {
  name: string
  cn: number
  move: number
}

const MAX_NAME_LEN = 20
const MAX_CHAT_LEN = 100

const PROTOCOL_VERSION = 0

const INTERMISSION_TIME = 5000
const ROUND_TIME = 3000

export class MorraGame extends OneTurnGame<MorraClient, MorraGameHistory> {
  mode: MorraMode = $state(defaultMode())

  pendingMove = $state(0)
  pendingMoveAck = $state(0)

  override newClient () { return new MorraClient }

  enterGame (room: BaseGameRoom, name: string): void {
    this.setupGame(room)
    this.sendf('is', PROTOCOL_VERSION, name)
  }

  sendReset (): void { this.sendf('i', C2S.RESET) }
  sendRename (newName: string): void { this.sendf('is', C2S.RENAME, newName) }
  sendActive (active: boolean): void { this.sendf('ib', C2S.ACTIVE, active) }
  sendChat (s: string, flags: number, target = -1): void { this.sendf('i3s', C2S.CHAT, flags, target, s.slice(0, MAX_CHAT_LEN)) }
  sendReady (ready: boolean): void { this.sendf('ib', C2S.READY, ready) }
  sendMove (): void { this.sendf('id', C2S.MOVE, this.pendingMove) }
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

        const myCn = filterCN(m.getInt())

        this.mode.optInverted = m.getBool()
        this.mode.optAddRandom = m.getBool()
        this.mode.optTeams = m.getInt()

        for (let i = 0; i <= MAX_PLAYERS; i++) {
          const cn = m.getInt()
          if (cn < 0) break
          const player = cn == myCn ? this.localClient : new MorraClient()
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
            const cn = m.getInt()
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
          const cn = m.getInt()
          if (cn < 0) break
          const p = this.clients[cn]
          if (!p) continue
          p.inRound = true
          curRoundPlayers.push(p)
        }
        this.roundPlayers = curRoundPlayers

        const curRoundQueue = []
        for (let i = 0; i <= MAX_PLAYERS; i++) {
          const cn = m.getInt()
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
        const cn = m.getInt()
        const name = filterName(m.getString(MAX_NAME_LEN))
        if (this.clients[cn]) break

        const newPlayer = new MorraClient()
        newPlayer.cn = cn
        newPlayer.name = name

        this.clients[cn] = newPlayer

        this.chat.playerJoined(newPlayer.formatName())
        this.updatePlayers()
        break
      }
      case S2C.LEAVE: {
        const cn = m.getInt()
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
        const cn = m.getInt()
        const player = this.clients[cn]
        if (player) {
          player.resetScore()
          this.updatePlayers()
          this.chat.playerReset(player.formatName())
        }
        break
      }
      case S2C.RENAME: {
        const cn = m.getInt()
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
          const cn = m.getInt()
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
        const cn = m.getInt()
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
        const cn = m.getInt()
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
          const cn = m.getInt()
          if (cn < 0) break
          const p = this.clients[cn]
          if (!p) continue
          p.inRound = true
          curRoundPlayers.push(p)
        }

        this.roundPlayers = curRoundPlayers
        this.roundPlayerQueue = []
        this.roundStart(ROUND_TIME)

        if (this.localClient.inRound) {
          this.pendingMove = Math.floor(Math.random() * 8000000000001)
          this.sendMove()
        }
        break
      }
      case S2C.READY: {
        const cn = m.getInt()
        const ready = m.getBool()
        const p = this.clients[cn]
        if (p) {
          p.ready = ready
        }
        break
      }
      case S2C.MOVE_CONFIRM:
        this.pendingMoveAck = m.getFloat64()
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
    const teamCount = Math.min(m.getInt(), this.clients.length)
    const moveSum = m.getFloat64()
    const moveRnd = m.getInt()
    const playerCount = Math.min(m.getInt(), this.clients.length)
    const inverted = this.mode.optInverted
    const winner = moveSum % teamCount

    const gameHistoryEntry: MorraGameHistory = {
      playerCount,
      moveSum,
      moveRnd,
      winner,
      inverted,
      teams: Array(teamCount).fill(false).map((_, id) => ({
        id,
        winner: (id === winner) !== inverted,
        moveSum: 0,
        players: [] as MorraGameHistoryPlayer[]
      })),
    }

    for (let i = 0; i < playerCount; i++) {
      const cn = m.getInt()
      if (cn < 0) break
      const move = m.getFloat64()

      const p = this.clients[cn]
      if (!p) continue

      const team = i % teamCount
      const teamObj = gameHistoryEntry.teams[team]

      if (teamObj.winner) {
        p.wins++
        if (p.streak < 0) p.streak = 0
        p.streak++
      } else {
        p.losses++
        if (p.streak > 0) p.streak = 0
        p.streak--
      }
      p.total++

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

  private updatePlayers (): void {
    this.leaderboard = sortAndRankPlayers(this.clients, [
      (p) => p.streak,
      (p) => p.wins - p.losses,
      (p) => p.wins,
    ])
  }
}
