import { ByteReader } from './ByteReader'
import { type TurnBasedClient, TurnBasedGame, TurnC2S, TurnS2C } from './TurnBasedGame.svelte'

export interface OneTurnClient extends TurnBasedClient {
}
export const enum TPTurnS2C {
  NUM = TurnS2C.NUM,
}

export const enum RRTurnC2S {
  NUM = TurnC2S.NUM,
}

export abstract class OneTurnGame<C extends OneTurnClient, G> extends TurnBasedGame<C, G> {
  protected static override readonly DEFAULT_PLAYER: OneTurnClient = TurnBasedGame.DEFAULT_PLAYER

  protected override readonly INTERMISSION_TIME = 5000
  protected override readonly ROUND_TIME: number = 3000

  protected processEndTurn (m: ByteReader): void { /* ignore */ }
}
