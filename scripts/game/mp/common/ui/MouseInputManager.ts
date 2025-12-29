import { clamp } from '@/util'

export class MouseInputManager {
  private x = 0
  private y = 0
  private valid = false

  isValid (): boolean { return this.valid }
  getX (): number { return this.x }
  getY (): number { return this.y }

  attachListeners (target: HTMLCanvasElement): void {
    target.addEventListener('mousemove', (event) => this.movestart(event.clientX, event.clientY, target))
    target.addEventListener('touchmove', (event) => this.touchmove(event, target))
    target.addEventListener('mouseleave', () => this.movestop())
    target.addEventListener('touchend', () => this.movestop())
    target.addEventListener('touchcancel', () => this.movestop())
  }

  private movestart (x: number, y: number, target: HTMLCanvasElement): void {
    const r = target.getBoundingClientRect()
    this.x = clamp((x - r.left) / target.clientWidth, 0, 1)
    this.y = clamp((y - r.top) / target.clientHeight, 0, 1)
    this.valid = true
  }

  private movestop (): void {
    this.valid = false
  }

  private touchmove (event: TouchEvent, target: HTMLCanvasElement): void {
    if (event.targetTouches.length < 1) return

    event.preventDefault()

    const touch = event.targetTouches.item(0)
    if (!touch) return
    this.movestart(touch.clientX, touch.clientY, target)
  }
}
