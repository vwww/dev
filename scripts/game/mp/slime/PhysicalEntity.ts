export class PhysicalEntity {
  x = 0
  y = 0
  xe = 0
  ye = 0

  constructor () {
    this.reset()
  }

  reset (): void {
    this.x = 0
    this.y = 0
    this.xe = 0
    this.ye = 0
  }

  move (dt: number): void {
    // Move 99.9% in 1 second
    const errMul = Math.pow(0.001, dt / 1000)
    this.xe *= errMul
    this.ye *= errMul
  }

  setServerLocation (x: number, y: number): void {
    this.xe += this.x - x
    this.ye += this.y - y
    this.x = x
    this.y = y
  }
}
