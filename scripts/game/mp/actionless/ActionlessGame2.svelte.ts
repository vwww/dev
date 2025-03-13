import type ChatState from '@gmc/ChatState.svelte'
import { logBugReportInstructions, filterCN, MAX_PLAYERS, filterName, sortAndRankPlayers, formatPlayerName } from '@gmc/game/common'
import { ByteReader } from '@gmc/game/ByteReader'
import { ByteWriter } from '@gmc/game/ByteWriter'
import type { BaseGameRoom } from '@gmc/remote/BaseGameRoom'

import type { ActionlessMode } from './gamemode'

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
  END_TURN,
}

const enum C2S {
  RESET,
  RENAME,
  PONG,
  CHAT,
  ACTIVE,
  READY,
  MOVE, // unused
  MOVE_END, // unused
}

export const enum GameState {
  WAITING,
  INTERMISSION,
  ACTIVE,
}

class AClient {
  cn = $state(-1)
  name = $state('unnamed')
  active = $state(false)
  rank = $state(0)
  ping = $state(-1)

  ready = $state(false)
  inRound = $state(false)

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

  formatName () {
    return `${this.name} (${this.cn})`
  }
}

export interface AGameHistory {
  playerCount: number
  wins: AGameHistoryWin[]
}

export interface AGameHistoryWin {
  id: number
  win: boolean
  players: string[]
}

const MAX_NAME_LEN = 20
const MAX_CHAT_LEN = 100

const MAX_HISTORY_LEN = 100

const PROTOCOL_VERSION = 0

const INTERMISSION_TIME = 30000
const ROUND_TIME = 20000

export class ActionlessGame {
  mode: ActionlessMode = $state({
    optIndependent: false,
    optTeams: 0,
  })

  localClient = new AClient()
  clients: AClient[] = []
  leaderboard: AClient[] = $state([])
  roundState = $state(GameState.WAITING)
  roundTimerStart = $state(0)
  roundTimerEnd = $state(0)

  roundPlayers: AClient[] = $state([])
  roundPlayerQueue: AClient[] = $state([])

  pastGames: AGameHistory[] = $state([])

  room?: BaseGameRoom = $state()

  constructor (public chat: ChatState) {
    setTimeout(logBugReportInstructions, 100)
  }

  enterGame (room: BaseGameRoom, name: string) {
    this.room?.disconnect()
    this.room = room
    room.registerRecv((msg) => {
      if (this.room === room) {
        const m = new ByteReader(msg)
        try {
          while (m.remaining > 0) {
            this.processMessage(m)
          }
          if (m.overread) {
            throw new Error('overread')
          }
        } catch (error) {
          console.error('neterr', error)
          console.log(m.debugBuf, m)
          this.room.disconnect()
        }
      }
    })
    room.registerDisc(() => {
      if (this.room === room) {
        this.chat.addSysMessage('You disconnected.')
        this.room = undefined
      } else {
        this.chat.addSysMessage('You disconnected from the old room.')
      }
    })

    const welcomeBuf = new ByteWriter()
    welcomeBuf.putInt(PROTOCOL_VERSION)
    welcomeBuf.putString(name)
    room.send(welcomeBuf.toArray())

    this.chat.addSysMessage('You are joining the game.')
  }

  leaveGame () {
    this.room?.disconnect()
  }

  sendReset (): void {
    this.room?.send(new ByteWriter()
      .putInt(C2S.RESET)
      .toArray()
    )
  }

  sendRename (newName: string): void {
    this.room?.send(new ByteWriter()
      .putInt(C2S.RENAME)
      .putString(newName)
      .toArray()
    )
  }

  sendActive (active: boolean): void {
    this.room?.send(new ByteWriter()
      .putInt(C2S.ACTIVE)
      .putBool(active)
      .toArray()
    )
  }

