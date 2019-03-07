import { clamp } from '@/util'
import { isFull, isNearWin, isWin } from '@gc/t3/game'
import { ByteReader } from '@gmc/game/ByteReader'
import { ByteWriter } from '@gmc/game/ByteWriter'
import { TurnC2S } from '@/game/mp/common/game/TurnBasedGame.svelte'
import { type TPTurnClient, TPTurnGame } from '@/game/mp/common/game/TwoPlayerGame.svelte'

interface UT3Client extends TPTurnClient { }

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

export default class UT3Game extends TPTurnGame<UT3Client> {
  public modeTurnTime = $state(0)
  public modeInverted = $state(false)
  public modeChecked = $state(false)
  public modeQuick = $state(false)
  public modeAnyBoard = $state(false)

  public boardStates = $state([INITIAL_STATE])
  public boardIndex = $state(0)
  public moveHistory = $state([] as [number, number][])

  protected override ROUND_TIME = 0 // set by mode

  protected override readonly playersSortProps = [
    (p: UT3Client) => p.streak,
    (p: UT3Client) => p.score,
    (p: UT3Client) => p.wins,
  ]

  sendMove (board: number, pos: number): void {
    // if rewinded, don't send
    if (this.boardIndex !== this.ply) return

    this.room?.send(new ByteWriter()
      .putInt(TurnC2S.MOVE)
      .putInt(board)
      .putInt(pos)
      .toArray()
    )
  }

  historyGo (index: number): void {
    this.boardIndex = clamp(index, 0, this.moveHistory.length)
  }

  protected processMoveConfirm (m: ByteReader): void {
    m.getInt() // pendingMoveBoard
    m.getInt() // pendingMovePos
  }

  protected override processRoundInfo (m: ByteReader): void {
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

  protected processEndTurn2 (m: ByteReader): void {
    const board = m.getInt()
    const pos = m.getInt()
    this.applyMove(board, pos)
  }

  protected processWelcomeMode (m: ByteReader): void {
    this.modeTurnTime = this.ROUND_TIME = m.getInt()
    this.modeInverted = m.getBool()
    this.modeChecked = m.getBool()
    this.modeQuick = m.getBool()
    this.modeAnyBoard = m.getBool()
  }

  protected makePlayer (): UT3Client {
    return { ...TPTurnGame.DEFAULT_PLAYER }
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

    const boardMustMove = this.modeAnyBoard || (boardFinal & posFlagFinal) ? -1 : movePos

    const moveDisallowed = (moveBoard: number, movePos: number): boolean => {
      // Special Checks
      if (this.modeChecked) {
        const posFlag = 1 << ((movePos << 1) + parityInv)
        if (this.modeInverted) {
          // inverted: cannot move if it'd cause a win
          if (isWin(boards[moveBoard] | posFlag, !parity) &&
            (this.modeQuick || isWin(board | 1 << ((moveBoard << 1) + parityInv), !parity))) {
            return true
          }
        } else {
          // uninverted: cannot move if it'd allow a loss
          const newFlags = boards[movePos] | (moveBoard === movePos ? posFlag : 0)
          if (this.modeAnyBoard || !this.modeQuick &&
              ((boardFinal & (1 << movePos)) ||
                isFull(newFlags) ||
                isWin(newFlags, !parity))) {
            // next move can be on any board
            for (let i = 0; i < 9; i++) {
              if (!(boardFinal & (1 << i)) &&
                isNearWin(boards[i] | (i === moveBoard ? posFlag : 0), !parityInv) &&
                (this.modeQuick || isWin(board | (1 << ((i << 1) + parity)), !parityInv))) {
                return true
              }
            }
          } else if (isNearWin(newFlags, !parityInv) &&
              (this.modeQuick ||
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
