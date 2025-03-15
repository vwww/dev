import { clamp } from '@/util'
import { isNearWin, isWin } from '@gc/t3/game'
import type ChatState from '@gmc/ChatState.svelte'
import { logBugReportInstructions, filterCN, MAX_PLAYERS, filterName, sortAndRankPlayers, formatPlayerName } from '@gmc/game/common'
import { ByteReader } from '@gmc/game/ByteReader'
import { ByteWriter } from '@gmc/game/ByteWriter'
import type { BaseGameRoom } from '@gmc/remote/BaseGameRoom'

import { defaultMode, type T3Mode } from './gamemode'

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
  OFFER_DRAW,
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
  FORFEIT,
  OFFER_DRAW,
  REJECT_DRAW,
}

export const enum GameState {
  WAITING,
  INTERMISSION,
  ACTIVE,
}

class TPTurnClient {
  cn = $state(-1)
  name = $state('unnamed')
  active = $state(false)
  rank = $state(0)
  ping = $state(-1)

  ready = $state(false)
  inRound = $state(false)

  score = $state(0) // 4 * win + 2 * tie + loss
  wins = $state(0)
  loss = $state(0)
  ties = $state(0)
  total = $state(0)
  streak = $state(0)

  resetScore () {
    this.score = 0
    this.wins = 0
    this.loss = 0
    this.ties = 0
    this.total = 0
    this.streak = 0
  }

  formatName () {
    return `${this.name} (${this.cn})`
  }
}

export interface TPTurnHistory {
  p0Name: string
  p1Name: string
  winner: number
  earlyEnd: boolean // forfeit or tie by agreement
  ply: number
}

const MAX_NAME_LEN = 20
const MAX_CHAT_LEN = 100

const MAX_HISTORY_LEN = 100

const PROTOCOL_VERSION = 0

const INTERMISSION_TIME = 30000

const MAX_TURNS = 9

export class T3Game {
  mode: T3Mode = $state(defaultMode())

  boardState = $state(0)
  boardBad = $state(0)
  moveHistory = $state([] as number[])

  localClient = new TPTurnClient()
  clients: TPTurnClient[] = []
  leaderboard: TPTurnClient[] = $state([])
  roundState = $state(GameState.WAITING)
  roundTimerStart = $state(0)
  roundTimerEnd = $state(0)

  roundPlayers: TPTurnClient[] = $state([])
  roundPlayerQueue: TPTurnClient[] = $state([])

  p0 = -1
  p1 = -1
  ply = $state(0)
  winner = $state(0)
  myTurn = $state(false)
  myPlayer = $state(0)
  drawOffer = $state(0)

  pastGames: TPTurnHistory[] = $state([])

  room?: BaseGameRoom = $state()

  constructor (public chat: ChatState) {
    setTimeout(logBugReportInstructions, 100)
  }

