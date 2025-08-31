import { clamp } from '@/util'
import { isFull, isNearWin, isWin } from '@gc/t3/game'
import { ByteReader } from '@gmc/game/ByteReader'
import { filterChat } from '@gmc/game/CommonGame.svelte'
import { TwoPlayerTurnGame } from '@gmc/game/TwoPlayerTurnGame.svelte'
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
  END_ROUND,
  MOVE_CONFIRM,
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

const MAX_TURNS = 81

export class UT3Game extends TwoPlayerTurnGame {
  mode: UT3Mode = $state(defaultMode())

  boardStates = $state([INITIAL_STATE])
  boardIndex = $state(0)
  moveHistory = $state([] as [number, number][])

  get ROUND_TIME () { return this.mode.optTurnTime }
  INTERMISSION_TIME = 30000

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
  sendMove (board: number, pos: number): void { this.sendf('i3', C2S.MOVE, board, pos) }
  sendMoveEnd (): void { this.sendf('i', C2S.MOVE_END) }
  sendResign (): void { this.sendf('i', C2S.FORFEIT) }
  sendDrawOffer (): void { this.sendf('i', C2S.OFFER_DRAW) }
  sendDrawReject (): void { this.sendf('i', C2S.REJECT_DRAW) }

  historyGo (index: number): void {
    this.boardIndex = clamp(index, 0, this.moveHistory.length)
  }

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
    [S2C.END_TURN]: this.processEndTurn,
    [S2C.OFFER_DRAW]: this.processOfferDraw,
  }

  protected processWelcomeMode (m: ByteReader): void {
    this.mode.optTurnTime = m.getInt()
    const modeFlags = m.get()
    this.mode.optInverted = !!(modeFlags & (1 << 0))
    this.mode.optChecked = !!(modeFlags & (1 << 1))
    this.mode.optQuick = !!(modeFlags & (1 << 2))
    this.mode.optAnyBoard = !!(modeFlags & (1 << 3))
  }

  protected processMoveConfirm (m: ByteReader): void {
    m.getInt() // pendingMoveBoard
    m.getInt() // pendingMovePos
  }

  private processEndTurn (m: ByteReader): void {
    const board = m.getInt()
    const pos = m.getInt()
    this.applyMove(board, pos)

    this.nextTurn()
    this.setTimer(this.mode.optTurnTime)
  }

  protected processRoundInfo (m: ByteReader): void {
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

  protected processRoundStartInfo (m: ByteReader): void {
    this.reset()
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
