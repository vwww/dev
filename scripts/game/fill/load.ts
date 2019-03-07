import { $idA, sum } from '../../util'

const ROWS = 8
const COLS = 8
// top/up, bottom/down, left, right
const DELTA = [[-1, 0], [1, 0], [0, -1], [0, 1]]
const invMove = (i: number) => i ^ 1
const MOVE_CLASS = 'tblr'

const $cells: HTMLTableDataCellElement[][] = []
let rootR = 0
let rootC = 0
const grid: Cell[][] = []

enum MoveType {
  NO,
  MAYBE,
  YES,
}

// TODO refactor grid into this class:
/*
class SolverGrid {
  private grid = []
}
*/

class SolverState {
  moves: MoveType[] = [];
  possible: number = 0;
  remain: number = 0;
  solved: number = 0;
  ufParent: SolverState = this;
  ufSize: number = 1;

  constructor () {
    this.disable()
  }

  disable () {
    this.reset([false, false, false, false])
  }

  reset (moves: boolean[], root = false) {
    this.moves = moves.map(m => m ? MoveType.MAYBE : MoveType.NO)
    this.possible = sum(moves.map(x => +x)) // number of MoveType.YES + number of MoveType.MAYBE
    this.remain = this.possible < 2 || root ? 1 : 2 // remaining possible connections
	  //this.unknown = this.possible - this.remain
    this.solved = 0 // unused?
    this.ufParent = this
    this.ufSize = 1
  }

  solveMove (i: number, yes: boolean) {
    // assume this.moves[i] == MoveType.MAYBE
    this.moves[i] = yes ? MoveType.YES : MoveType.NO
    --this.remain
    if (yes) {
      ++this.solved
      if (!this.remain && this.possible) {
        // set others to MoveType.NO
      }
    }
  }
}

class Cell {
  active: boolean;
  solver: SolverState;

  constructor () {
    this.active = false
    this.solver = new SolverState()
  }

  reset (r: number, c: number): void {
    if (this.active) {
      this.solver.reset(DELTA.map(d => active(r + d[0], c + d[1])), isRoot(r, c))
    } else {
      this.solver.disable()
    }
  }
}

function inGrid (r: number, c: number): boolean {
  return r >= 0 && c >= 0 && r < ROWS && c < COLS
}

function isRoot (r: number, c: number): boolean {
  return r == rootR && c == rootC
}

function active (r: number, c: number): boolean {
  return inGrid(r, c) && grid[r][c].active
}

function solve (): void {
  grid[rootR][rootC].active = true
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      grid[r][c].reset(r, c)
    }
  }

  const stack = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c].active) {
        stack.push([r, c])
      }
    }
  }
  stack.push([rootR, rootC]) // TODO remove

  while (stack.length) {
    const [r, c] = stack.pop()!

    const cell = grid[r][c]
    const solver = cell.solver

    const p = solver.possible
    // if (!p) return
    if (p <= 2) {
      // completely solve
      DELTA.forEach((d, i) => {
        if (solver.moves[i] != MoveType.MAYBE) return
        const r2 = r + d[0]
        const c2 = c + d[1]
        if (!inGrid(r2, c2)) return

        const other = grid[r2][c2]
        const ok = solver.remain && other.solver.remain
        const m = ok ? MoveType.YES : MoveType.NO

        other.solver.moves[invMove(i)] = m
        --other.solver.remain
        if (ok) {
          ++other.solver.solved
          ++solver.solved
        }

        solver.moves[i] = m
        stack.push([r2, c2])
      })
      solver.remain = 0
    } else if (p == 3) {
      const canSolve = false // TODO 2 match
      if (canSolve) {
        //
      }
    } else if (p == 4) {
      // TODO check if 2 match and 2 others are definitely different
    }
  }
}

function updateRendering () {
  for (let r = 0; r < ROWS; r++) {
    const $row = $cells[r]
    const row = grid[r]
    for (let c = 0; c < COLS; c++) {
      const cell = row[c]

      let className = 'fill'

      if (r == rootR && c == rootC) className += ' fill-root'
      else if (!grid[r][c].active) className += ' fill-disabled'

      className += ' ' + cell.solver.moves.map((m, i) => m == MoveType.YES ? 'fill-' + MOVE_CLASS[i] : '').join(' ')

      $row[c].className = className
    }
  }
}

function recompute () {
  solve()
  updateRendering()
}

function loaded () {
  const $table = $idA<HTMLTableElement>('fill-table')
  $table.appendChild(document.createElement('tbody'))

  for (let r = 0; r < ROWS; r++) {
    const row: Cell[] = []
    grid.push(row)

    const $rowCell = $table.insertRow(-1)
    const $row: HTMLTableDataCellElement[] = []
    $cells.push($row)

    for (let c = 0; c < COLS; c++) {
      const cell = new Cell()
      row.push(cell)

      const $cell = $rowCell.insertCell(-1)
      $row.push($cell)

      $cell.className = 'fill'
      $cell.addEventListener('click', () => {
        cell.active = !cell.active
        recompute()
      })
      $cell.addEventListener('contextmenu', event => {
        event.preventDefault()
        rootR = r
        rootC = c
        recompute()
        return false
      })
    }
  }

  recompute()
}

window.addEventListener('load', loaded)
