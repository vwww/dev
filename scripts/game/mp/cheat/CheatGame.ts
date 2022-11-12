import { clamp } from '@/util'
import { valueStore } from '@/util/svelte'
import { ByteReader } from '@gmc/game/ByteReader'
import { ByteWriter } from '@gmc/game/ByteWriter'
import { RRTurnClient, RRTurnDiscInfo, RRTurnGame, RRTurnPlayerInfo } from '@gmc/game/RoundRobinGame'
import { TurnC2S } from '@gmc/game/TurnBasedGame'

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
  public readonly modeDecks = valueStore(0)
  public readonly modeCountSame = valueStore(false)
  public readonly modeCountMore = valueStore(false)
  public readonly modeCountLess = valueStore(false)
  public readonly modeTricks = valueStore(0 as OptTrick)
  public readonly modeRank0 = valueStore(false)
  public readonly modeRank1u = valueStore(false)
  public readonly modeRank1uw = valueStore(false)
  public readonly modeRank1d = valueStore(false)
  public readonly modeRank1dw = valueStore(false)
  public readonly modeRank2u = valueStore(false)
  public readonly modeRank2uw = valueStore(false)
  public readonly modeRank2d = valueStore(false)
  public readonly modeRank2dw = valueStore(false)
  public readonly modeRankother = valueStore(false)

  public readonly canCallCheat = valueStore(false)
  public readonly trickCount = valueStore(0)
  public readonly trickValue = valueStore(0)

  public readonly cardCountHandMine = valueStore(newZeroCardCount())
  public readonly cardCountAllMine = valueStore(newZeroCardCount())
  public readonly cardCountAllOthers = valueStore(newZeroCardCount())
  public readonly cardCountClaimMine = valueStore(newZeroCardCount())
  public readonly cardCountClaimOthers = valueStore(newZeroCardCount())
  public readonly cardCountClaimRemain = valueStore(newZeroCardCount())
  public readonly cardCountTotal = valueStore(newZeroCardCount())
  public readonly moveHistory = valueStore([] as CheatGameHistory[])

  public readonly pendingMove = valueStore(newZeroCardCount())
  public readonly pendingMoveClaim = valueStore(0)

  protected playersSortProps = [
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
    this.pendingMove.set(readCardCount(m))
    this.pendingMoveClaim.set(m.getInt())
  }

  protected processPrivateInfo (m: ByteReader): void {
    // TODO
    switch (m.getInt()) {
      case 0: // my cards
        this.cardCountHandMine.set(readCardCount(m))
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

    this.cardCountAllOthers.set(cardsRemain)
    this.cardCountClaimOthers.set(cardsClaim)
    this.cardCountTotal.set(cardsTotal)
    // this.cardCountClaimRemain.set(cardsClaimRemain)
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
    this.modeDecks.set(clamp(m.getFloat64(), 1, MAX_DECKS))
    this.modeCountSame.set(m.getBool())
    this.modeCountMore.set(m.getBool())
    this.modeCountLess.set(m.getBool())
    this.modeTricks.set(clamp(m.getInt(), 0, OptTrick._NUM - 1))
    this.modeRank0.set(m.getBool())
    this.modeRank1u.set(m.getBool())
    this.modeRank1uw.set(m.getBool())
    this.modeRank1d.set(m.getBool())
    this.modeRank1dw.set(m.getBool())
    this.modeRank2u.set(m.getBool())
    this.modeRank2uw.set(m.getBool())
    this.modeRank2d.set(m.getBool())
    this.modeRank2dw.set(m.getBool())
    this.modeRankother.set(m.getBool())
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
