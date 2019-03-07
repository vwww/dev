import { ByteReader } from './ByteReader'
import { TurnBasedClient, TurnBasedGame, TurnC2S, TurnS2C } from './TurnBasedGame'

export interface OneTurnClient extends TurnBasedClient {
}
export const enum TPTurnS2C {
  NUM = TurnS2C.NUM,
}

export const enum RRTurnC2S {
  NUM = TurnC2S.NUM,
}

export abstract class OneTurnGame<C extends OneTurnClient, G> extends TurnBasedGame<C, G> {
  protected static DEFAULT_PLAYER: OneTurnClient = TurnBasedGame.DEFAULT_PLAYER

  protected INTERMISSION_TIME = 5000
  protected ROUND_TIME = 3000

  protected processEndTurn (m: ByteReader): void { /* ignore */ }
}
