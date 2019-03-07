import { clamp, sum } from '@/util'
import { ByteReader } from '@gmc/game/ByteReader'
import { ByteWriter } from '@gmc/game/ByteWriter'
import { type RRTurnClient, type RRTurnDiscInfo, RRTurnGame, type RRTurnPlayerInfo } from '@/game/mp/common/game/RoundRobinGame.svelte'
import { TurnC2S } from '@/game/mp/common/game/TurnBasedGame.svelte'

interface PClient extends RRTurnClient {
  score: number
  streak: number

  rank2p: number
  rank1p: number
  rank0: number
  rank1s: number
  rank2s: number
}

interface PPlayerInfo extends RRTurnPlayerInfo {
  discarded: CardCountTotal
  handSize: number
}

interface PDiscInfo extends RRTurnDiscInfo {
  discarded: CardCountTotal
  hand: CardCountTotal
}

export interface PGameHistory {
  // duration: number
  players: PGameHistoryPlayer[]
}

interface PGameHistoryPlayer {
  name: string
  cn: number

  prevRankType: number
  newRankType: number
}

export type PRankType = number // -2 = scum, -1 = vice scum, 0 = neutral, 1 = vice president, 2 = president

const MAX_DECKS = 166_799_986_198_907

export default class PresidentGame extends RRTurnGame<PClient, PPlayerInfo, PDiscInfo, PGameHistory> {
  public modeDeck = $state(0)
  public modeJoker = $state(0)
  public modeRevolution = $state(0 as OptRevolution)
  public modeRevEndTrick = $state(false)
  public mode1Fewer2 = $state(false)
  public modePlayAfterPass = $state(false)
  public modeEqualize = $state(0 as OptEqualize)
  public modeEqualizeEndTrick = $state(0 as OptEqualizeEndTrick)
  public modeEqualizeOnlyScum = $state(false)
  public modeFirstTrick = $state(0 as OptFirstTrick)
  public mode4inARow = $state(false)
  public mode8 = $state(false)
  public modeSingleTurn = $state(false)
  public modePenalizeFinal2 = $state(false)
  public modePenalizeFinalJoker = $state(false)

  public gamePhase = $state(0 as GamePhase)

  public pres = $state(0)
  public scum = $state(0)
  public vicePres = $state(0)
  public viceScum = $state(0)

  public lowGive0 = $state(0)
  public lowGive1 = $state(0)
  public hiGive0 = $state(0)
  public hiGive1 = $state(0)

  public revolution = $state(false)
  public trickCount = $state(0)
  public trickValue = $state(0)
  public trickMaxed = $state(false)

  public cardCountMine = $state(newZeroCardCount())
  public cardCountOthers = $state(newZeroCardCount())
  public cardCountDiscard = $state(newZeroCardCount())
  public cardCountTotal = $state(newZeroCardCount())
  public moveHistory = $state([] as PGameHistory[])

  public pendingMove = $state(0)
  public pendingMoveCount = $state(0)

  protected override readonly playersSortProps = [
    (p: PClient) => p.score,
    (p: PClient) => p.streak,
    (p: PClient) => p.rank2p,
    (p: PClient) => p.rank1p,
    (p: PClient) => p.rank0,
  ]

  sendMove (n: number, c: number): void {
    this.room?.send(new ByteWriter()
      .putInt(TurnC2S.MOVE)
      .putInt(1)
      .putInt(n)
      .putInt(c)
      .toArray()
    )
  }

  sendMoveTransfer (a: number, b: number): void {
    this.room?.send(new ByteWriter()
      .putInt(TurnC2S.MOVE)
      .putInt(0)
      .putInt(a)
      .putInt(b)
      .toArray()
    )
  }

  protected processMoveConfirm (m: ByteReader): void {
    this.pendingMove = m.getInt()
    this.pendingMoveCount = m.getInt()
  }

  protected processPrivateInfo (m: ByteReader): void {
    switch (m.getInt()) {
      case 0: // my card count
        this.cardCountMine = readCardCount(m)
        // this.recalcCards()
        break
      case 1: // (vice-)scum cards
        // TODO
        m.getInt()
        m.getInt()
        break
    }
  }

  protected processRoundStartInfo (m: ByteReader): void {
    const noPres = m.getBool()
    if (noPres) {
      this.gamePhase = GamePhase.NEW_TRICK
      // TODO
    } else {
      this.gamePhase = GamePhase.GIVE_CARDS
      this.processGiveCardInfo(m)
    }
    // TODO init cards
  }

  protected processRoundInfo (m: ByteReader): void {
    // TODO just discard count, calc others?
    const phase = m.getInt()
    this.gamePhase = phase
    switch (phase) {
      case GamePhase.GIVE_CARDS:
        this.processGiveCardInfo(m)
        break
      case GamePhase.IN_TRICK:
      case GamePhase.NEW_TRICK: {
        const discardCount = readCardCount(m)
        this.cardCountDiscard = discardCount
        // TODO infer from discarded?
      }
    }
  }

  protected processPlayerInfo (m: ByteReader, p: PPlayerInfo): void {
    p.handSize = m.getInt()
    p.discarded = readCardCount(m)
  }

