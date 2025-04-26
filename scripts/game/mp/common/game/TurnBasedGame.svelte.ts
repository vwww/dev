import type { ByteReader } from './ByteReader'
import { CommonClient, CommonGame } from './CommonGame.svelte'

export const enum GameState {
  WAITING,
  INTERMISSION,
  ACTIVE,
}

export class TurnBasedClient extends CommonClient {
  ready = $state(false)
  inRound = $state(false)

  override readWelcome (m: ByteReader): void {
    super.readWelcome(m)

    this.ready = false
    this.inRound = false
  }
}

const MAX_HISTORY_LEN = 100

export abstract class TurnBasedGame<C extends TurnBasedClient, H> extends CommonGame<C> {
  roundState = $state(GameState.WAITING)
  roundTimerStart = $state(0)
  roundTimerEnd = $state(0)

  roundPlayers: C[] = $state([])
  roundPlayerQueue: C[] = $state([])

  pastGames: H[] = $state([])

  addHistory (history: H): void {
    if (this.pastGames.length >= MAX_HISTORY_LEN)
      this.pastGames.pop()
    this.pastGames.unshift(history)
  }

  clearHistory (): void {
    this.pastGames = []
  }

  protected roundWait (): void {
    this.roundState = GameState.WAITING
    this.unsetReady()
  }

  protected roundIntermission (remain: number): void {
    this.roundState = GameState.INTERMISSION
    this.setTimer(remain)
    this.unsetReady()
  }

  protected roundStart (remain: number): void {
    this.roundState = GameState.ACTIVE
    this.setTimer(remain)
    this.unsetReady()
  }

  protected setTimer (remain: number): void {
    this.roundTimerStart = Date.now()
    this.roundTimerEnd = Date.now() + remain
  }

  protected unsetReady (): void {
    this.clients.forEach((c) => c.ready = false)
  }

  protected unsetInRound (): void {
    this.clients.forEach((c) => c.inRound = false)
  }

  protected playerActivated (player: C): void {
    this.roundPlayerQueue.push(player)
  }

  protected playerDeactivated (player: C): void {
    this.roundPlayers = this.roundPlayers.filter((p) => p !== player)
    this.roundPlayerQueue = this.roundPlayerQueue.filter((p) => p !== player)
    player.inRound = false
  }
}
