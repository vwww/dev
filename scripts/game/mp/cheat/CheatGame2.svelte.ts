import { clamp } from '@/util'
import { ByteReader } from '@gmc/game/ByteReader'
import { filterChat } from '@gmc/game/CommonGame.svelte'
import { RoundRobinClient, RoundRobinGame, RRTurnDiscInfo, RRTurnPlayerInfo } from '@gmc/game/RoundRobinGame.svelte'
import type { BaseGameRoom } from '@gmc/remote/BaseGameRoom'

import { defaultMode, type CheatMode } from './gamemode'

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
  MOVE_CONFIRM,
  END_ROUND,
  END_TURN,
  PLAYER_ELIMINATE,
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

class CheatClient extends RoundRobinClient {
  score = $state(0)

  wins = $state(0)
  streak = $state(0)

  rankLast = $state(0)
  rankBest = $state(0)
  rankWorst = $state(0)

  resetScore () {
    this.score = 0

    this.wins = 0
    this.streak = 0

    this.rankLast = 0
    this.rankBest = 0
    this.rankWorst = 0
  }

  override readWelcome (m: ByteReader): void {
    super.readWelcome(m)

    this.score = m.getInt()
    this.wins = m.getInt()
    this.streak = m.getInt()
    this.rankLast = m.getInt()
    this.rankBest = m.getInt()
    this.rankWorst = m.getInt()
  }
}

export class CheatPlayerInfo extends RRTurnPlayerInfo {
  discardClaim: CardCountTotal = $state(newZeroCardCount())
  // hand?: CardCount // private
  handSize = $state(0)
}

export class CheatDiscInfo extends RRTurnDiscInfo {
  discardClaim: CardCountTotal = newZeroCardCount()
  // hand: CardCount // reveal? if not, how to handle claims?
  // handSize: number
}

export interface CheatGameHistory {
  // duration: number
  players: CheatGameHistoryPlayer[]
}

export interface CheatGameHistoryPlayer {
  name: string
  cn: number

  // TODO other info
}

const enum CheatModeTricks {
  SKIP,
  PASS,
  FORCE,
  NUM,
}

// const CARDS_PER_DECK = 52
const MAX_DECKS = 166_799_986_198_907n

export class CheatGame extends RoundRobinGame<CheatClient, CheatPlayerInfo, CheatDiscInfo, CheatGameHistory> {
  PlayerInfoType = CheatPlayerInfo
  PlayerDiscType = CheatDiscInfo

  mode: CheatMode = $state(defaultMode())

  canCallCheat = $state(false)
  trickCount = $state(0)
  trickValue = $state(0)

  cardCountHandMine = $state(newZeroCardCount())
  cardCountAllMine = $state(newZeroCardCount())
  cardCountAllOthers = $state(newZeroCardCount())
  cardCountClaimMine = $state(newZeroCardCount())
  cardCountClaimOthers = $state(newZeroCardCount())
  cardCountClaimRemain = $state(newZeroCardCount())
  cardCountTotal = $state(newZeroCardCount())
  moveHistory = $state([] as CheatGameHistory[])

  pendingMove = $state(newZeroCardCount())
  pendingMoveClaim = $state(0)

  get ROUND_TIME () { return this.mode.optTurnTime }
  INTERMISSION_TIME = 30000

  override newClient () { return new CheatClient }

  enterGame (room: BaseGameRoom, name: string): void {
    this.setupGame(room)
    this.sendf('is', this.PROTOCOL_VERSION, name)
  }

