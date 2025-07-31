import { FLOOR_SIZE } from '../Game'

const BG_NUM = 40
const BG_RADIUS = 0.0375

class Fancy {
  x = Math.random()
  y = Math.random()
  vx = Math.floor((Math.random() * 7) - 3) / 800 * 0.06
  vy = Math.floor((Math.random() * 3) + 1) / 400 * 0.06
  rgb = (Math.random() * 0x1000000) | 0
  a = (Math.random() * 0.6) + 0.1
  blurSize = (Math.floor(Math.random() * 10) + 5) / 2 / 800
  scale = (Math.random() * 0.7) + 0.3
}

export class FancyDrawer {
  private readonly fancy: Fancy[]

  constructor (numFancy = BG_NUM) {
    this.fancy = Array.from({ length: numFancy }, () => new Fancy())
  }

  update (dt: number): void {
    if (!dt) return

    for (let i = 0; i < this.fancy.length; ++i) {
      this.fancy[i].x += this.fancy[i].vx * dt
      this.fancy[i].y += this.fancy[i].vy * dt

      // wrap positions around (x)
      if (this.fancy[i].x < -BG_RADIUS || this.fancy[i].x > 1 + BG_RADIUS) {
        this.fancy[i].x %= 1 + (2 * BG_RADIUS)
      }
      if (this.fancy[i].x < -BG_RADIUS) {
        this.fancy[i].x += 1 + (2 * BG_RADIUS)
      }

      // wrap y around (2 * radius, as aspect ratio is 2)
      if (this.fancy[i].y > 1 + (2 * BG_RADIUS) - FLOOR_SIZE) {
        this.fancy[i].y -= 1 + (4 * BG_RADIUS) - FLOOR_SIZE
      }
    }
  }

  draw (ctx: CanvasRenderingContext2D, W: number, H: number): void {
    ctx.save()
    ctx.globalCompositeOperation = 'screen'
    for (let i = 0; i < this.fancy.length; ++i) {
      const { x, y, a, blurSize, scale } = this.fancy[i]
      const r = this.fancy[i].rgb >> 16
      const g = (this.fancy[i].rgb >> 8) & 0xFF
      const b = this.fancy[i].rgb & 0xFF

      ctx.beginPath()
      ctx.arc(x * W, y * H, BG_RADIUS * scale * W, 0, 2 * Math.PI)
      ctx.closePath()
      ctx.filter = 'blur(' + (blurSize * scale * W) + 'px)'
      ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'
      ctx.fill()
    }
    ctx.restore()
  }
}
