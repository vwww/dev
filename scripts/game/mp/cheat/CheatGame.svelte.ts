import { clamp } from '@/util'
import { ByteReader } from '@gmc/game/ByteReader'
import { ByteWriter } from '@gmc/game/ByteWriter'
import { type RRTurnClient, type RRTurnDiscInfo, RRTurnGame, type RRTurnPlayerInfo } from '@/game/mp/common/game/RoundRobinGame.svelte'
import { TurnC2S } from '@/game/mp/common/game/TurnBasedGame.svelte'

interface CheatClient extends RRTurnClient {
  score: number

  wins: number
  streak: number

  rankLast: number
  rankBest: number
  rankWorst: number
}

interface CheatPlayerInfo extends RRTurnPlayerInfo {
  discardClaim: CardCountTotal
  // hand?: CardCount // private
  handSize: number
}

interface CheatDiscInfo extends RRTurnDiscInfo {
  discardClaim: CardCountTotal
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
}

const MAX_DECKS = 166_799_986_198_907

export default class CheatGame extends RRTurnGame<CheatClient, CheatPlayerInfo, CheatDiscInfo, CheatGameHistory> {
  public modeDecks = $state(0)
  public modeCountSame = $state(false)
  public modeCountMore = $state(false)
  public modeCountLess = $state(false)
  public modeTricks = $state(0 as OptTrick)
  public modeRank0 = $state(false)
  public modeRank1u = $state(false)
  public modeRank1uw = $state(false)
  public modeRank1d = $state(false)
  public modeRank1dw = $state(false)
  public modeRank2u = $state(false)
  public modeRank2uw = $state(false)
  public modeRank2d = $state(false)
  public modeRank2dw = $state(false)
  public modeRankother = $state(false)

  public canCallCheat = $state(false)
  public trickCount = $state(0)
  public trickValue = $state(0)

  public cardCountHandMine = $state(newZeroCardCount())
  public cardCountAllMine = $state(newZeroCardCount())
  public cardCountAllOthers = $state(newZeroCardCount())
  public cardCountClaimMine = $state(newZeroCardCount())
  public cardCountClaimOthers = $state(newZeroCardCount())
  public cardCountClaimRemain = $state(newZeroCardCount())
  public cardCountTotal = $state(newZeroCardCount())
  public moveHistory = $state([] as CheatGameHistory[])

  public pendingMove = $state(newZeroCardCount())
  public pendingMoveClaim = $state(0)

  protected override readonly playersSortProps = [
    (p: CheatClient) => p.score,
    (p: CheatClient) => p.wins,
    (p: CheatClient) => p.streak,
  ]

  sendMove (n: number, c: number): void {
    // TODO send actual counts after claim
    this.room?.send(new ByteWriter()
      .putInt(TurnC2S.MOVE)
      .putInt(0)
      .putInt(n) // omit, use actual for count
      .putInt(c)
      // TODO add actuals
      .toArray()
    )
  }

  sendMoveCheat (): void {
    this.room?.send(new ByteWriter()
      .putInt(TurnC2S.MOVE)
      .putInt(1)
      .toArray()
    )
  }

  protected processMoveConfirm (m: ByteReader): void {
    this.pendingMove = readCardCount(m)
    this.pendingMoveClaim = m.getInt()
  }

  protected processPrivateInfo (m: ByteReader): void {
    // TODO
    switch (m.getInt()) {
      case 0: // my cards
        this.cardCountHandMine = readCardCount(m)
        break
    }
  }

  protected processRoundStartInfo (m: ByteReader): void {
    // TODO
    throw new Error('Method not implemented.')
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

  protected processPlayerInfo (m: ByteReader, p: CheatPlayerInfo): void {
    p.discardClaim = readCardCount(m)
    p.handSize = m.getInt()
  }

  protected processDiscInfo (m: ByteReader, p: CheatDiscInfo): void {
    p.discardClaim = readCardCount(m)
  }

  protected processEliminate (m: ByteReader, d: CheatDiscInfo, p: CheatPlayerInfo): boolean {
    // TODO
    throw new Error('Method not implemented.')
  }

  protected processEndTurn2 (m: ByteReader): undefined {
    // TODO
    throw new Error('Method not implemented.')
  }

  protected processEndRound (m: ByteReader): void {
    // TODO
    throw new Error('Method not implemented.')
  }

  protected processWelcomeMode (m: ByteReader): void {
    this.modeDecks = clamp(m.getFloat64(), 1, MAX_DECKS)
    this.modeCountSame = m.getBool()
    this.modeCountMore = m.getBool()
    this.modeCountLess = m.getBool()
    this.modeTricks = clamp(m.getInt(), 0, OptTrick._NUM - 1)
    this.modeRank0 = m.getBool()
    this.modeRank1u = m.getBool()
    this.modeRank1uw = m.getBool()
    this.modeRank1d = m.getBool()
    this.modeRank1dw = m.getBool()
    this.modeRank2u = m.getBool()
    this.modeRank2uw = m.getBool()
    this.modeRank2d = m.getBool()
    this.modeRank2dw = m.getBool()
    this.modeRankother = m.getBool()
  }

  protected processWelcomePlayer (m: ByteReader, p: CheatClient): void {
    p.score = m.getInt()
    p.wins = m.getInt()
    p.streak = m.getInt()
    p.rankLast = m.getInt()
    p.rankBest = m.getInt()
    p.rankWorst = m.getInt()
  }

  protected playerResetStats (p: CheatClient): void {
    p.score = 0
    p.wins = 0
    p.streak = 0
    p.rankLast = 0
    p.rankBest = 0
    p.rankWorst = 0
  }

  protected makePlayer (): CheatClient {
    return {
      ...RRTurnGame.DEFAULT_PLAYER,
      score: 0,
      wins: 0,
      streak: 0,
      rankLast: 0,
      rankBest: 0,
      rankWorst: 0,
    }
  }

  protected makePlayerInfo (): CheatPlayerInfo {
    return {
      ...RRTurnGame.DEFAULT_PLAYER_INFO,
      discardClaim: newZeroCardCount(),
      handSize: 0,
    }
  }

  protected makeDiscInfo (): CheatDiscInfo {
    return {
      ...RRTurnGame.DEFAULT_DISC_INFO,
      discardClaim: newZeroCardCount(),
    }
  }
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

const enum OptTrick {
  SKIP,
  PASS,
  FORCE,
  _NUM,
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
