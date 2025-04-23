import { TurnBasedClient, TurnBasedGame } from './TurnBasedGame.svelte'

export class TPTurnClient extends TurnBasedClient {
  score = $state(0) // 4 * win + 2 * tie + loss
  wins = $state(0)
  loss = $state(0)
  ties = $state(0)
  total = $state(0)
  streak = $state(0)

  resetScore () {
    this.score = 0
    this.wins = 0
    this.loss = 0
    this.ties = 0
    this.total = 0
    this.streak = 0
  }
}

export abstract class TPTurnGame extends TurnBasedGame<TPTurnClient> {
  override newClient () { return new TPTurnClient }
}
