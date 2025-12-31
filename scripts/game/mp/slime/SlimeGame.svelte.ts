import { clamp, formatHexColor } from '@/util'
import { ByteReader } from '@gmc/game/ByteReader'
import { filterChat } from '@gmc/game/CommonGame.svelte'
import { RealTimeClient, RealTimeGame } from '@gmc/game/RealTimeGame.svelte'
import type { BaseGameRoom } from '@gmc/remote/BaseGameRoom'

import { defaultMode, type SlimeMode } from './gamemode'
import { FancyDrawer } from './SlimeGame.FancyDrawer'
import { SlimeInput } from './SlimeInput'

const enum S2C {
  WELCOME,
  JOIN,
  LEAVE,
  RESET,
  RENAME,
  PING,
  PING_TIME,
  CHAT,
  ACTIVE,
  WORLDSTATE,
  ROUND_WIN1,
  ROUND_WIN2,
  ROUND_START1,
  ROUND_START2,
}

const enum C2S {
  RESET,
  RENAME,
  PONG,
  CHAT,
  ACTIVE,
  MOVE,
}

class SlimeClient extends RealTimeClient {
  color = '#000'
  colorInv = '#000'

  wins = $state(0)
  loss = $state(0)
  streak = $state(0)

  score = $state(0)
  total = $state(0)

  resetScore () {
    this.wins = 0
    this.loss = 0
    this.streak = 0
    this.score = 0
    this.total = 0
  }

  addWin () {
    if (this.streak < 0) this.streak = 0
    this.streak++
    this.score++
    this.wins++
    this.total++
  }

  addLoss () {
    if (this.streak > 0) this.streak = 0
    this.streak--
    this.score--
    this.loss++
    this.total++
  }

  override readWelcome (m: ByteReader): void {
    super.readWelcome(m)

    const color = (m.get() << 16) | m.getUint16()
    const colorInv = color ^ 0xFFFFFF
    this.color = formatHexColor(color)
    this.colorInv = formatHexColor(colorInv)

    this.wins = m.getInt()
    this.loss = m.getInt()
    this.streak = m.getInt()

    this.score = this.wins - this.loss
    this.total = this.wins + this.loss
  }

  override processJoin (cn: number, m: ByteReader): void {
    super.processJoin(cn, m)

    const color = (m.get() << 16) | m.getUint16()
    const colorInv = color ^ 0xFFFFFF
    this.color = formatHexColor(color)
    this.colorInv = formatHexColor(colorInv)
  }
}

export class SlimeGame extends RealTimeGame<SlimeClient> {
  mode: SlimeMode = $state(defaultMode())

  gameStart = Date.now()
  roundStart = 0
  status = GameStatus.IN_PLAY
  readonly p1 = new Player(true)
  readonly p2 = new Player(false)
  readonly ball = new Ball()

  drawFancyBackground = false
  drawDev = false
  flipP1 = false
  readonly drawer = new GameDrawer(this)

  lastKeySent = -1
  readonly input = new SlimeInput()

  INTERMISSION_TIME = 30000

  override newClient () { return new SlimeClient }

  enterGame (room: BaseGameRoom, name: string, color: string): void {
    const colorNum = parseInt(color, 16)
    const colorHex = Number.isNaN(colorNum) ? 0x77ff00 : colorNum & 0xFFFFFF

    this.setupGame(room)
    this.sendf('isc3', this.PROTOCOL_VERSION, name, colorHex >> 16, (colorHex >> 8) & 0xFF, colorHex & 0xFF)
  }

  sendReset (): void { this.sendf('i', C2S.RESET) }
  sendRename (newName: string): void { this.sendf('is', C2S.RENAME, newName) }
  sendPong (t: number): void { this.sendf('i2', C2S.PONG, t) }
  sendChat (s: string, flags: number, target = -1): void { this.sendf('i3s', C2S.CHAT, flags, target, filterChat(s)) }
  sendActive (): void { this.sendf('i', C2S.ACTIVE) }
  sendMove (n: number): void { this.sendf('i2', C2S.MOVE, n) }

  MESSAGE_HANDLERS: Record<number, (this: this, m: ByteReader) => void> = {
    [S2C.WELCOME]: this.processWelcome,
    [S2C.JOIN]: this.processJoin,
    [S2C.LEAVE]: this.processLeave,
    [S2C.RESET]: this.processReset,
    [S2C.RENAME]: this.processRename,
    [S2C.PING]: this.processPing,
    [S2C.PING_TIME]: this.processPingTime,
    [S2C.CHAT]: this.processChat,
    [S2C.ACTIVE]: this.processActive,
    [S2C.WORLDSTATE]: this.processWorldState,
    [S2C.ROUND_WIN1]: this.processRoundWin1,
    [S2C.ROUND_WIN2]: this.processRoundWin2,
    [S2C.ROUND_START1]: this.processRoundStart0,
    [S2C.ROUND_START2]: this.processRoundStart1,
  }

