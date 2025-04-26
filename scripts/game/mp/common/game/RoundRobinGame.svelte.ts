import { TurnBasedClient, TurnBasedGame } from './TurnBasedGame.svelte'

export class RoundRobinClient extends TurnBasedClient {}

export abstract class RoundRobinGame<C extends RoundRobinClient, H> extends TurnBasedGame<C, H> { }
