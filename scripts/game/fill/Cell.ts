import { SolverState } from './SolverState'

export class Cell {
  active: boolean = false
  isRoot: boolean = false
  solver = new SolverState(this)
  neighbors: (Cell | undefined)[] = [undefined, undefined, undefined, undefined]

  constructor (public r: number, public c: number) { }

  setNeighbor (n: number, neighbor: Cell | undefined): void {
    this.neighbors[n] = neighbor
  }

  reset (): void {
    if (this.active) {
      this.solver.reset(this.neighbors.map(x => !!x && x.active), this.isRoot)
    } else {
      this.solver.disable()
    }
  }
}