  protected override playerActivated (player: SlimeClient): void {
    super.playerActivated(player)

    this.p1.score = this.p2.score = 0n
  }

  protected override playerDeactivated (player: SlimeClient): void {
    if (this.roundPlayers.length === 2) {
      this.roundPlayers[player === this.roundPlayers[0] ? 1 : 0].addWin()
      player.addLoss()

      this.p1.score = this.p2.score = 0n
    }

    super.playerDeactivated(player)
  }

  protected override processWelcomeMode (m: ByteReader): void {
    this.mode.optServe = m.get() & 3 // 2 bits exactly
    this.mode.optIntermission = Math.min(Number(m.getUint64()), 3000)
    this.mode.optSizePlayer = clamp(Number(m.getUint64()), 10, 400)
    this.mode.optSizeBall = clamp(Number(m.getUint64()), 10, 1600)
    this.mode.optSizeNet = Math.min(Number(m.getUint64()), 200)
    this.mode.optSpeedGame = clamp(Number(m.getUint64()), 25, 800)
    this.mode.optSpeedPlayer = clamp(Number(m.getUint64()), 25, 800)
    this.mode.optSpeedBall = clamp(Number(m.getUint64()), 10, 800)
    this.mode.optGravity = clamp(Number(m.getUint64()), 10, 800)
  }

  protected override processRoundInfo (m: ByteReader): void {
    this.gameStart = Date.now() - Number(m.getUint64())
    if (this.roundPlayers.length) {
      this.roundStart = Date.now() - Number(m.getUint64())

      const flags = m.get()
      if (this.roundPlayers.length > 1 && (flags & 4)) {
        [this.roundPlayers[0], this.roundPlayers[1]] = [this.roundPlayers[1], this.roundPlayers[0]]
      }
      this.status = flags & 3
      this.p1.score = m.getUint64()
      this.p2.score = m.getUint64()
      this.processWorldState(m)
    } else {
      // reset players
      this.p1.respawn(true)
      this.p2.respawn(false)
      // reset ball
      this.ball.respawn(true)
    }
  }

  protected processWorldState (m: ByteReader): void {
    const DMF = 0xFFFF
    // const DVF = 0x3FFF

    m.get() // keys
    const p1x = m.getUint16() / DMF
    const p1y = m.getUint16() / DMF
    const p1vy = m.getUint16() / DMF

    const p2x = 1 + m.getUint16() / DMF
    const p2y = m.getUint16() / DMF
    const p2vy = m.getUint16() / DMF

    const bx = m.getUint16() / DMF * 2
    const by = m.getUint16() / DMF
    const bvx = m.getUint16() / DMF
    const bvy = m.getUint16() / DMF

    // silence warnings
    void p1vy, p2vy, bvx, bvy

    this.p1.setServerLocation(p1x, p1y)
    this.p2.setServerLocation(p2x, p2y)
    this.ball.setServerLocation(bx, by)
  }

  protected processRoundWin1 (_m: ByteReader): void {
    this.processRoundWin(true)
  }

  protected processRoundWin2 (_m: ByteReader): void {
    this.processRoundWin(false)
  }

  protected processRoundWin (p1Won: boolean): void {
    (p1Won ? this.p1 : this.p2).score++
    this.roundPlayers[p1Won ? 0 : 1]?.addWin()
    this.roundPlayers[p1Won ? 1 : 0]?.addLoss()
    this.updatePlayers()

    this.status = p1Won === (this.roundPlayers[0] === this.localClient) ? GameStatus.WIN : GameStatus.LOSS
  }

  protected processRoundStart0 (_m: ByteReader): void {
    this.processRoundStart(true)
  }

  protected processRoundStart1 (_m: ByteReader): void {
    this.processRoundStart(false)
  }

  protected processRoundStart (p0Serves: boolean): void {
    this.p1.respawn(true)
    this.p2.respawn(false)
    this.ball.respawn(p0Serves)
    this.status = GameStatus.IN_PLAY
    this.roundStart = Date.now()
  }

  protected override readonly playersSortProps = [
    (p: SlimeClient) => p.streak,
    (p: SlimeClient) => p.score,
    (p: SlimeClient) => p.wins,
  ]

  attachCanvas (canvas: HTMLCanvasElement): void {
    this.input.attachListeners(canvas)
  }

