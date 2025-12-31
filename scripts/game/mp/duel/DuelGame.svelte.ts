import { ByteReader } from '@gmc/game/ByteReader'
import { filterChat } from '@gmc/game/CommonGame.svelte'
import { RealTimeClient, RealTimeGame } from '@gmc/game/RealTimeGame.svelte'
import type { BaseGameRoom } from '@gmc/remote/BaseGameRoom'

import { defaultMode, DIMENSION_SCALE, type DuelMode } from './gamemode'

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
  ADD_BOT,
  DEL_BOT,
  WORLDSTATE,
  KILL,
}

const enum C2S {
  RESET,
  RENAME,
  PONG,
  CHAT,
  ACTIVE,
  MOVE,
}

class DuelClient extends RealTimeClient {
  hue = 0

  kills = $state(0n)
  deaths = $state(0n)
  score = $state(0n)

  resetScore () {
    this.kills = 0n
    this.deaths = 0n
    this.score = 0n
  }

  override readWelcome (m: ByteReader): void {
    super.readWelcome(m)

    this.hue = m.get()
    this.kills = m.getUint64()
    this.deaths = m.getUint64()
    this.score = m.getUint64()
  }

  override processJoin (cn: number, m: ByteReader): void {
    super.processJoin(cn, m)

    this.hue = m.get()
  }
}

export class DuelGame extends RealTimeGame<DuelClient> {
  mode: DuelMode = $state(defaultMode())

  lastPhysFrame = 0
  players = Array.from({ length: PLAYERS_NUM }, (_, i) => new DuelPlayer(i))
  player1?: DuelPlayer

  moveX = 0
  moveY = 0
  lastSentX = -1
  lastSentY = -1

  showFPS = true
  drawDev = true
  topType = $state(DuelTopType.MASS)
  topSize = 5

  topProp = $derived((['m', 'score', 'kills'] as const)[this.topType])
  duelTop: DuelPlayer[] = []

  override newClient () { return new DuelClient }

  enterGame (room: BaseGameRoom, name: string, hue: string): void {
    let hueHex = parseInt(hue, 16)
    if (Number.isNaN(hueHex)) hueHex = Math.random() * 0x100

    this.setupGame(room)
    this.sendf('isc', this.PROTOCOL_VERSION, name, hueHex & 0xFF)
  }

