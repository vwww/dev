
import type { ByteReader } from './ByteReader'
import { CommonClient, CommonGame } from './CommonGame.svelte'

export const RealTimeClient = CommonClient

export abstract class RealTimeGame<C extends CommonClient> extends CommonGame<C> {
  sendReady (): void { }

  roundPlayers: C[] = $state([])

  protected abstract processRoundInfo (m: ByteReader): void
  protected processWelcomeGame (m: ByteReader): void {
    this.roundPlayers = this.clients.filter(c => c.active)
    this.processRoundInfo(m)
  }

  protected override playerActivated (player: C): void {
    this.roundPlayers.push(player)
  }

  protected override playerDeactivated (player: C): void {
    this.roundPlayers = this.roundPlayers.filter((p) => p !== player)
  }

  lastUpdate = Date.now()
  smoothDelay = 1000

  update (isInterval?: boolean): void {
    const dt = Date.now() - this.lastUpdate
    if (isInterval && dt < 1000) return

    this.smoothDelay = ((this.smoothDelay * 4) + dt) / 5
    this.updateGameState(dt, this.lastUpdate = Date.now())
  }

  abstract updateGameState (dt: number, now: number): void

  abstract render (ctx: CanvasRenderingContext2D): void
}