  enterGame (room: BaseGameRoom, name: string): void {
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

  leaveGame (): void {
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

  sendMove (n: number): void {
    this.room?.send(new ByteWriter()
      .putInt(C2S.MOVE)
      .putInt(n)
      .toArray()
    )
  }

  sendMoveEnd (): void {
    this.room?.send(new ByteWriter()
      .putInt(C2S.MOVE_END)
      .toArray()
    )
  }

  sendResign (): void {
    this.room?.send(new ByteWriter()
      .putInt(C2S.FORFEIT)
      .toArray()
    )
  }

  sendDrawOffer (): void {
    this.room?.send(new ByteWriter()
      .putInt(C2S.OFFER_DRAW)
      .toArray()
    )
  }

  sendDrawReject (): void {
    this.room?.send(new ByteWriter()
      .putInt(C2S.REJECT_DRAW)
      .toArray()
    )
  }

  addHistory (history: TPTurnHistory): void {
    if (this.pastGames.length >= MAX_HISTORY_LEN)
      this.pastGames.pop()
    this.pastGames.unshift(history)
  }

  clearHistory (): void {
    this.pastGames = []
  }

  private processMessage (m: ByteReader): void {
    const type = m.getInt()
    switch (type) {
      case S2C.WELCOME: {
        const protocol = m.getInt()
        if (protocol !== PROTOCOL_VERSION) {
          alert(`different protocol version (client: ${PROTOCOL_VERSION}, server: ${protocol})\nrefresh the page for updates?`)
        }

        this.clients.length = 0

        const myCn = filterCN(m.getInt())

        this.mode.optTurnTime = m.getInt()
        this.mode.optInverted = m.getBool()
        this.mode.optChecked = m.getBool()
        this.mode.optQuick = m.getBool()

        for (let i = 0; i <= MAX_PLAYERS; i++) {
          const cn = m.getInt()
          if (cn < 0) break
          const p = cn == myCn ? this.localClient : new TPTurnClient()
          p.cn = cn
          p.active = m.getBool()
          p.name = filterName(m.getString(MAX_NAME_LEN))
          p.ping = m.getInt()

          p.ready = false
          p.inRound = false

          p.wins = m.getInt()
          p.loss = m.getInt()
          p.ties = m.getInt()
          p.total = p.wins + p.loss + p.ties
          p.streak = m.getInt()
          p.score = (((p.wins << 1) + p.ties) << 1) + p.loss
          this.clients[cn] = p
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

        this.resetRound()
        this.processPlayerInfo(m)
        this.processRoundInfo(m)

        this.updatePlayers()
        break
      }
      case S2C.JOIN: {
        const cn = m.getInt()
        const name = filterName(m.getString(MAX_NAME_LEN))
        if (this.clients[cn]) break

        const newPlayer = new TPTurnClient()
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
        this.roundStart(this.mode.optTurnTime)

        this.resetRound()
        this.processPlayerInfo(m)
        this.reset()
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
        m.getInt() // pendingMoveAck
        break
      case S2C.END_TURN:
        this.processEndTurn(m)
        break
      case S2C.END_ROUND:
        this.processEndRound(m)
        break
      case S2C.OFFER_DRAW: {
        const drawReq = m.getInt()
        const cn = m.getInt()

        this.drawOffer = drawReq && (cn === this.localClient.cn ? 1 : 2)
        break
      }
      default:
        throw new Error('tag type')
    }
  }

  private processEndTurn (m: ByteReader): void {
    const move = clamp(m.getInt(), 0, 9 - 1)
    this.applyMove(move)

    this.ply++
    const myPlayer = this.myPlayer
    this.myTurn = !!myPlayer && (this.ply & 1) === myPlayer - 1

    this.setTimer(this.mode.optTurnTime)
  }

  private processEndRound (m: ByteReader): void {
    const winner = m.getInt()
    const earlyEnd = m.getBool()
    const p0 = this.clients[this.p0]
    const p1 = this.clients[this.p1]

    if (p0) this.setResult(p0, winner)
    if (p1) this.setResult(p1, 1 - winner)

    this.addHistory({
      p0Name: formatPlayerName(p0, this.p0),
      p1Name: formatPlayerName(p1, this.p1),
      winner,
      earlyEnd,
      ply: this.ply,
    })

    this.winner = winner + 1
    this.drawOffer = 0
  }

  private processRoundInfo (m: ByteReader): void {
    this.reset()
    for (let i = 0; i <= MAX_TURNS; i++) {
      this.ply = i // applyMove needs correct ply
      const move = m.getInt()
      if (move < 0) {
        break
      }
      this.applyMove(move)
    }
  }

  private updatePlayers (): void {
    this.leaderboard = sortAndRankPlayers(this.clients, [
      (p) => p.streak,
      (p) => p.score,
      (p) => p.wins,
    ])
  }

  private playerActivated (player: TPTurnClient): void {
    this.roundPlayerQueue.push(player)
  }

  private playerDeactivated (player: TPTurnClient): void {
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
      if (c) c.ready = false
    }
  }

  private unsetInRound (): void {
    for (const c of this.clients) {
      if (c) c.inRound = false
    }
  }

  private resetRound (): void {
    this.ply = 0
    this.winner = 0
    this.drawOffer = 0
  }

  private processPlayerInfo (m: ByteReader): void {
    this.p0 = m.getInt()
    this.p1 = m.getInt()

    const { cn } = this.localClient
    this.myPlayer =
      this.p0 === cn
        ? 1
        : this.p1 === cn
          ? 2
          : 0
    this.myTurn = (this.myPlayer === 1)
  }

  private setResult (p: TPTurnClient, win: number): void {
    if (!win) {
      p.wins++
      if (p.streak < 0) p.streak = 0
      p.streak++
      p.score += 4
    } else if (win === 1) {
      p.loss++
      if (p.streak > 0) p.streak = 0
      p.streak--
      p.score++
    } else {
      p.ties++
      p.score += 2
    }
    p.total++
  }

  private reset (): void {
    this.boardState = 0
    this.boardBad = 0
    this.moveHistory = []
  }

  private applyMove (move: number): void {
    const mark = 1 << (this.ply & 1)

    const board = this.boardState | (mark << (move << 1))
    this.boardState = board
    this.boardBad = this.calcBoardBadMoves(board, this.ply + 1)

    this.moveHistory.push(move)
  }

  private calcBoardBadMoves (board: number, ply: number): number {
    let bad = 0
    if (this.mode.optChecked) {
      const parity = ply & 1
      const mark = 1 << parity
      for (let i = 0; i < 9; i++) {
        const boardNext = board | (mark << (i << 1))
        if (this.mode.optInverted ? isWin(boardNext, !!parity) : isNearWin(boardNext, !parity)) {
          bad |= 1 << i
        }
      }
    }
    return bad
  }
}
