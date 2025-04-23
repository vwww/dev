import { TurnBasedClient, TurnBasedGame } from './TurnBasedGame.svelte'

export const OneTurnClient = TurnBasedClient

export abstract class OneTurnGame<C> extends TurnBasedGame<C> { }
