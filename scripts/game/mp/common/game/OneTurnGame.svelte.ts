import { TurnBasedClient, TurnBasedGame } from './TurnBasedGame.svelte'

export abstract class OneTurnClient extends TurnBasedClient {}

export abstract class OneTurnGame<C extends OneTurnClient, H> extends TurnBasedGame<C, H> {}
