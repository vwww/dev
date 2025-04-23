import { CommonClient, CommonGame } from './CommonGame.svelte'

export const enum GameState {
  WAITING,
  INTERMISSION,
  ACTIVE,
}

export class TurnBasedClient extends CommonClient {
  ready = $state(false)
  inRound = $state(false)
}

export abstract class TurnBasedGame<C> extends CommonGame<C> {
  roundState = $state(GameState.WAITING)
  roundTimerStart = $state(0)
  roundTimerEnd = $state(0)

  roundPlayers: C[] = $state([])
  roundPlayerQueue: C[] = $state([])
}
