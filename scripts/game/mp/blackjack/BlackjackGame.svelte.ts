import { clamp } from '@/util'
import { ByteReader } from '@gmc/game/ByteReader'
import { filterChat } from '@gmc/game/CommonGame.svelte'
import { RoundRobinClient, RoundRobinGame, RRTurnDiscInfo, RRTurnPlayerInfo } from '@gmc/game/RoundRobinGame.svelte'
import type { BaseGameRoom } from '@gmc/remote/BaseGameRoom'

import { defaultMode, type BlackjackMode } from './gamemode'

const enum S2C {
  WELCOME,
  JOIN,
  LEAVE,
  RESET,
  RENAME,
  PING,
  PING_TIME,
  CHAT,
  ACTIVE,
  ROUND_WAIT,
  ROUND_INTERM,
  ROUND_START,
  READY,
  END_ROUND,
  MOVE_CONFIRM,
  END_TURN,
  PLAYER_ELIMINATE,
  PLAYER_ELIMINATE_EARLY,
  PLAYER_PRIVATE_INFO,
}

const enum C2S {
  RESET,
  RENAME,
  PONG,
  CHAT,
  ACTIVE,
  READY,
  MOVE,
  MOVE_END,
}

class BlackjackClient extends RoundRobinClient {
  score = $state(0)
  wins = $state(0)
  streak = $state(0)

  resetScore () {
    this.score = 0
    this.wins = 0
    this.streak = 0
  }

  override readWelcome (m: ByteReader): void {
    super.readWelcome(m)

    this.score = m.getInt()
    this.wins = m.getInt()
    this.streak = m.getInt()
  }
}

export class BlackjackPlayerInfo extends RRTurnPlayerInfo {
  hand: number[] = $state([])
  handVal = $state(0)
}

export class BlackjackDiscInfo extends RRTurnDiscInfo {
  hand: number[] = []
  handVal = 0
}

export interface BlackjackGameHistory {
  // duration: number
  players: BlackjackGameHistoryPlayer[]
}

export interface BlackjackGameHistoryPlayer {
  name: string
  cn: number

  score: number
  scoreChange: number
}

const enum BlackjackModeDouble {
  ANY,
  ON_9_10_11,
  ON_10_11,
  NUM,
}

const enum BlackjackModeSurrender {
  OFF,
  LATE,
  EARLY_NOT_ACE,
  EARLY,
  NUM,
}

const enum BlackjackMove {
  HIT,
  STAND,
  DOUBLE,
  SPLIT,
  SURRENDER,
  INSURANCE,
  NUM,
}

const CARDS_PER_DECK = 52
const MAX_DECKS = 9

export class BlackjackGame extends RoundRobinGame<BlackjackClient, BlackjackPlayerInfo, BlackjackDiscInfo, BlackjackGameHistory> {
  PlayerInfoType = BlackjackPlayerInfo
  PlayerDiscType = BlackjackDiscInfo

  mode: BlackjackMode = $state(defaultMode())

  // TODO
  // myHand = $state(0)
  // deckSize = $state(0)
  // cardCountDiscard = $state(newZeroCardCount())
  // cardCountRemain = $state(newZeroCardCount())
  // cardCountTotal = $state(newZeroCardCount())
  // moveHistory = $state([] as BlackjackMoveInfo[])

  pendingMove = $state(0)

  get ROUND_TIME () { return this.mode.optTurnTime }
  INTERMISSION_TIME = 30000

  override newClient () { return new BlackjackClient }

  enterGame (room: BaseGameRoom, name: string): void {
    this.setupGame(room)
    this.sendf('is', this.PROTOCOL_VERSION, name)
  }

  sendReset (): void { this.sendf('i', C2S.RESET) }
  sendRename (newName: string): void { this.sendf('is', C2S.RENAME, newName) }
  sendPong (t: number): void { this.sendf('i2', C2S.PONG, t) }
  sendChat (s: string, flags: number, target = -1): void { this.sendf('i3s', C2S.CHAT, flags, target, filterChat(s)) }
  sendActive (): void { this.sendf('i', C2S.ACTIVE) }
  sendReady (): void { this.sendf('i', C2S.READY) }
  sendMove (move: BlackjackMove): void { this.sendf('i2', C2S.MOVE, move) }
  sendMoveEnd (): void { this.sendf('i', C2S.MOVE_END) }

