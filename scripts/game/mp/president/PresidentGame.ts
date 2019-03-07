import { clamp, sum } from '../../../util'
import { valueStore } from '../../../util/svelte'
import { ByteReader } from '../common/game/ByteReader'
import { ByteWriter } from '../common/game/ByteWriter'
import { RRTurnClient, RRTurnDiscInfo, RRTurnGame, RRTurnPlayerInfo } from '../common/game/RoundRobinGame'
import { TurnC2S } from '../common/game/TurnBasedGame'

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
  public readonly modeDeck = valueStore(0)
  public readonly modeJoker = valueStore(0)
  public readonly modeRevolution = valueStore(0 as OptRevolution)
  public readonly modeRevEndTrick = valueStore(false)
  public readonly mode1Fewer2 = valueStore(false)
  public readonly modePlayAfterPass = valueStore(false)
  public readonly modeEqualize = valueStore(0 as OptEqualize)
  public readonly modeEqualizeEndTrick = valueStore(0 as OptEqualizeEndTrick)
  public readonly modeEqualizeOnlyScum = valueStore(false)
  public readonly modeFirstTrick = valueStore(0 as OptFirstTrick)
  public readonly mode4inARow = valueStore(false)
  public readonly mode8 = valueStore(false)
  public readonly modeSingleTurn = valueStore(false)
  public readonly modePenalizeFinal2 = valueStore(false)
  public readonly modePenalizeFinalJoker = valueStore(false)

  public readonly pendingMove = valueStore(0)
  public readonly pendingMoveCount = valueStore(0)

  protected playersSortProps = [
    (p: PClient) => p.score,
    (p: PClient) => p.streak,
    (p: PClient) => p.rank2p,
    (p: PClient) => p.rank1p,
    (p: PClient) => p.rank0,
  ]

  sendMove (n: number, c: number): void {
    this.room?.send(new ByteWriter()
      .putInt(TurnC2S.MOVE)
      .putInt(n)
      .putInt(c)
      .toArray()
    )
  }

  protected processMoveConfirm (m: ByteReader): void {
    this.pendingMove.set(m.getInt())
    this.pendingMoveCount.set(m.getInt())
  }

  protected processPrivateInfo (m: ByteReader): void {
    throw new Error('Method not implemented.') // my card count
  }

  protected processRoundStartInfo (m: ByteReader): void {
    throw new Error('Method not implemented.') // rank info?
  }

  protected processRoundInfo (m: ByteReader): void {
    throw new Error('Method not implemented.')
  }

  protected processPlayerInfo (m: ByteReader, p: PPlayerInfo): void {
    p.handSize = m.getInt()
    p.discarded = readCardCount(m)
  }

  protected processDiscInfo (m: ByteReader, p: PDiscInfo): void {
    p.discarded = readCardCount(m)
  }

  protected processEliminate (m: ByteReader, d: PDiscInfo, p: PPlayerInfo): boolean {
    const isFirst = m.getBool()

    d.discarded = p.discarded
    d.hand = readCardCount(m)

    const c = this.clients.get(p.owner)
    if (c) {
      // const rank = this.playerInfo.get().length
      // updateScore(c, rank, rank + this.playerDiscInfo.get().length)
    }

    return isFirst
  }

  protected processEndTurn2 (m: ByteReader): undefined {
    // const card = m.getInt()
    // const cardCount = m.getFloat64()

    throw new Error('Method not implemented.')
  }

  protected processEndRound (m: ByteReader): void {
    // const playerInfos = this.playerInfo.get()

    // for (const p of playerInfos) {
    //   p.hand = readCardCount(m)
    // }

    // calculate ranks
    // this.addHistory(gameHistoryEntry)
  }

  protected processWelcomeMode (m: ByteReader): void {
    this.modeDeck.set(clamp(m.getInt(), 1, MAX_DECKS))
    this.modeJoker.set(clamp(m.getInt(), 0, 2))
    this.modeRevolution.set(clamp(m.getInt(), 0, OptRevolution._NUM - 1))
    this.modeRevEndTrick.set(m.getBool())
    this.mode1Fewer2.set(m.getBool())
    this.modePlayAfterPass.set(m.getBool())
    this.modeEqualize.set(clamp(m.getInt(), 0, OptEqualize._NUM - 1))
    this.modeEqualizeEndTrick.set(clamp(m.getInt(), 0, OptEqualizeEndTrick._NUM - 1))
    this.modeEqualizeOnlyScum.set(m.getBool())
    this.modeFirstTrick.set(clamp(m.getInt(), 0, OptFirstTrick._NUM - 1))
    this.mode4inARow.set(m.getBool())
    this.mode8.set(m.getBool())
    this.modeSingleTurn.set(m.getBool())
    this.modePenalizeFinal2.set(m.getBool())
    this.modePenalizeFinalJoker.set(m.getBool())
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
