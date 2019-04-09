import { Ball } from './Ball'
import { Player } from './Player'

export const SLIME_SIZE = 0.1
export const BALL_RADIUS = 0.03
export const FLOOR_SIZE = 0.2

export const SPAWN_P1_X = 0.45
export const SPAWN_P2_X = 2 - SPAWN_P1_X
export const SPAWN_BALL_Y = 0.5

export const enum GameStatus {
  IN_PLAY,
  WIN,
  LOSS
}

export class Game {
  private status = GameStatus.IN_PLAY
  private p1 = new Player()
  private p2 = new Player()
  private ball = new Ball()

  private smoothDelay = 1000
  private hasServerOpponent = false

  constructor () {
    // reset players
    this.p1.respawn(true)
    this.p2.respawn(false)
    // reset ball
    this.ball.respawn(true)
  }

  update (dt: number): void {
    this.smoothDelay = ((this.smoothDelay * 4) + dt) / 5

    if (!dt) return

    this.ball.move(dt)
    this.p1.move(dt)
    this.p2.move(dt)
  }

  getP1 (): Player { return this.p1 }
  getP2 (): Player { return this.p2 }
  getBall (): Ball { return this.ball }
  getStatus () { return this.status }
  getSmoothDelay () { return this.smoothDelay }
  getFPS () { return 1000 / Math.max(this.smoothDelay, 0.5) }
  hasOpponent () { return this.hasServerOpponent }

  setName (name: string): void {
    this.p1.name = name
  }

  setColor (color: string): void {
    this.p1.color = color
  }

  processServerDisconnect (): void {
    this.p1.ping = this.p2.ping = -1
  }
  processServerWelcome (color: string, name: string): void {
    this.p1.color = color
    this.p1.name = name
  }
  processServerState (p1x: number, p1y: number, p2x: number, p2y: number, bx: number, by: number): void {
    this.p1.setServerLocation(p1x, p1y)
    this.p2.setServerLocation(p2x, p2y)
    this.ball.setServerLocation(bx, by)
  }
  processServerEnter (color: string, name: string): void {
    this.hasServerOpponent = true
    this.p1.score = this.p2.score = 0

    this.p2.color = color
    this.p2.name = name
  }
  processServerLeave (): void {
    this.hasServerOpponent = false
  }
  processServerWin (): void {
    this.p1.score++
    this.status = GameStatus.WIN
  }
  processServerLose (): void {
    this.p2.score++
    this.status = GameStatus.LOSS
  }
  processServerRoundStart (p1Serves: boolean): void {
    this.p1.respawn(true)
    this.p2.respawn(false)
    this.ball.respawn(p1Serves)
    this.status = GameStatus.IN_PLAY
  }
  processServerPingTimes (p1: number, p2: number): void {
    this.p1.ping = p1
    this.p2.ping = p2
  }
}
