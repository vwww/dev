import { clamp } from '../../../util'
import { valueStore } from '../../../util/svelte'
import { isNearWin, isWin } from '../../common/t3/game'
import { ByteReader } from '../common/game/ByteReader'
import { ByteWriter } from '../common/game/ByteWriter'
import { TurnC2S } from '../common/game/TurnBasedGame'
import { TPTurnClient, TPTurnGame } from '../common/game/TwoPlayerGame'

interface T3Client extends TPTurnClient { }

const MAX_TURNS = 9

export default class T3Game extends TPTurnGame<T3Client> {
  public readonly modeTurnTime = valueStore(0)
  public readonly modeInverted = valueStore(false)
  public readonly modeChecked = valueStore(false)
  public readonly modeQuick = valueStore(false)

  public readonly boardState = valueStore(0)
  public readonly boardBad = valueStore(0)
  public readonly moveHistory = valueStore([] as number[])

  protected ROUND_TIME = 0 // set by mode

  protected playersSortProps = [
    (p: T3Client) => p.streak,
    (p: T3Client) => p.score,
    (p: T3Client) => p.wins,
  ]

  sendMove (n: number): void {
    this.room?.send(new ByteWriter()
      .putInt(TurnC2S.MOVE)
      .putInt(n)
      .toArray()
    )
  }

  protected processMoveConfirm (m: ByteReader): void {
    m.getInt() // pendingMove
  }

  protected processRoundInfo (m: ByteReader): void {
    this.reset()
    for (let i = 0; i <= MAX_TURNS; i++) {
      this.ply.set(i) // applyMove needs correct ply
      const move = m.getInt()
      if (move < 0) {
        break
      }
      this.applyMove(move)
    }
  }

  protected processRoundStartInfo (m: ByteReader): void {
    this.reset()
  }

  protected processEndTurn2 (m: ByteReader): void {
    const move = clamp(m.getInt(), 0, 9 - 1)
    this.applyMove(move)
  }

  protected processWelcomeMode (m: ByteReader): void {
    this.modeTurnTime.set(this.ROUND_TIME = m.getInt())
    this.modeInverted.set(m.getBool())
    this.modeChecked.set(m.getBool())
    this.modeQuick.set(m.getBool())
  }

  protected makePlayer (): T3Client {
    return { ...TPTurnGame.DEFAULT_PLAYER }
  }

  private reset (): void {
    this.boardState.set(0)
    this.boardBad.set(0)
    this.moveHistory.set([])
  }

  private applyMove (move: number): void {
    const mark = 1 << (this.ply.get() & 1)

    const board = this.boardState.get() | (mark << (move << 1))
    this.boardState.set(board)
    this.boardBad.set(this.calcBoardBadMoves(board, this.ply.get() + 1))

    this.moveHistory.update((moves) => (moves.push(move), moves))
  }

  private calcBoardBadMoves (board: number, ply: number): number {
    let bad = 0
    if (this.modeChecked.get()) {
      const parity = ply & 1
      const mark = 1 << parity
      for (let i = 0; i < 9; i++) {
        const boardNext = board | (mark << (i << 1))
        if (this.modeInverted.get() ? isWin(boardNext, !!parity) : isNearWin(boardNext, !parity)) {
          bad |= 1 << i
        }
      }
    }
    return bad
  }
}
