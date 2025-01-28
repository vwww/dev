import { clamp } from '@/util'
import { isNearWin, isWin } from '@gc/t3/game'
import { ByteReader } from '@gmc/game/ByteReader'
import { ByteWriter } from '@gmc/game/ByteWriter'
import { TurnC2S } from '@/game/mp/common/game/TurnBasedGame.svelte'
import { type TPTurnClient, TPTurnGame } from '@/game/mp/common/game/TwoPlayerGame.svelte'

interface T3Client extends TPTurnClient { }

const MAX_TURNS = 9

export default class T3Game extends TPTurnGame<T3Client> {
  public modeTurnTime = $state(0)
  public modeInverted = $state(false)
  public modeChecked = $state(false)
  public modeQuick = $state(false)

  public boardState = $state(0)
  public boardBad = $state(0)
  public moveHistory = $state([] as number[])

  protected override ROUND_TIME = 0 // set by mode

  protected override readonly playersSortProps = [
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
      this.ply = i // applyMove needs correct ply
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
    this.modeTurnTime = this.ROUND_TIME = m.getInt()
    this.modeInverted = m.getBool()
    this.modeChecked = m.getBool()
    this.modeQuick = m.getBool()
  }

  protected makePlayer (): T3Client {
    return { ...TPTurnGame.DEFAULT_PLAYER }
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
    if (this.modeChecked) {
      const parity = ply & 1
      const mark = 1 << parity
      for (let i = 0; i < 9; i++) {
        const boardNext = board | (mark << (i << 1))
        if (this.modeInverted ? isWin(boardNext, !!parity) : isNearWin(boardNext, !parity)) {
          bad |= 1 << i
        }
      }
    }
    return bad
  }
}