  sendChat (s: string, flags: number, target = -1): void {
    if (!this.room) {
      this.chat.addSysMessage('cannot send chat message: not connected to game room')
      return
    }
    this.room.send(new ByteWriter()
      .putInt(C2S.CHAT)
      .putInt(flags)
      .putInt(target)
      .putString(s.slice(0, MAX_CHAT_LEN))
      .toArray()
    )
  }

  sendReady (ready: boolean): void {
    this.room?.send(new ByteWriter()
      .putInt(C2S.READY)
      .putBool(ready)
      .toArray()
    )
  }

  // sendMoveEnd (): void {
  //   this.room?.send(new ByteWriter()
  //     .putInt(C2S.MOVE_END)
  //     .toArray()
  //   )
  // }

  addHistory (history: AGameHistory) {
    if (this.pastGames.length >= MAX_HISTORY_LEN)
      this.pastGames.pop()
    this.pastGames.unshift(history)
  }

  clearHistory () {
    this.pastGames = []
  }

  private processMessage (m: ByteReader) {
    const type = m.getInt()
    switch (type) {
      case S2C.WELCOME: {
        const protocol = m.getInt()
        if (protocol !== PROTOCOL_VERSION) {
          alert(`different protocol version (client: ${PROTOCOL_VERSION}, server: ${protocol})\nrefresh the page for updates?`)
        }

        this.clients.length = 0

        const myCn = filterCN(m.getInt())

        this.mode.optIndependent = m.getBool()
        this.mode.optTeams = m.getInt()

        for (let i = 0; i <= MAX_PLAYERS; i++) {
          const cn = m.getInt()
          if (cn < 0) break
          const player = cn == myCn ? this.localClient : new AClient()
          player.cn = cn
          player.active = m.getBool()
          player.name = filterName(m.getString(MAX_NAME_LEN))
          player.ping = m.getInt()

          player.ready = false
          player.inRound = false

          player.wins = m.getInt()
          player.losses = m.getInt()
          player.total = player.wins + player.losses
          player.streak = m.getInt()
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

        const newPlayer = new AClient()
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
        const playerName = formatPlayerName(player, cn)
        const targetPlayer = this.clients[target]
        const targetName = targetPlayer
          ? player === this.localClient
            ? 'you'
            : formatPlayerName(targetPlayer, target)
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
        const curRoundPlayers = []
        for (const p of this.clients) {
          p.inRound = false
        }
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

  private processEndRound(m: ByteReader) {
    const winCount = m.getInt()
    const wins = Array(winCount).fill(false).map(() => m.getBool())
    const playerCount = Math.min(m.getInt(), this.clients.map(Boolean).length)

    const gameHistoryEntry: AGameHistory = {
      playerCount,
      wins: wins.map((w, i) => ({
        id: i,
        win: w,
        players: []
      }))
    }

    for (let i = 0; i < playerCount; i++) {
      const cn = m.getInt()
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

  private updatePlayers () {
    this.leaderboard = sortAndRankPlayers(this.clients, [
      (p) => p.streak,
      (p) => p.wins - p.losses,
      (p) => p.wins,
    ])
  }

  private playerActivated (player: AClient): void {
    this.roundPlayerQueue.push(player)
  }

  private playerDeactivated (player: AClient): void {
    this.roundPlayers = this.roundPlayers.filter((p) => p !== player)
    this.roundPlayerQueue = this.roundPlayerQueue.filter((p) => p !== player)
    player.inRound = false
  }

  private roundWait (): void {
    this.roundState = GameState.WAITING
    this.unsetReady()
  }

  private roundIntermission (remain: number): void {
    this.roundState = GameState.INTERMISSION
    this.setTimer(remain)
    this.unsetReady()
  }

  private roundStart (remain: number): void {
    this.roundState = GameState.ACTIVE
    this.setTimer(remain)
    this.unsetReady()
  }

  private setTimer (remain: number): void {
    this.roundTimerStart = Date.now()
    this.roundTimerEnd = Date.now() + remain
  }

  private unsetReady (): void {
    for (const c of this.clients) {
      c.ready = false
    }
  }
}