  MESSAGE_HANDLERS: Record<number, (this: this, m: ByteReader) => void> = {
    [S2C.WELCOME]: this.processWelcome,
    [S2C.JOIN]: this.processJoin,
    [S2C.LEAVE]: this.processLeave,
    [S2C.RESET]: this.processReset,
    [S2C.RENAME]: this.processRename,
    [S2C.PING]: this.processPing,
    [S2C.PING_TIME]: this.processPingTime,
    [S2C.CHAT]: this.processChat,
    [S2C.ACTIVE]: this.processActive,
    [S2C.ROUND_WAIT]: this.processRoundWait,
    [S2C.ROUND_INTERM]: this.processRoundInterm,
    [S2C.ROUND_START]: this.processRoundStart,
    [S2C.READY]: this.processReady,
    [S2C.END_ROUND]: this.processEndRound,
    [S2C.MOVE_CONFIRM]: this.processMoveConfirm,
    [S2C.END_TURN]: this.processEndTurn,
    [S2C.PLAYER_ELIMINATE]: this.processEliminate,
    [S2C.PLAYER_ELIMINATE_EARLY]: this.processEliminateEarly,
    [S2C.PLAYER_PRIVATE_INFO]: this.processPrivateInfo,
  }

  protected processWelcomeMode (m: ByteReader): void {
    this.mode.optTurnTime = m.getInt()
    this.mode.optDecks = clamp(m.getInt(), 1, MAX_DECKS)
    this.mode.optDouble = clamp(m.getInt(), 0, BlackjackModeDouble.NUM - 1)
    this.mode.optSurrender = clamp(m.getInt(), 0, BlackjackModeSurrender.NUM - 1)
    this.mode.optSplitNonAce = clamp(m.getInt(), 0, 3)
    this.mode.optSplitAce = clamp(m.getInt(), 0, 3)
    const modeFlags = m.get()
    this.mode.optInverted = !!(modeFlags & (1 << 0))
    this.mode.opt21 = !!(modeFlags & (1 << 1))
    this.mode.optDealerHitSoft = !!(modeFlags & (1 << 2))
    this.mode.optDealerPeek = !!(modeFlags & (1 << 3))
    this.mode.optDoubleAfterSplit = !!(modeFlags & (1 << 4))
    this.mode.optHitSplitAce = !!(modeFlags & (1 << 5))
  }

  protected processPlayerInfo (m: ByteReader, p: BlackjackPlayerInfo): void {
    const handSize = Math.min(m.getInt(), CARDS_PER_DECK * MAX_DECKS)
    p.hand = Array(handSize).fill(undefined).map(() => m.getInt())
    p.handVal = getHandVal(p.hand)
  }

  protected processDiscInfo (m: ByteReader, p: BlackjackDiscInfo): void {
    const handSize = Math.min(m.getInt(), CARDS_PER_DECK * MAX_DECKS)
    p.hand = Array(handSize).fill(undefined).map(() => m.getInt())
    p.handVal = getHandVal(p.hand)
  }

  protected processRoundStartInfo (m: ByteReader): void {
    // TODO
  }

  protected processRoundInfo (m: ByteReader): void {
    // TODO
  }

  protected processMoveConfirm (m: ByteReader) {
    this.pendingMove = m.getInt()
  }

  protected processEndTurn (m: ByteReader): void {
    // TODO

    this.setTimer(this.mode.optTurnTime)
    this.nextTurn()
  }

  protected processEndRound (m: ByteReader): void {
    // TODO
  }

  protected eliminatePlayer (m: ByteReader, d: BlackjackDiscInfo, pn: number, p: BlackjackPlayerInfo): boolean {
    // TODO
    return false
  }

  private processPrivateInfo (m: ByteReader): void {
    // TODO
  }

  protected override readonly playersSortProps = [
    (p: BlackjackClient) => p.score,
    (p: BlackjackClient) => p.wins,
    (p: BlackjackClient) => p.streak,
  ]
}

const enum CardValues {
  Ten,
  Ace,
  N2,
  N3,
  N4,
  N5,
  N6,
  N7,
  N8,
  N9,
  NUM,
}

function getHandVal (hand: number[]): number {
  let total = 0
  let hasAce = false
  for (const card of hand) {
    total += card || 10
    if (card === CardValues.Ace) {
      hasAce = true
    }
  }

  if (hasAce && total <= 11) total += 10
  return total
}