  protected getKeyFlags (): number {
    let keyFlags = this.input.getKeyFlags(this.flipP1)
    const mouse = this.input.getMouse()
    if (mouse.isValid()) {
      let x = mouse.getX()
      if (this.flipP1) x = 1 - x

      const MouseX = Math.min(Math.max(x * 2, 0), 1)
      const MouseYJump = mouse.getY() < 0.45

      const px = this.roundPlayers[1] === this.localClient ? 2 - this.p2.x : this.p1.x

      if (!(keyFlags & 3) && Math.abs(px - MouseX) > 0.05) {
        keyFlags |= px < MouseX ? 2 : 1
      }
      if (MouseYJump) keyFlags |= 4
    }
    return keyFlags
  }

  override updateGameState (dt: number): void {
    // update network
    if (this.room && this.localClient.active) {
      const keyFlags = this.getKeyFlags()
      if (this.lastKeySent !== keyFlags) {
        this.sendMove(this.lastKeySent = keyFlags)
      }
    }

    // update game
    if (!dt) return

    this.ball.move(dt)
    this.p1.move(dt)
    this.p2.move(dt)

    this.drawer.fancy.update(dt)
  }

  override render (ctx: CanvasRenderingContext2D): void {
    this.drawer.draw(ctx)
  }
}

const enum GameStatus {
  IN_PLAY,
  WIN,
  LOSS
}

// only used by UI
const SLIME_SIZE = 0.1
const BALL_RADIUS = 0.03
export const FLOOR_SIZE = 0.2

const SPAWN_P1_X = 0.45
const SPAWN_P2_X = 2 - SPAWN_P1_X
const SPAWN_BALL_Y = 0.5

class PhysicalEntity {
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
    // Move 99.9% in 100 ms
    const errMul = (0.001 ** (1 / 100)) ** dt
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

class Ball extends PhysicalEntity {
  constructor () {
    super()
    this.respawn(true)
  }

  respawn (p1Serves: boolean): void {
    this.x = p1Serves ? SPAWN_P1_X : SPAWN_P2_X
    this.y = SPAWN_BALL_Y
    this.xe = 0
    this.ye = 0
  }
}

class Player extends PhysicalEntity {
  score = 0n

  constructor (p1: boolean) {
    super()
    this.respawn(p1)
  }

  respawn (p1: boolean): void {
    this.reset()
    this.x = p1 ? SPAWN_P1_X : SPAWN_P2_X
  }
}

export class GameDrawer {
  readonly fancy = new FancyDrawer()

  constructor (readonly game: SlimeGame) { }

  draw (ctx: CanvasRenderingContext2D): void {
    const H = ctx.canvas.height
    const W = H * 2

    // background
    this.drawClear(ctx, W, H)
    if (this.game.drawFancyBackground) {
      this.fancy.draw(ctx, W, H)
    }

    if (!this.game) return

    // draw net
    this.drawFloor(ctx, W, H)
    this.drawNet(ctx, W, H)

    // draw dynamic entities
    const { p1, p2, flipP1 } = this.game
    const [c1, c2] = this.game.roundPlayers
    const flip = flipP1 === (!this.game.roundPlayers.length || c1 === this.game.localClient)

    this.drawBall(ctx, W, H, flip)
    this.drawSlimer(ctx, W, H, p1.x + p1.xe, p1.y + p1.ye, c1?.color ?? '#7f0', c1?.name ?? '', flip, false)
    if (c1) {
      this.drawPing(ctx, W, H, c1.ping, !flip)
      if (c2) {
        this.drawSlimer(ctx, W, H, p2.x + p2.xe, p2.y + p2.ye, c2?.color, c2.name, flip, true)
        this.drawPing(ctx, W, H, c2.ping, flip)
      } else {
        this.drawSlimer(ctx, W, H, p2.x + p2.xe, p2.y + p2.ye, c1.colorInv, '<bot>', flip, true)
        this.drawPing(ctx, W, H, 0, flip)
      }
    }

    // draw true positions
    if (this.game.drawDev) {
      this.drawBall(ctx, W, H, flip, true)
      this.drawSlimer(ctx, W, H, p1.x, p1.y, '', '', flip, false, true)
      this.drawSlimer(ctx, W, H, p2.x, p2.y, '', '', flip, true, true)
    }

    // draw HUD
    this.drawScore(ctx, W, H, flip, p1.score, p2.score)
    let status: string | undefined
    if (!this.game.room) {
      status = 'Disconnected'
    } else if (!this.game.localClient.active) {
      status = !this.game.status
        ? 'Spectating'
        : `${this.game.status === GameStatus.WIN !== this.game.flipP1 ? 'Left' : 'Right'} wins the round!`
    } else if (this.game.status === GameStatus.WIN) {
      status = 'You won the round!'
    } else if (this.game.status === GameStatus.LOSS) {
      status = 'You lost the round!'
    }
    const statusTime = `${this.game.roundPlayers.length && !this.game.status ? ((Date.now() - this.game.roundStart) / 1000).toFixed(1) + '/' : ''}${((Date.now() - this.game.gameStart) / 1000).toFixed(1)}`
    this.drawStatus(ctx, W, H, status ? `${status} (${statusTime})` : statusTime)
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
    const w = 0.02 * W * this.game.mode.optSizeNet / 100
    const hScaled = 0.175 * this.game.mode.optSizeNet / 100
    const h = (hScaled + 0.025) * H

    ctx.fillStyle = '#fff'
    ctx.fillRect(0.5 * (W - w), (1 - FLOOR_SIZE - hScaled) * H, w, h)
  }

