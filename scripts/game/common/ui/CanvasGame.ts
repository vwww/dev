export class CanvasGame {
  private context: CanvasRenderingContext2D
  private lastGameTime = Date.now()

  constructor (private canvas: HTMLCanvasElement, private animationCallback: (dt: number) => void) {
    this.context = canvas.getContext('2d')!
    window.requestAnimationFrame(() => this.drawFrame())
    document.addEventListener('fullscreenchange', () => this.resize())
    window.addEventListener('resize', () => this.resize())
    this.resize()
  }

  private drawFrame (): void {
    window.requestAnimationFrame(() => this.drawFrame())

    const now = Date.now()
    const dt = now - this.lastGameTime
    this.lastGameTime = now

    this.animationCallback(dt)
  }

  getCanvas (): HTMLCanvasElement { return this.canvas }
  getContext (): CanvasRenderingContext2D { return this.context }

  resize (): void {
    // if (document.fullscreen && document.fullscreenElement === canvas)
    if (window.innerWidth === window.screen.width && window.innerHeight === window.screen.height) {
      // fullscreen mode
      this.canvas.width = Math.min(window.innerWidth, window.innerHeight * 2)
      this.canvas.height = Math.min(window.innerHeight, window.innerWidth / 2)
    } else {
      const parent = this.canvas.parentNode! as HTMLElement
      this.canvas.width = Math.min(parent.clientWidth, parent.clientHeight * 2)
      this.canvas.height = Math.min(parent.clientHeight, parent.clientWidth / 2)
    }
  }
}
