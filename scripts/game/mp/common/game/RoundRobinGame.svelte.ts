import { TurnBasedClient, TurnBasedGame } from './TurnBasedGame.svelte'

export const RoundRobinClient = TurnBasedClient

export abstract class RoundRobinGame<C> extends TurnBasedGame<C> { }