  drawBall (ctx: CanvasRenderingContext2D, W: number, H: number, flip: boolean, trace?: boolean): void {
    const b = this.game.ball

    let x = b.x
    let y = b.y
    if (!trace) {
      x += b.xe
      y += b.ye
    }
    if (flip) x = 2 - x
    y = (1 - y) - FLOOR_SIZE

    ctx.beginPath()
    ctx.arc(x * H, y * H, BALL_RADIUS * this.game.mode.optSizeBall / 100 * H, 0, 2 * Math.PI)
    ctx.closePath()
    if (trace) {
      ctx.lineWidth = 2
      ctx.strokeStyle = 'red'
      ctx.stroke()
      return
    }
    ctx.fillStyle =
      this.game.status === GameStatus.WIN
        ? '#0f0'
        : this.game.status === GameStatus.LOSS
          ? 'red'
          : '#ff0'
    ctx.fill()
  }

  drawSlimer (ctx: CanvasRenderingContext2D, W: number, H: number, x: number, y: number,
    color: string | CanvasGradient | CanvasPattern, name: string, flip: boolean, p2: boolean, trace?: boolean): void {
    const b = this.game.ball
    const slimeSize = SLIME_SIZE * this.game.mode.optSizePlayer / 100

    // transform to screen space
    if (flip) x = 2 - x
    y = (1 - y) - FLOOR_SIZE

    // draw slimer
    ctx.beginPath()
    ctx.arc(x * H, y * H, slimeSize * H, 0, Math.PI, true)
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
    let ex = x + ((flip !== p2) ? -0.535 : 0.535) * slimeSize
    let ey = y - 0.525 * slimeSize
    ctx.beginPath()
    ctx.arc(ex * H, ey * H, 0.175 * slimeSize * H, 0, 2 * Math.PI, true)
    ctx.closePath()
    ctx.fillStyle = '#fff'
    ctx.fill()
    // draw pupil
    const dx = (flip ? 2 - (b.x + b.xe) : b.x + b.xe) - ex
    const dy = ((1 - (b.y + b.ye)) - FLOOR_SIZE) - ey
    const l2 = (dx * dx) + (dy * dy)
    const pupilDisplacement = 0.05 * slimeSize
    const f = l2 > pupilDisplacement * pupilDisplacement
      ? pupilDisplacement / Math.sqrt(l2)
      : 1
    ex += dx * f
    ey += dy * f
    ctx.beginPath()
    ctx.arc(ex * H, ey * H, 0.1 * slimeSize * H, 0, 2 * Math.PI, true)
    ctx.closePath()
    ctx.fillStyle = '#000'
    ctx.fill()

    // draw nametag
    if (name) {
      ctx.font = (0.0225 * W) + 'px Verdana, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillStyle = '#ccc'
      ctx.fillText(name, x * H, (y - 0.05 - slimeSize) * H)
    }
  }

  drawScore (ctx: CanvasRenderingContext2D, W: number, H: number, flip: boolean, p1score: string | number | bigint, p2score: string | number | bigint): void {
    ctx.font = (0.05 * W) + 'px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#fd0'
    ctx.fillText(p1score + '', (flip ? 0.92 : 0.08) * W, 0.15 * H)
    ctx.fillText(p2score + '', (flip ? 0.08 : 0.92) * W, 0.15 * H)
  }

  drawStatus (ctx: CanvasRenderingContext2D, W: number, H: number, status: string): void {
    ctx.font = (0.04 * W) + 'px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ddd'
    ctx.fillText(status, 0.5 * W, 0.15 * H)
  }

  drawFPS (ctx: CanvasRenderingContext2D, W: number, H: number): void {
    if (!this.game) return

    const fps = 1000 / Math.max(this.game.smoothDelay, 0.5)

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
