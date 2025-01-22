import { clamp } from '@/util'
import { valueStore } from '@/util/svelte'
import { isFull, isNearWin, isWin } from '@gc/t3/game'
import { ByteReader } from '@gmc/game/ByteReader'
import { ByteWriter } from '@gmc/game/ByteWriter'
import { TurnC2S } from '@gmc/game/TurnBasedGame'
import { type TPTurnClient, TPTurnGame } from '@gmc/game/TwoPlayerGame'

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
  public readonly modeTurnTime = valueStore(0)
  public readonly modeInverted = valueStore(false)
  public readonly modeChecked = valueStore(false)
  public readonly modeQuick = valueStore(false)
  public readonly modeAnyBoard = valueStore(false)

  public readonly boardStates = valueStore([INITIAL_STATE])
  public readonly boardIndex = valueStore(0)
  public readonly moveHistory = valueStore([] as [number, number][])

  protected override ROUND_TIME = 0 // set by mode

  protected override readonly playersSortProps = [
    (p: UT3Client) => p.streak,
    (p: UT3Client) => p.score,
    (p: UT3Client) => p.wins,
  ]

  sendMove (board: number, pos: number): void {
    // if rewinded, don't send
    if (this.boardIndex.get() !== this.ply.get()) return

    this.room?.send(new ByteWriter()
      .putInt(TurnC2S.MOVE)
      .putInt(board)
      .putInt(pos)
      .toArray()
    )
  }

  historyGo (index: number): void {
    this.boardIndex.set(clamp(index, 0, this.moveHistory.get().length))
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
        this.ply.set(i)
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
    this.modeTurnTime.set(this.ROUND_TIME = m.getInt())
    this.modeInverted.set(m.getBool())
    this.modeChecked.set(m.getBool())
    this.modeQuick.set(m.getBool())
    this.modeAnyBoard.set(m.getBool())
  }

  protected makePlayer (): UT3Client {
    return { ...TPTurnGame.DEFAULT_PLAYER }
  }

  private reset (): void {
    this.boardStates.set([INITIAL_STATE])
    this.boardIndex.set(0)
    this.moveHistory.set([])
  }

  private applyMove (moveBoard: number, movePos: number): void {
    const boardStates = this.boardStates.get()
    const moveHistory = this.moveHistory.get()

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

    const boardMustMove = this.modeAnyBoard.get() || (boardFinal & posFlagFinal) ? -1 : movePos

    const moveDisallowed = (moveBoard: number, movePos: number): boolean => {
      // Special Checks
      if (this.modeChecked.get()) {
        const posFlag = 1 << ((movePos << 1) + parityInv)
        if (this.modeInverted.get()) {
          // inverted: cannot move if it'd cause a win
          if (isWin(boards[moveBoard] | posFlag, !parity) &&
            (this.modeQuick.get() || isWin(board | posFlag, !parity))) {
            return true
          }
        } else {
          // uninverted: cannot move if it'd allow a loss
          const newFlags = boards[movePos] | (moveBoard === movePos ? posFlag : 0)
          if (this.modeAnyBoard.get() || !this.modeQuick.get() &&
              ((boardFinal & (1 << movePos)) ||
                isFull(newFlags) ||
                isWin(newFlags, !parity))) {
            // next move can be on any board
            for (let i = 0; i < 9; i++) {
              if (!(boardFinal & (1 << i)) &&
                isNearWin(boards[i] | (i === moveBoard ? posFlag : 0), !parityInv) &&
                (this.modeQuick.get() || isWin(board | (1 << ((i << 1) + parity)), !parityInv))) {
                return true
              }
            }
          } else if (isNearWin(newFlags, !parityInv) &&
              (this.modeQuick.get() ||
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
        if (!(boardMustMove < 0 || board === boardMustMove)) return 0b111111111
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

    this.boardStates.set(boardStates)
    this.moveHistory.set(moveHistory)
    this.boardIndex.update((i) => i === boardStates.length - 2 ? i + 1 : i)
  }
}
