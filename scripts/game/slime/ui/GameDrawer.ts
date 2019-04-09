import { BALL_RADIUS, FLOOR_SIZE, Game, GameStatus, SLIME_SIZE } from '../Game'
import { ReadyState } from '../net/IConnector'
import { FancyDrawer } from './FancyDrawer'

export class GameDrawer {
  drawFancyBackground = false
  drawDev = false
  flipP1 = false

  readonly fancy = new FancyDrawer()

  constructor (readonly game: Game, private getNetStatus: () => ReadyState) { }

  draw (ctx: CanvasRenderingContext2D): void {
    let H = ctx.canvas.height
    let W = H * 2

    // background
    this.drawClear(ctx, W, H)
    if (this.drawFancyBackground) {
      this.fancy.draw(ctx, W, H)
    }

    if (!this.game) return

    // draw net
    this.drawFloor(ctx, W, H)
    this.drawNet(ctx, W, H)

    // draw dynamic entities
    this.drawBall(ctx, W, H)
    const p1 = this.game.getP1()
    const p2 = this.game.getP2()
    this.drawSlimer(ctx, W, H, p1.x + p1.xe, p1.y + p1.ye, p1.color, p1.name, false)
    if (this.game.hasOpponent()) {
      this.drawSlimer(ctx, W, H, p2.x + p2.xe, p2.y + p2.ye, p2.color, p2.name, true)
      this.drawPing(ctx, W, H, p1.ping, !this.flipP1)
      this.drawPing(ctx, W, H, p2.ping, this.flipP1)
    }

    // draw true positions
    if (this.drawDev) {
      this.drawBall(ctx, W, H, true)
      this.drawSlimer(ctx, W, H, p1.x, p1.y, p1.color, p1.name, false, true)
      this.drawSlimer(ctx, W, H, p2.x, p2.y, p2.color, p2.name, true, true)
    }

    // draw HUD
    this.drawScore(ctx, W, H, p1.score, p2.score)
    let status: string | undefined
    switch (this.getNetStatus()) {
      case ReadyState.Connecting:
        status = 'Connecting'
        break
      case ReadyState.Connected:
        if (!this.game.hasOpponent()) {
          status = 'Waiting for opponent'
        } else if (this.game.getStatus() === GameStatus.WIN) {
          status = 'You won the round!'
        } else if (this.game.getStatus() === GameStatus.LOSS) {
          status = 'You lost the round!'
        }
        break
      case ReadyState.Disconnecting:
        status = 'Disconnecting'
        break
      case ReadyState.Disconnected:
        status = 'Disconnected'
        break
    }
    if (status) this.drawStatus(ctx, W, H, status)
    this.drawFPS(ctx, W, H)
  }

  drawClear (ctx: CanvasRenderingContext2D, W: number, H: number): void {
    const grd = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, H)
    grd.addColorStop(0, '#0df')
    grd.addColorStop(1, '#26b')