  sendReset (): void { this.sendf('i', C2S.RESET) }
  sendRename (newName: string): void { this.sendf('is', C2S.RENAME, newName) }
  sendPong (t: number): void { this.sendf('i2', C2S.PONG, t) }
  sendChat (s: string, flags: number, target = -1): void { this.sendf('i3s', C2S.CHAT, flags, target, filterChat(s)) }
  sendActive (active: boolean): void { this.sendf('ib', C2S.ACTIVE, active) }
  sendReady (ready: boolean): void { this.sendf('ib', C2S.READY, ready) }
  sendMove (n: number, c: number): void {
    this.sendf('i4',
      // TODO send actual counts after claim
      C2S.MOVE,
      0,
      n, // omit, use actual for count
      c,
      // TODO add actuals
    )
  }
  sendMoveCallCheat (): void { this.sendf('i2', C2S.MOVE, 1) }
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
    [S2C.MOVE_CONFIRM]: this.processMoveConfirm,
    [S2C.END_TURN]: this.processEndTurn,
    [S2C.END_ROUND]: this.processEndRound,
    [S2C.PLAYER_ELIMINATE]: this.processEliminate,
    [S2C.PLAYER_PRIVATE_INFO]: this.processPrivateInfo,
  }

  protected processWelcomeMode (m: ByteReader): void {
    this.mode.optTurnTime = m.getInt()
    this.mode.optDecks = clamp(m.getUint64(), 1n, MAX_DECKS)
    this.mode.optTricks = clamp(m.getInt(), 0, CheatModeTricks.NUM - 1)
    const modeFlags = m.getInt()
    this.mode.optCountSame = !!(modeFlags & (1 << 0))
    this.mode.optCountMore = !!(modeFlags & (1 << 1))
    this.mode.optCountLess = !!(modeFlags & (1 << 2))
    this.mode.optRank0 = !!(modeFlags & (1 << 3))
    this.mode.optRank1u = !!(modeFlags & (1 << 4))
    this.mode.optRank1uw = !!(modeFlags & (1 << 5))
    this.mode.optRank1d = !!(modeFlags & (1 << 6))
    this.mode.optRank1dw = !!(modeFlags & (1 << 7))
    this.mode.optRank2u = !!(modeFlags & (1 << 8))
    this.mode.optRank2uw = !!(modeFlags & (1 << 9))
    this.mode.optRank2d = !!(modeFlags & (1 << 10))
    this.mode.optRank2dw = !!(modeFlags & (1 << 11))
    this.mode.optRankother = !!(modeFlags & (1 << 12))
  }

  protected processPlayerInfo (m: ByteReader, p: CheatPlayerInfo): void {
    p.discardClaim = readCardCount(m)
    p.handSize = m.getInt()
  }

  protected processDiscInfo (m: ByteReader, p: CheatDiscInfo): void {
    p.discardClaim = readCardCount(m)
  }

  protected processRoundStartInfo (m: ByteReader): void {
    // TODO
  }

  protected processRoundInfo (m: ByteReader): void {
    const cardsRemain = readCardCount(m)
    const cardsClaim = readCardCount(m)
    const cardsTotal = newTotalCardCount(1) // TODO use mode count
    // const cardsClaimRemain = [] // calc from total

    this.cardCountAllOthers = cardsRemain
    this.cardCountClaimOthers = cardsClaim
    this.cardCountTotal = cardsTotal
    // this.cardCountClaimRemain = cardsClaimRemain
  }

  protected processMoveConfirm (m: ByteReader) {
    this.pendingMove = readCardCount(m)
    this.pendingMoveClaim = m.getInt()
  }

  protected processEndTurn (m: ByteReader): void {
    // TODO

    this.setTimer(this.mode.optTurnTime)
    this.nextTurn()
  }

  protected processEndRound (m: ByteReader): void {
    // TODO
  }

  protected eliminatePlayer (m: ByteReader, d: CheatDiscInfo, p: CheatPlayerInfo): void {
    // TODO
  }

  private processPrivateInfo (m: ByteReader): void {
    // TODO
    switch (m.getInt()) {
      case 0: // my cards
        this.cardCountHandMine = readCardCount(m)
        break
    }
  }

  protected override readonly playersSortProps = [
    (p: CheatClient) => p.score,
    (p: CheatClient) => p.wins,
    (p: CheatClient) => p.streak,
  ]
}

type CardCount = [
  number, number, number, number, number,
  number, number, number, number, number,
  number, number, number,
  number,
]
type CardCountTotal = [...CardCount, number]

function newZeroCardCount (): CardCountTotal {
  return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
}

function newTotalCardCount (decks: number): CardCountTotal {
  const jokers = decks + decks
  const normal = jokers + jokers
  return [
    normal, normal, normal, normal, normal,
    normal, normal, normal, normal, normal,
    normal, normal, normal, jokers, 54 * decks
  ]
}

function readCardCount (m: ByteReader): CardCountTotal {
  const c0 = m.getInt()
  const c1 = m.getInt()
  const c2 = m.getInt()
  const c3 = m.getInt()
  const c4 = m.getInt()
  const c5 = m.getInt()
  const c6 = m.getInt()
  const c7 = m.getInt()
  const c8 = m.getInt()
  const c9 = m.getInt()
  const c10 = m.getInt()
  const c11 = m.getInt()
  const c12 = m.getInt()
  const c13 = m.getInt()
  return [
    c0, c1, c2, c3, c4,
    c5, c6, c7, c8, c9,
    c10, c11, c12, c13,
    c0 + c1 + c2 + c3 + c4 + c5 + c6 + c7 + c8 + c9 + c10 + c11 + c12 + c13,
  ]
}

/*
const enum CardRank {
  Ace,
  N2,
  N3,
  N4,
  N5,
  N6,
  N7,
  N8,
  N9,
  N10,
  FJack,
  FQueen,
  FKing,
  Joker,
  _NUM,
}
*/
