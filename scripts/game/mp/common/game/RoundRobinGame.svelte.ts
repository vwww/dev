import { TurnBasedClient, TurnBasedGame } from './TurnBasedGame.svelte'

export class RoundRobinClient extends TurnBasedClient {}

export class RRTurnPlayerInfo {
  owner = $state(-1)
}

export class RRTurnDiscInfo {
  ownerName = ''
}

export abstract class RoundRobinGame<
  C extends RoundRobinClient,
  P extends RRTurnPlayerInfo,
  D extends RRTurnDiscInfo,
  H> extends TurnBasedGame<C, H> {
  playerInfo: P[] = $state([])
  playerDiscInfo: D[] = $state([])
}
