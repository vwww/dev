import { sum } from '../../util'
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
  mYes: number = 0
  /** number of MAYBE moves */
  mMaybe: number = 0
  /** remaining possible connections */
  remain: number = 0

  /** parent for union-find */
  ufParent: this = this
  /** size for union-find (when ufParent == this) */
  ufSize: number = 1
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
    this.moves = moves.map(m => m ? MoveType.MAYBE : MoveType.NO)
    this.mYes = 0
    this.mMaybe = sum(moves.map(x => +x))
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

  solveMove (i: number, yes: boolean) {
    // assume this.moves[i] == MoveType.MAYBE
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
    let tRoot = this.ufFind()
    let oRoot = other.ufFind()

    if (tRoot === oRoot) return tRoot

    if (tRoot.ufSize < oRoot.ufSize) {
      [tRoot, oRoot] = [oRoot, tRoot]
    }

    oRoot.ufParent = tRoot
    tRoot.ufSize += oRoot.ufSize
    tRoot.ufEnds = [
      this !== tRoot.ufEnds[0] ? tRoot.ufEnds[0] : tRoot.ufEnds[1],
      other !== oRoot.ufEnds[0] ? oRoot.ufEnds[0] : oRoot.ufEnds[1],
    ]
    tRoot.isSourceSink = tRoot.isSourceSink || oRoot.isSourceSink

    return tRoot
  }
}
