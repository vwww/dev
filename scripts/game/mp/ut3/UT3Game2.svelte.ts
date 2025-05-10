import { clamp } from '@/util'
import { isFull, isNearWin, isWin } from '@gc/t3/game'
import { MAX_PLAYERS, filterName, sortAndRankPlayers, formatClientName } from '@gmc/game/common'
import { ByteReader } from '@gmc/game/ByteReader'
import { ByteWriter } from '@gmc/game/ByteWriter'
import { TwoPlayerTurnClient, TwoPlayerTurnGame } from '@gmc/game/TwoPlayerTurnGame.svelte'
import type { BaseGameRoom } from '@gmc/remote/BaseGameRoom'

import { defaultMode, type UT3Mode } from './gamemode'

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

export interface BoardState {
  board: number
  boards: BoardStates
  boardRestrict: BoardStates
  boardFinal: number
  boardMustMove: number
}

type BoardStates = [number, number, number, number, number, number, number, number, number]

const INITIAL_STATE: BoardState = {
  board: 0,
  boards: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  boardRestrict: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  boardFinal: 0,
  boardMustMove: -1,
}

const MAX_NAME_LEN = 20
const MAX_CHAT_LEN = 100

const PROTOCOL_VERSION = 0

const INTERMISSION_TIME = 30000

const MAX_TURNS = 81

export class UT3Game extends TwoPlayerTurnGame {
  mode: UT3Mode = $state(defaultMode())

  boardStates = $state([INITIAL_STATE])
  boardIndex = $state(0)
  moveHistory = $state([] as [number, number][])

  enterGame (room: BaseGameRoom, name: string): void {
    this.setupGame(room)
    this.sendf('is', PROTOCOL_VERSION, name)
  }

  sendReset (): void { this.sendf('i', C2S.RESET) }
  sendRename (newName: string): void { this.sendf('is', C2S.RENAME, newName) }
  sendActive (active: boolean): void { this.sendf('ib', C2S.ACTIVE, active) }
  sendChat (s: string, flags: number, target = -1): void { this.sendf('i3s', C2S.CHAT, flags, target, s.slice(0, MAX_CHAT_LEN)) }
  sendReady (ready: boolean): void { this.sendf('ib', C2S.READY, ready) }
  sendMove (board: number, pos: number): void { this.sendf('i3', C2S.MOVE, board, pos) }
  sendMoveEnd (): void { this.sendf('i', C2S.MOVE_END) }
  sendResign (): void { this.sendf('i', C2S.FORFEIT) }
  sendDrawOffer (): void { this.sendf('i', C2S.OFFER_DRAW) }
  sendDrawReject (): void { this.sendf('i', C2S.REJECT_DRAW) }

  historyGo (index: number): void {
    this.boardIndex = clamp(index, 0, this.moveHistory.length)
  }

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

        this.mode.optTurnTime = m.getInt()
        this.mode.optInverted = m.getBool()
        this.mode.optChecked = m.getBool()
        this.mode.optQuick = m.getBool()
        this.mode.optAnyBoard = m.getBool()

