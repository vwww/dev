import { Cell } from './Cell'
import { DELTA, invMove, MoveType } from './Move'

export class Solver {
  private root?: Cell
  private readonly grid: Cell[][]

  constructor (private readonly rows: number, private readonly cols: number) {
    this.grid = new Array(rows)
    for (let r = 0; r < rows; r++) {
      const row: Cell[] = new Array(cols)
      for (let c = 0; c < cols; c++) {
        row[c] = new Cell(r, c)
      }
      this.grid[r] = row
    }

    // Set neighbors
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        DELTA.forEach((d, i) => {
          const nr = r + d[0]
          const nc = c + d[1]
          this.grid[r][c].setNeighbor(i, this.inGrid(nr, nc) ? this.grid[nr][nc] : undefined)
        })
      }
    }
  }

  getRoot (): Cell | undefined {
    return this.root
  }

  setRoot (r: number, c: number): void {
    if (this.root) {
      this.root.isRoot = false
    }

    const newRoot = this.grid[r][c]
    if (this.root === newRoot) {
      this.root = undefined
      return
    }

    this.root = newRoot
    newRoot.isRoot = true
    newRoot.active = true
  }

  invertCell (r: number, c: number): void {
    const cell = this.grid[r][c]
    cell.active = !this.grid[r][c].active
    if (!cell.active && cell.isRoot) {
      cell.isRoot = false
    }
  }

  getCell (r: number, c: number): Readonly<Cell> {
    return this.grid[r][c]
  }

  solve (): void {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c].reset()
      }
    }

    const stack: [number, number][] = []
    function queueVisit (cell: Cell): void {
      if (cell.solver.inQueue) return
      cell.solver.inQueue = true
      stack.push([cell.r, cell.c])
    }

    let numActive = 0
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c]
        if (cell.active) {
          queueVisit(cell)
          numActive++
        }
      }
    }

    while (stack.length) {
      const [r, c] = stack.pop()!

      const cell = this.grid[r][c]
      const solver = cell.solver

      solver.inQueue = false
      if (!solver.mMaybe) continue

      DELTA.forEach((d, i) => {
        if (solver.moves[i] !== MoveType.MAYBE) return

        const r2 = r + d[0]
        const c2 = c + d[1]
        const other = this.grid[r2][c2]

        const tp = solver.ufFind()
        const op = other.solver.ufFind()

        // can't connect to same group (unless it finishes the puzzle)
        const disallowed = tp === op ||
          (tp.ufSourceSink && op.ufSourceSink &&
            tp.ufSize + op.ufSize < numActive)

        if (disallowed) {
          queueVisit(other)

          solver.solveMove(i, false)
          other.solver.solveMove(invMove(i), false)
          return
        }

        // entering a 2/3 node, exiting to same group,
        // so it must be the other connection
        if (other.solver.remain === 2 && other.solver.mMaybe === 3) {
          DELTA.forEach((d2, j) => {
            if (j === invMove(i) || other.solver.moves[j] !== MoveType.MAYBE) return

            const r3 = r2 + d2[0]
            const c3 = c2 + d2[1]
            const uf3 = this.grid[r3][c3].solver.ufFind()

            if (tp !== uf3) return

            queueVisit(other)

            for (let k = 0; k < DELTA.length; k++) {
              if (k !== invMove(i) && k !== j && other.solver.moves[k] === MoveType.MAYBE) {
                const r4 = r2 + DELTA[k][0]
                const c4 = c2 + DELTA[k][1]
                const other2 = this.grid[r4][c4]
                const uf4 = other2.solver.ufFind()

                if (tp === uf4) return

                other.solver.solveMove(k, true)
                other2.solver.solveMove(invMove(k), true)

                queueVisit(other2)
                for (const end of other.solver.ufUnion(other2.solver).ufEnds) {
                  queueVisit(end.cell)
                }
              }
            }
          })
        }
      })

      // if possible, completely solve
      if (solver.mMaybe <= solver.remain) {
        DELTA.forEach((d, i) => {
          const r2 = r + d[0]
          const c2 = c + d[1]
          if (!this.inGrid(r2, c2)) return

          const other = this.grid[r2][c2]
          queueVisit(other)

          if (solver.moves[i] !== MoveType.MAYBE) return

          const ok = !!(solver.remain && other.solver.remain)

          solver.solveMove(i, ok)
          other.solver.solveMove(invMove(i), ok)

          if (ok) {
            for (const end of solver.ufUnion(other.solver).ufEnds) {
              queueVisit(end.cell)
            }
          }
        })
      }

      // if solved, set other MAYBE to NO
      if (solver.mMaybe && !solver.remain) {
        DELTA.forEach((d, i) => {
          if (solver.moves[i] !== MoveType.MAYBE) return

          const r2 = r + d[0]
          const c2 = c + d[1]
          const other = this.grid[r2][c2]
          queueVisit(other)

          solver.solveMove(i, false)
          other.solver.solveMove(invMove(i), false)
        })
      }
    }
  }

  loadString (str: string): void {
    for (let r = 0; r < this.rows; r++) {
      const row = this.grid[r]
      for (let c = 0; c < this.cols; c++) {
        row[c].active = row[c].isRoot = false
      }
    }
    this.root = undefined

    const [activePart, rootPart] = str.split('!', 2)
    let r = 0
    let c = 0
    let bias = 0

    for (let i = 0; i < activePart.length; i++) {
      // Process active part
      const v = activePart.charCodeAt(i)
      let n = v < 97 ? v - 65 : v - 97
      if (n < 0 || n >= 26) continue

      for (const newC = Math.min(c + n + bias, this.cols); c < newC; c++) {
        this.grid[r][c].active = true
      }

      if (v < 97 || i + 1 === activePart.length) {
        r++
        if (r === this.rows) break
        c = 0
        bias = 0
        continue
      }

      // Process blank space
      bias = 1
      n = activePart.charCodeAt(++i) - 97
      if (n < 0 || n >= 26) continue
      c += n + bias
    }

    if (rootPart && rootPart.length >= 2) {
      this.setRoot(parseInt(rootPart[0], 36), parseInt(rootPart[1], 36))
    }
  }

  toString (): string {
    let stateText = ''
    let pending = ''

    // Encode active
    for (let r = 0; r < this.grid.length; r++) {
      const row = this.grid[r]

      let countActive = 0
      let countInactive = 0
      let active = true
      let bias = 0

      for (let c = 0; c < row.length; c++) {
        const cell = row[c]
        if (cell.active && !active) {
          stateText += pending +
            String.fromCharCode(97 + countActive - bias) +
            String.fromCharCode(97 + countInactive - 1)
          countInactive = countActive = 0
          bias = 1
          pending = ''
        }
        active = cell.active

        active ? countActive++ : countInactive++
      }
      if (!countActive && !bias) {
        pending += 'A'
      } else {
        stateText += pending + String.fromCharCode(65 + countActive - bias)
        pending = ''
      }
    }

    // Encode root
    if (this.root) {
      stateText += '!' + this.root.r + this.root.c
    }

    return stateText
  }

  private inGrid (r: number, c: number): boolean {
    return r >= 0 && c >= 0 && r < this.rows && c < this.cols
  }
}