    // Fill with gradient
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, W, H)
  }

  drawFloor (ctx: CanvasRenderingContext2D, W: number, H: number): void {
    ctx.fillStyle = '#999'
    ctx.fillRect(0, H * (1 - FLOOR_SIZE), W, H)
  }
  drawNet (ctx: CanvasRenderingContext2D, W: number, H: number): void {
    ctx.fillStyle = '#fff'
    ctx.fillRect(0.495 * W, 0.625 * H, 0.01 * W, 0.2 * H)
  }
  drawBall (ctx: CanvasRenderingContext2D, W: number, H: number, trace?: boolean): void {
    const b = this.game.getBall()

    let x = b.x
    let y = b.y
    if (!trace) {
      x += b.xe
      y += b.ye
    }
    if (this.flipP1) x = 2 - x
    y = (1 - y) - FLOOR_SIZE

    ctx.beginPath()
    ctx.arc(x * H, y * H, BALL_RADIUS * H, 0, 2 * Math.PI)
    ctx.closePath()
    if (trace) {
      ctx.lineWidth = 2
      ctx.strokeStyle = 'red'
      ctx.stroke()
      return
    }
    ctx.fillStyle =
      this.game.getStatus() === GameStatus.WIN
      ? '#0f0'
      : this.game.getStatus() === GameStatus.LOSS
      ? 'red'
      : '#ff0'
    ctx.fill()
  }
  drawSlimer (ctx: CanvasRenderingContext2D, W: number, H: number, x: number, y: number, color: string | CanvasGradient | CanvasPattern, name: string, p2: boolean, trace?: boolean): void {
    const b = this.game.getBall()

    // transform to screen space
    if (this.flipP1) x = 2 - x
    y = (1 - y) - FLOOR_SIZE

    // draw slimer
    ctx.beginPath()
    ctx.arc(x * H, y * H, SLIME_SIZE * H, 0, Math.PI, true)
    ctx.closePath()
    if (trace) {
      ctx.lineWidth = 2
      ctx.strokeStyle = 'red'
      ctx.stroke()
      return
    }
    ctx.fillStyle = color
    ctx.fill()

    // draw eye
    let ex = x + ((this.flipP1 !== p2) ? -0.0535 : 0.0535)
    let ey = y - 0.0525
    ctx.beginPath()
    ctx.arc(ex * H, ey * H, 0.0175 * H, 0, 2 * Math.PI, true)
    ctx.closePath()
    ctx.fillStyle = '#fff'
    ctx.fill()
    // draw pupil
    let dx = (this.flipP1 ? 2 - (b.x + b.xe) : b.x + b.xe) - ex
    let dy = ((1 - (b.y + b.ye)) - FLOOR_SIZE) - ey
    let l2 = (dx * dx) + (dy * dy)
    if (l2 > 0.005 * 0.005) {
      let f = 0.005 / Math.sqrt(l2)
      ex += dx * f
      ey += dy * f
    } else {
      ex = b.x + b.xe
      ey = b.y + b.ye
    }
    ctx.beginPath()
    ctx.arc(ex * H, ey * H, 0.01 * H, 0, 2 * Math.PI, true)
    ctx.closePath()
    ctx.fillStyle = '#000'
    ctx.fill()

    // draw nametag
    if (name) {
      ctx.font = (0.0225 * W) + 'px Verdana, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillStyle = '#ccc'
      ctx.fillText(name, x * H, (y - 0.05 - SLIME_SIZE) * H)
    }
  }
  drawScore (ctx: CanvasRenderingContext2D, W: number, H: number, p1score: number, p2score: number): void {
    ctx.font = (0.05 * W) + 'px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#fd0'
    ctx.fillText(p1score + '', (this.flipP1 ? 0.92 : 0.08) * W, 0.15 * H)
    ctx.fillText(p2score + '', (this.flipP1 ? 0.08 : 0.92) * W, 0.15 * H)
  }
  drawStatus (ctx: CanvasRenderingContext2D, W: number, H: number, status: string): void {
    ctx.font = (0.04 * W) + 'px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ddd'
    ctx.fillText(status, 0.5 * W, 0.15 * H)
  }
  drawFPS (ctx: CanvasRenderingContext2D, W: number, H: number): void {
    if (!this.game) return

    const fps = this.game.getFPS()

    ctx.font = (0.02 * W) + 'px monospace'
    ctx.textAlign = 'left'
    ctx.fillStyle = '#fa0'
    ctx.fillText(Math.round(fps) + ' fps', 0.01 * W, 0.97 * H)
  }
  drawPing (ctx: CanvasRenderingContext2D, W: number, H: number, ping: number, left: boolean): void {
    if (ping < 0) return

    ctx.font = (0.02 * W) + 'px monospace'
    ctx.textAlign = left ? 'left' : 'right'
    ctx.fillStyle = '#fa0'
    ctx.fillText(ping + ' ms', (left ? 0.01 : 0.99) * W, 0.85 * H)
  }
}