        for (let i = 0; i <= MAX_PLAYERS; i++) {
          const cn = m.getCN()
          if (cn < 0) break
          const p = cn == myCn ? this.localClient : new TwoPlayerTurnClient()
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

        this.resetRound()
        this.processPlayerInfo(m)
        this.processRoundInfo(m)

        this.updatePlayers()
        break
      }
      case S2C.JOIN: {
        const cn = m.getCN()
        const name = filterName(m.getString(MAX_NAME_LEN))
        if (this.clients[cn]) break

        const newPlayer = new TwoPlayerTurnClient()
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
        this.roundStart(this.mode.optTurnTime)

        this.resetRound()
        this.processPlayerInfo(m)
        this.reset()
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
        m.getInt() // pendingMoveBoard
        m.getInt() // pendingMovePos
        break
      case S2C.END_TURN:
        this.processEndTurn(m)
        break
      case S2C.END_ROUND:
        this.processEndRound(m)
        break
      case S2C.OFFER_DRAW:
        this.processOfferDraw(m)
        break
      default:
        throw new Error('tag type')
    }
  }

  private processEndTurn (m: ByteReader): void {
    const board = m.getInt()
    const pos = m.getInt()
    this.applyMove(board, pos)

    this.nextTurn()
    this.setTimer(this.mode.optTurnTime)
  }

  private processRoundInfo (m: ByteReader): void {
    this.reset()
    for (let i = 0; i <= MAX_TURNS; i++) {
      const board = m.getInt()
      if (board < 0) {
        this.ply = i
        break
      }
      const pos = m.getInt()
      this.applyMove(board, pos)
    }
  }

  private updatePlayers (): void {
    this.leaderboard = sortAndRankPlayers(this.clients, [
      (p) => p.streak,
      (p) => p.score,
      (p) => p.wins,
    ])
  }

  private reset (): void {
    this.boardStates = [INITIAL_STATE]
    this.boardIndex = 0
    this.moveHistory = []
  }

  private applyMove (moveBoard: number, movePos: number): void {
    const boardStates = this.boardStates
    const moveHistory = this.moveHistory

    const state = boardStates[boardStates.length - 1]
    const parityInv = (boardStates.length & 1)
    const parity = parityInv ^ 1

    let { board, boardFinal } = state
    const boards = state.boards.slice(0) as BoardStates

    const posFlag = 1 << ((movePos << 1) + parity)
    const posFlagFinal = 1 << movePos
    const boardFlag = 1 << ((moveBoard << 1) + parity)
    const boardFlagFinal = 1 << moveBoard
    boards[moveBoard] |= posFlag
    if (isWin(boards[moveBoard], !!parity)) {
      board |= boardFlag
      boardFinal |= boardFlagFinal
    } else if (isFull(boards[moveBoard])) {
      boardFinal |= boardFlagFinal
    }

    const boardMustMove = this.mode.optAnyBoard || (boardFinal & posFlagFinal) ? -1 : movePos

    const moveDisallowed = (moveBoard: number, movePos: number): boolean => {
      // Special Checks
      if (this.mode.optChecked) {
        const posFlag = 1 << ((movePos << 1) + parityInv)
        if (this.mode.optInverted) {
          // inverted: cannot move if it'd cause a win
          if (isWin(boards[moveBoard] | posFlag, !parity) &&
            (this.mode.optQuick || isWin(board | 1 << ((moveBoard << 1) + parityInv), !parity))) {
            return true
          }
        } else {
          // uninverted: cannot move if it'd allow a loss
          const newFlags = boards[movePos] | (moveBoard === movePos ? posFlag : 0)
          if (this.mode.optAnyBoard || !this.mode.optQuick &&
              ((boardFinal & (1 << movePos)) ||
                isFull(newFlags) ||
                isWin(newFlags, !parity))) {
            // next move can be on any board
            for (let i = 0; i < 9; i++) {
              if (!(boardFinal & (1 << i)) &&
                isNearWin(boards[i] | (i === moveBoard ? posFlag : 0), !parityInv) &&
                (this.mode.optQuick || isWin(board | (1 << ((i << 1) + parity)), !parityInv))) {
                return true
              }
            }
          } else if (isNearWin(newFlags, !parityInv) &&
              (this.mode.optQuick ||
                isWin(board | (1 << ((movePos << 1) + parity)), !parityInv))) {
            return true
          }
        }
      }
      return false
    }

    boardStates.push({
      board,
      boards,
      boardFinal,
      boardMustMove,
      boardRestrict: [0, 1, 2, 3, 4, 5, 6, 7, 8].map((board) => {
        if (!(board === boardMustMove || boardMustMove < 0 && !(boardFinal & (1 << board)))) return 0b111111111
        let r = 0
        for (let pos = 0; pos < 9; pos++) {
          if (moveDisallowed(board, pos)) {
            r |= 1 << pos
          }
        }
        return r
      }) as BoardStates
    })
    moveHistory.push([moveBoard, movePos])

    this.boardStates = boardStates
    this.moveHistory = moveHistory
    if (this.boardIndex === boardStates.length - 2) {
      this.boardIndex++
    }
  }
}