  protected processDiscInfo (m: ByteReader, p: PDiscInfo): void {
    p.discarded = readCardCount(m)
    p.hand = readCardCount(m)
  }

  protected processEliminate (m: ByteReader, d: PDiscInfo, p: PPlayerInfo): boolean {
    const isFirst = m.getBool()

    d.discarded = p.discarded
    d.hand = readCardCount(m)

    const c = this.clients.get(p.owner)
    if (c) {
      // const rank = this.playerInfo.length
      // updateScore(c, rank, rank + this.playerDiscInfo.length)
    }

    return isFirst
  }

  protected processEndTurn2 (m: ByteReader): undefined {
    // const card = m.getInt()
    // const cardCount = m.getFloat64()

    throw new Error('Method not implemented.')
  }

  protected processEndRound (m: ByteReader): void {
    // const playerInfos = this.playerInfo

    // for (const p of playerInfos) {
    //   p.hand = readCardCount(m)
    // }

    // calculate ranks
    // this.addHistory(gameHistoryEntry)
  }

  protected processWelcomeMode (m: ByteReader): void {
    this.modeDeck = clamp(m.getInt(), 1, MAX_DECKS)
    this.modeJoker = clamp(m.getInt(), 0, 2)
    this.modeRevolution = clamp(m.getInt(), 0, OptRevolution._NUM - 1)
    this.modeRevEndTrick = m.getBool()
    this.mode1Fewer2 = m.getBool()
    this.modePlayAfterPass = m.getBool()
    this.modeEqualize = clamp(m.getInt(), 0, OptEqualize._NUM - 1)
    this.modeEqualizeEndTrick = clamp(m.getInt(), 0, OptEqualizeEndTrick._NUM - 1)
    this.modeEqualizeOnlyScum = m.getBool()
    this.modeFirstTrick = clamp(m.getInt(), 0, OptFirstTrick._NUM - 1)
    this.mode4inARow = m.getBool()
    this.mode8 = m.getBool()
    this.modeSingleTurn = m.getBool()
    this.modePenalizeFinal2 = m.getBool()
    this.modePenalizeFinalJoker = m.getBool()
  }

  protected processWelcomePlayer (m: ByteReader, p: PClient): void {
    p.score = m.getInt()
    p.streak = m.getInt()
    p.rank2p = m.getInt()
    p.rank1p = m.getInt()
    p.rank0 = m.getInt()
    p.rank1s = m.getInt()
    p.rank2s = m.getInt()
  }

  protected playerResetStats (p: PClient): void {
    p.score = 0
    p.streak = 0
    p.rank2p = 0
    p.rank1p = 0
    p.rank0 = 0
    p.rank1s = 0
    p.rank2s = 0
  }

  protected makePlayer (): PClient {
    return {
      ...RRTurnGame.DEFAULT_PLAYER,
      score: 0,
      streak: 0,
      rank2p: 0,
      rank1p: 0,
      rank0: 0,
      rank1s: 0,
      rank2s: 0,
    }
  }

  protected makePlayerInfo (): PPlayerInfo {
    return {
      ...RRTurnGame.DEFAULT_PLAYER_INFO,
      discarded: newZeroCardCount(),
      handSize: 0,
    }
  }

  protected makeDiscInfo (): PDiscInfo {
    return {
      ...RRTurnGame.DEFAULT_DISC_INFO,
      discarded: newZeroCardCount(),
      hand: newZeroCardCount(),
    }
  }

  private processGiveCardInfo (m: ByteReader): void {
    const pres = m.getInt()
    const scum = m.getInt()
    const vicePres = m.getInt()
    const viceScum = m.getInt()
    this.pres = pres
    this.scum = scum
    this.vicePres = vicePres
    this.viceScum = viceScum
  }
}

const enum OptRevolution {
  OFF,
  ON_STRICT,
  ON_RELAXED,
  ON,
  _NUM,
}

const enum OptEqualize {
  DISALLOW,
  ALLOW,
  CONTINUE_OR_SKIP,
  CONTINUE_OR_PASS,
  FORCE_SKIP,
  _NUM,
}

const enum OptFirstTrick {
  SCUM,
  PRESIDENT,
  RANDOM,
  _NUM,
}

const enum OptEqualizeEndTrick {
  OFF,
  SCUM,
  ANY,
  _NUM,
}

/*
const enum CardRank {
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
  Ace,
  N2,
  _NUM,
}
*/

const enum GamePhase {
  GIVE_CARDS,
  NEW_TRICK,
  IN_TRICK,
}

type CardCount = [
  number, number, number, number, number,
  number, number, number, number, number,
  number, number, number
]

type CardCountTotal = [...CardCount, number]

function newZeroCardCount (): CardCountTotal {
  return [
    0, 0, 0, 0, 0,
    0, 0, 0, 0, 0,
    0, 0, 0, 0,
  ]
}

function readCardCount (m: ByteReader): CardCountTotal {
  const v: CardCount = [
    m.getInt(), m.getInt(), m.getInt(), m.getInt(), m.getInt(),
    m.getInt(), m.getInt(), m.getInt(), m.getInt(), m.getInt(),
    m.getInt(), m.getInt(), m.getInt(),
  ]
  return [...v, sum(v)]
}