  sendReset (): void { this.sendf('i', C2S.RESET) }
  sendRename (newName: string): void { this.sendf('is', C2S.RENAME, newName) }
  sendPong (t: number): void { this.sendf('i2', C2S.PONG, t) }
  sendChat (s: string, flags: number, target = -1): void { this.sendf('i3s', C2S.CHAT, flags, target, filterChat(s)) }
  sendActive (): void { this.sendf('i', C2S.ACTIVE) }
  sendMove (x: number, y: number): void {
    x = (x * 0xFFFF) | 0
    y = (y * 0xFFFF) | 0
    this.sendf('ic4', C2S.MOVE, x >> 8, x & 0xff, y >> 8, y & 0xff)
  }

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
    [S2C.ADD_BOT]: this.processAddBot,
    [S2C.DEL_BOT]: this.processDelBot,
    [S2C.WORLDSTATE]: this.processWorldState,
    [S2C.KILL]: this.processKill,
  }

  protected override playerActivated (player: DuelClient): void {
    super.playerActivated(player)

    const p = this.players[player.cn]

    p.type = DuelPlayerType.HUMAN
    p.kills = 0n
    p.deaths = 0n
    p.combo = 0n
    p.score = 0n
    p.alive = false
    p.color = formatColor(player.hue, player === this.localClient ? 0 : p.type)

    if (player === this.localClient) {
      this.player1 = p
    }
  }

  protected override playerDeactivated (player: DuelClient): void {
    super.playerDeactivated(player)

    this.players[player.cn].type = DuelPlayerType.UNUSED

    if (player === this.localClient) {
      this.player1 = undefined
    }
  }

  protected processWelcomeMode (m: ByteReader): void {
    this.mode.optBotBalance = Math.min(Number(m.getUint64()), 64)
    this.mode.optSkill = Math.min(m.get(), 100)
    this.mode.optBotWin = Math.min(m.get(), 100)
    this.mode.optTransfer = Math.min(m.get(), 100)
    this.mode.optOverlap = Math.min(m.get(), 100)
    this.mode.optDimension = Math.min(Number(m.getUint64()), 100 * DIMENSION_SCALE)
  }

  protected override processRoundInfo (m: ByteReader): void {
    // reset players
    for (const p of this.players) {
      p.type = DuelPlayerType.UNUSED
    }
    this.player1 = undefined

    for (let i = 0; i <= PLAYERS_NUM; i++) {
      const flags = m.getUint64()
      if (!flags) break

      const pn = Number(flags >> 1n) - 1
      const isBot = flags & 1n

      const k = m.getUint64()
      const d = m.getUint64()
      const c = m.getUint64()
      const s = m.getUint64()

      const hue = isBot ? m.get() : this.clients[pn]?.hue ?? 0
      const type = isBot ? DuelPlayerType.BOT : DuelPlayerType.HUMAN

      const p = this.players[pn]
      p.kills = k
      p.deaths = d
      p.combo = c
      p.score = s
      p.alive = false
      p.color = formatColor(hue, p.type = type)
    }

    if (this.topType !== DuelTopType.MASS) {
      this.calcTop()
    }
  }

  protected processAddBot (m: ByteReader): void {
    const pn = Number(m.getUint64())
    const hue = m.get()

    const p = this.players[pn]
    p.kills = 0n
    p.deaths = 0n
    p.combo = 0n
    p.score = 0n
    p.alive = false
    p.color = formatColor(hue, p.type = DuelPlayerType.BOT)

    if (this.topType !== DuelTopType.MASS) {
      this.calcTop()
    }
  }

  protected processDelBot (m: ByteReader): void {
    const pn = Number(m.getUint64())
    this.players[pn].type = DuelPlayerType.UNUSED

    if (this.topType !== DuelTopType.MASS) {
      this.calcTop()
    }
  }

  protected processWorldState (m: ByteReader): void {
    for (let i = 0; i <= PLAYERS_NUM; i++) {
      const flags = m.getUint64()
      if (!flags) break

      const x = m.getUint16() * MAXX / 0xFFFF
      const y = m.getUint16() * MAXY / 0xFFFF
      const dx = m.getUint16() * MAXX / 0xFFFF
      const dy = m.getUint16() * MAXY / 0xFFFF
      const mass = m.getFloat64()

      const p = this.players[Number(flags) - 1]
      p.m = mass
      if (this.mode.optDimension === 2 * DIMENSION_SCALE) {
        p.r = Math.sqrt(mass)
      } else {
        p.r = mass ** (DIMENSION_SCALE / this.mode.optDimension)
      }
      if (!p.alive) {
        p.alive = true
        p.ex = 0
        p.ey = 0
      } else {
        p.ex += p.x - x
        p.ey += p.y - y
      }
      p.x = x
      p.y = y
      p.dx = dx
      p.dy = dy
    }

    this.lastPhysFrame = Date.now()

    if (this.topType === DuelTopType.MASS) {
      this.calcTop()
    }
  }

  protected processKill (m: ByteReader): void {
    const killer = Number(m.getUint64())
    const victim = Number(m.getUint64())

    // update duel player score
    const k = this.players[killer]
    const v = this.players[victim]
    k.kills++
    k.combo++
    v.deaths++
    v.alive = false
    v.combo = 0n
    if (killer === victim) {
      k.score--
    } else {
      k.score += k.combo
    }

    // update client score
    const kc = k.type === DuelPlayerType.HUMAN && this.clients[killer]
    const vc = v.type === DuelPlayerType.HUMAN && this.clients[victim]
    if (kc) {
      kc.kills++
      if (killer === victim) {
        kc.score--
      } else {
        kc.score += k.combo
      }
    }
    if (vc) {
      vc.deaths++
    }
    this.updatePlayers()

    if (this.topType !== DuelTopType.MASS) {
      this.calcTop()
    }
  }

  calcTop(): void {
    this.duelTop = this.players
      .filter((p) => p.type)
      .sort((a, b) => Number(b[this.topProp] as any - (a[this.topProp] as any)))
  }

  updateNetwork (): void {
    if (!this.room || !this.localClient.active) return

    // Send desired position
    if (Math.abs(this.moveX - this.lastSentX) > 0.01
        || Math.abs(this.moveY - this.lastSentY) > 0.01) {
      this.sendMove(this.lastSentX = this.moveX, this.lastSentY = this.moveY)
    }

    // FUTURE: send spawn request
  }

  override updateGameState (dt: number, now: number): void {
    if (!this.room) return
    this.updateNetwork()

    // update game
    if (!dt) return

    // Exponential moving average for error
    // Move 99.9% in 1 second
    const errMul = Math.pow(0.001, dt / 1000)
    for (const p of this.players) {
      if (p.alive) {
        p.ex *= errMul
        p.ey *= errMul
      }
    }

    const PHYS_TIME = 1000 / PHYS_FPS
    const physframes = Math.floor((now - this.lastPhysFrame) / PHYS_TIME)
    if (physframes) {
      for (const p of this.players) {
        // predict player positions
        let dx = p.dx - p.x
        let dy = p.dy - p.y
        const MOVE_SPEED = 200 / PHYS_FPS * physframes
        const l2 = (dx * dx) + (dy * dy)
        if (l2 > MOVE_SPEED * MOVE_SPEED) {
          const factor = MOVE_SPEED / Math.sqrt(l2)
          dx *= factor
          dy *= factor
        }
        p.x += dx
        p.y += dy
      }
      this.lastPhysFrame += physframes * PHYS_TIME
    }
  }

  // #region Draw
  drawClear (ctx: CanvasRenderingContext2D, W: number, H: number): void {
    ctx.fillStyle = '#37c'
    ctx.fillRect(0, 0, W, H)
  }

  drawPlayer (ctx: CanvasRenderingContext2D, W: number, H: number, p: DuelPlayer, owner: DuelClient | false): void {
    const x = p.x + p.ex
    const y = p.y + p.ey
    // draw body
    ctx.beginPath()
    ctx.arc(x / MAXX * W, y / MAXY * H, p.r / MAXX * W, 0, 2 * Math.PI)
    ctx.closePath()
    ctx.fillStyle = p.color
    ctx.fill()

    if (this.drawDev) {
      // draw true position
      ctx.beginPath()
      ctx.arc(p.x / MAXX * W, p.y / MAXY * H, p.r / MAXX * W, 0, 2 * Math.PI)
      ctx.closePath()
      ctx.lineWidth = 2
      ctx.strokeStyle = 'red'
      ctx.stroke()
      // show destination
      const grd = ctx.createLinearGradient(
        p.x / MAXX * W,
        p.y / MAXY * H,
        p.dx / MAXX * W,
        p.dy / MAXY * H
      )
      grd.addColorStop(0, 'red')
      grd.addColorStop(1, 'rgba(255,0,0,0.25)')

      ctx.strokeStyle = grd
      ctx.moveTo(p.x / MAXX * W, p.y / MAXY * H)
      ctx.lineTo(p.dx / MAXX * W, p.dy / MAXY * H)
      ctx.stroke()
    }

    // draw battle chance
    if (this.player1 && this.player1.alive && p !== this.player1) {
      let dx = this.player1.x + this.player1.ex - x
      let dy = this.player1.y + this.player1.ey - y

      const l2 = (dx * dx) + (dy * dy)
      if (l2 > p.r * p.r) {
        const f = p.r / Math.sqrt(l2)
        dx *= f
        dy *= f
      }

      let pr = (100 - this.mode.optSkill) / 2 + (this.player1.m / (this.player1.m + p.m) * this.mode.optSkill)
      if (p.type === DuelPlayerType.BOT) pr = this.mode.optBotWin + (pr * (1 - this.mode.optBotWin / 100))

      ctx.font = (0.015 * W) + 'px Verdana, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = pr > 70 ? '#0f0' : pr < 40 ? '#f00' : '#aaa'
      ctx.fillText(Math.round(pr) + '%', (x + dx) / MAXX * W, (y + dy) / MAXY * H)
    }

    // draw nametag
    ctx.font = (0.015 * W) + 'px Verdana, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    if (owner) {
      ctx.fillStyle = '#ccc'
      ctx.fillText(owner.formatName(), x / MAXX * W, ((y / MAXY) - 0.01) * H)
    }
    ctx.fillStyle = '#eee'
    ctx.fillText(p.m.toLocaleString(), x / MAXX * W, ((y / MAXY) + 0.01) * H)
  }

  drawStatus (ctx: CanvasRenderingContext2D, W: number, H: number, status: string): void {
    ctx.font = (0.04 * W) + 'px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ddd'
    ctx.fillText(status, 0.5 * W, 0.15 * H)
  }

  drawFPS (ctx: CanvasRenderingContext2D, W: number, H: number): void {
    ctx.font = (0.02 * W) + 'px monospace'
    ctx.textAlign = 'left'
    ctx.fillStyle = '#fa0'
    ctx.fillText(Math.round(1000 / Math.max(this.smoothDelay, 0.5)) + ' fps', 0.01 * W, 0.97 * H)
  }

  override render (ctx: CanvasRenderingContext2D): void {
    const H = ctx.canvas.height
    const W = ctx.canvas.width

    this.drawClear(ctx, W, H)
    for (const p of
        this.mode.optOverlap
          ? this.players
            .filter((p) => p.type && p.alive)
            .sort((a, b) => a.m - b.m)
          : this.players) {
      if (p.type && p.alive) this.drawPlayer(ctx, W, H, p, p.type === DuelPlayerType.HUMAN && this.clients[p.pn])
    }

    // draw leaderboard
    if (this.topSize && this.duelTop.length) {
      const baseValue = Number(this.duelTop[0][this.topProp])
      const entryHeight = ((0.045 * H) | 0)
      const barHeight = ((0.015 * H) | 0)
      for (let i = Math.min(this.duelTop.length, this.topSize) - 1; i >= 0; i--) {
        const p = this.duelTop[i]
        const curValue = Number(p[this.topProp])

        const barRatio = i && baseValue ? curValue / baseValue : 1

        const w = 0.2 * W * barRatio
        const y = i * entryHeight + 1
        const ybar = y + entryHeight - barHeight
        ctx.fillStyle = p.color
        ctx.fillRect(1, ybar, w + 1, barHeight)
        ctx.strokeStyle = '#000'
        ctx.strokeRect(1, ybar, w + 1, barHeight)

        const text = Math.round(curValue).toLocaleString()
        const rightAlign = ctx.measureText(text).width < 0.9 * w
        ctx.fillStyle = p.type === DuelPlayerType.HUMAN ? '#eee' : '#ccc'
        ctx.font = (0.007 * W) + 'px Verdana, sans-serif'
        ctx.textAlign = rightAlign ? 'right' : 'left'
        ctx.textBaseline = 'middle'
        ctx.fillText(text, rightAlign ? w - 0.003 * W : w + 2 + 0.003 * W, ybar + 1 + (barHeight >> 1))
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.font = (p === this.player1 ? 'bold ' : '') + (0.01 * W) + 'px Verdana, sans-serif'
        const name = p.type === DuelPlayerType.HUMAN ? this.clients[p.pn].formatName() : `<bot ${p.pn}>`
        ctx.fillText(name, 2, y + 1 + 0.005 * H)
      }
    }

    // draw HUD
    let status: string | undefined
    if (!this.room) {
      status = 'Disconnected'
    } else if (this.player1) {
      status = this.player1.score +
        ' (' + this.player1.kills + '/' + this.player1.deaths + ') [' +
        this.player1.combo + 'x COMBO]'
    }
    if (status) this.drawStatus(ctx, W, H, status)
    if (this.showFPS) this.drawFPS(ctx, W, H)
  }
  // #endregion

  attachCanvas (canvas: HTMLCanvasElement): void {
    const game = this
    // event listeners
    function movestart (x: number, y: number) {
      game.moveX = (x - canvas.getBoundingClientRect().left) / canvas.width
      game.moveY = (y - canvas.getBoundingClientRect().top) / canvas.height
    }
    function movestop () {
      // stop moving
      if (game.player1) {
        game.moveX = game.player1.x / MAXX
        game.moveY = game.player1.y / MAXY
      }
    }
    function touchmove (event: TouchEvent) {
      if (event.targetTouches.length < 1) return

      event.preventDefault()

      const touch = event.targetTouches.item(0)!
      movestart(touch.clientX, touch.clientY)
    }
    canvas.addEventListener('mousemove', function (event) { movestart(event.clientX, event.clientY) })
    canvas.addEventListener('touchstart', touchmove)
    canvas.addEventListener('touchmove', touchmove)
    canvas.addEventListener('mouseleave', movestop)
    canvas.addEventListener('touchend', movestop)
    canvas.addEventListener('touchcancel', movestop)
  }

  protected override readonly playersSortProps = [
    (p: DuelClient) => p.score,
    (p: DuelClient) => p.kills,
  ]
}

const MAXX = 1600
const MAXY = 900
const PLAYERS_NUM = 64

const PHYS_FPS = 40

const enum DuelTopType {
  MASS,
  SCORE,
  KILLS,
}

const enum DuelPlayerType {
  UNUSED,
  HUMAN,
  BOT,
}

class DuelPlayer {
  type = DuelPlayerType.UNUSED
  color = 'black'
  kills = 0n
  deaths = 0n
  combo = 0n
  score = 0n

  // game state
  alive = false
  // position vector
  x = 0
  y = 0
  // position error vector
  ex = 0
  ey = 0
  // destination vector
  dx = 0
  dy = 0
  // size
  m = 1000
  r = 10

  constructor (public pn: number) {}
}

function formatColor (hue: number, type: number): string {
  const h = hue * (360 / 0x100)
  const sl = !type ? '90%,60%' : type === 1 ? '80%,40%' : '40%,20%'
  return 'hsl(' + h + ',' + sl + ')'
}
