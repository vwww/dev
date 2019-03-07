import { sum } from '@/util'
import { Cell } from './Cell'
import { MoveType } from './Move'

export class SolverState {
  /** whether cell is in queue */
  inQueue = false
  /** whether cell is definitely source (root)/sink */
  isSourceSink = false

  /** status of all moves */
  moves: MoveType[] = []
  /** number of YES moves */
  mYes = 0
  /** number of MAYBE moves */
  mMaybe = 0
  /** remaining possible connections */
  remain = 0

  /** parent for union-find */
  ufParent: this = this
  /** size for union-find (when ufParent === this) */
  ufSize = 1
  /** end nodes */
  ufEnds: [this, this] = [this, this]
  /** whether region contains cell with .isSourceSink */
  ufSourceSink = false

  constructor (public cell: Cell) {
    this.disable()
  }

  disable (): void {
    this.reset([false, false, false, false])
  }

  reset (moves: boolean[], root = false): void {
    this.inQueue = false
    this.moves = moves.map((m) => m ? MoveType.MAYBE : MoveType.NO)
    this.mYes = 0
    this.mMaybe = sum(moves.map((x) => +x))
    this.isSourceSink = this.mMaybe < 2 || root
    this.remain = this.isSourceSink ? 1 : 2
    this.resetUF()
  }

  resetUF (): void {
    this.ufParent = this
    this.ufSize = 1
    this.ufEnds = [this, this]
    this.ufSourceSink = this.isSourceSink
  }

  solveMove (i: number, yes: boolean): void {
    if (this.moves[i] !== MoveType.MAYBE) return

    this.moves[i] = yes ? MoveType.YES : MoveType.NO
    --this.mMaybe
    if (yes) {
      ++this.mYes
      --this.remain
    }
  }

  ufFind (): this {
    let x = this
    while (x.ufParent !== x) {
      x.ufParent = x.ufParent.ufParent
      x = x.ufParent
    }
    return x
  }

  ufUnion (other: this): this {
    const tRoot = this.ufFind()
    const oRoot = other.ufFind()

    if (tRoot === oRoot) {
      return tRoot
    } else if (tRoot.ufSize < oRoot.ufSize) {
      return this.ufUnionApply(oRoot, tRoot, other, this)
    } else {
      return this.ufUnionApply(tRoot, oRoot, this, other)
    }
  }

  private ufUnionApply (a: this, b: this, aChild: this, bChild: this): this {
    // a = big, b = small
    b.ufParent = a
    a.ufSize += b.ufSize
    a.ufEnds = [
      aChild !== a.ufEnds[0] ? a.ufEnds[0] : a.ufEnds[1],
      bChild !== b.ufEnds[0] ? b.ufEnds[0] : b.ufEnds[1],
    ]
    a.ufSourceSink ||= b.ufSourceSink
    return a
  }
}
