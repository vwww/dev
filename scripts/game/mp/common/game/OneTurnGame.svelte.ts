import { TurnBasedClient, TurnBasedGame } from './TurnBasedGame.svelte'

// export abstract class OneTurnClient extends TurnBasedClient {}
export const OneTurnClient = TurnBasedClient

export abstract class OneTurnGame<C extends TurnBasedClient, H> extends TurnBasedGame<C, H> {}
