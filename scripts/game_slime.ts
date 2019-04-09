import { Game } from './game/slime/Game'
import { IConnector } from './game/slime/net/IConnector'
import { IConnectorCallbacks } from './game/slime/net/IConnectorCallbacks'
import { PlayerIOConnector } from './game/slime/net/PlayerIOConnector'
// import { WebSocketConnector } from './game/slime/net/WebSocketConnector'
import { GameDrawer } from './game/slime/ui/GameDrawer'
import { ISlimeUICallbacks } from './game/slime/ui/IConnectorCallbacks'
import { SlimeUI } from './game/slime/ui/SlimeUI'
import { $ready } from './util'

class SlimeController implements IConnectorCallbacks, ISlimeUICallbacks {
  private game = new Game()
  private ui = new SlimeUI(this)
  private net: IConnector = new PlayerIOConnector(this) // new WebSocketConnector(this)
  private gameDrawer = new GameDrawer(this.game, () => this.net.readyState())

  constructor () {
    this.ui.restoreSettings()
  }

  processUIupdate (dt: number): void {
    this.game.update(dt)
    this.net.update()
    this.gameDrawer.fancy.update(dt)
    this.gameDrawer.draw(this.ui.getContext())
  }
  processUIconnect (): void {
    if (this.net.isConnected()) {
      this.net.disconnect()
    } else {
      this.net.connect()
    }
  }
  processUIchangeName (name: string): void {
    if (!this.net.isConnected()) this.game.setName(name)
  }
  processUIchangeColor (color: string): void {
    if (!this.net.isConnected()) this.game.setColor(color)
  }
  processUIchangeFlipP1 (flipP1: boolean): void {
    this.gameDrawer.flipP1 = flipP1
  }
  processUIchangeFancyBackground (on: boolean): void {
    this.gameDrawer.drawFancyBackground = on
  }
  processUIchangeDrawDev (on: boolean): void {
    this.gameDrawer.drawDev = on
  }

  getUserName (): string {
    return this.ui.getUserName()
  }
  getUserColor (): number {
    return this.ui.getUserColor()
  }
  getKeyFlags (): number {
    const flipP1 = this.gameDrawer.flipP1
    let keyFlags = this.ui.getInputManager().getKeyFlags(flipP1)
    const mouse = this.ui.getInputManager().getMouse()
    if (mouse.isValid()) {
      let x = mouse.getX()
      if (flipP1) x = 1 - x

      const MouseX = Math.min(Math.max(x * 2, 0), 1)
      const MouseYJump = mouse.getY() < 0.45

      const p1x = this.game.getP1().x

      if (!(keyFlags & 3) && Math.abs(p1x - MouseX) > 0.05) {
        keyFlags |= p1x < MouseX ? 2 : 1
      }
      if (MouseYJump) keyFlags |= 4
    }
    return keyFlags
  }

  shouldSendNetworkUpdate (): boolean {
    return this.game.hasOpponent()
  }
  processServerConnect (): void {
    this.ui.processServerConnect()
  }
  processServerDisconnect (): void {
    this.game.processServerDisconnect()
    this.ui.processServerDisconnect()
  }
  processServerWelcome (color: string, name: string): void {
    this.game.processServerWelcome(color, name)
  }
  processServerState (p1x: number, p1y: number, p2x: number, p2y: number, bx: number, by: number): void {
    this.game.processServerState(p1x, p1y, p2x, p2y, bx, by)
  }
  processServerEnter (color: string, name: string): void {
    this.game.processServerEnter(color, name)
  }
  processServerLeave (): void {
    this.game.processServerLeave()
  }
  processServerWin (): void {
    this.game.processServerWin()
  }
  processServerLose (): void {
    this.game.processServerLose()
  }
  processServerRoundStart (p1Serves: boolean): void {
    this.game.processServerRoundStart(p1Serves)
  }
  processServerPingTimes (p1: number, p2: number): void {
    this.game.processServerPingTimes(p1, p2)
  }
}

$ready(() => {
  new SlimeController()
})
