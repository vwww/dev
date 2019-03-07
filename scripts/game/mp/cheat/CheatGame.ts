import { clamp } from '../../../util'
import { ValueStore, valueStore } from '../../../util/svelte'
import { ByteReader } from '../common/game/ByteReader'
import { ByteWriter } from '../common/game/ByteWriter'
import { RRTurnClient, RRTurnDiscInfo, RRTurnGame, RRTurnPlayerInfo } from '../common/game/RoundRobinGame'
import { TurnC2S } from '../common/game/TurnBasedGame'

interface CheatClient extends RRTurnClient {
  score: number

  wins: number
  streak: number

  rankLast: number
  rankBest: number
  rankWorst: number
}

interface CheatPlayerInfo extends RRTurnPlayerInfo {
  discardClaim: CardCount
  // hand?: CardCount // private
  handSize: number
}

interface CheatDiscInfo extends RRTurnDiscInfo {
  discardClaim: CardCount
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

export default class CheatGame extends RRTurnGame<CheatClient, CheatPlayerInfo, CheatDiscInfo, CheatGameHistory> {
  public readonly modeCard: ValueStore<OptCardCount> = valueStore(0)
  public readonly modeTrick: ValueStore<OptTrick> = valueStore(0)
  public readonly modeRound: ValueStore<OptRound> = valueStore(0)
  public readonly modePenalty: ValueStore<OptPenalty> = valueStore(0)

  public readonly pendingMove = valueStore(0)

  protected playersSortProps = [
    (p: CheatClient) => p.score,
    (p: CheatClient) => p.wins,
    (p: CheatClient) => p.streak,
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
  }

  protected processPrivateInfo (m: ByteReader): void {
    throw new Error('Method not implemented.')
  }

  protected processRoundStartInfo (m: ByteReader): void {
    throw new Error('Method not implemented.')
  }

  protected processRoundInfo (m: ByteReader): void {
    throw new Error('Method not implemented.')
  }

  protected processPlayerInfo (m: ByteReader, p: CheatPlayerInfo): void {
    throw new Error('Method not implemented.')
  }

  protected processDiscInfo (m: ByteReader, p: CheatDiscInfo): void {
    throw new Error('Method not implemented.')
  }

  protected processEliminate (m: ByteReader, d: CheatDiscInfo, p: CheatPlayerInfo): boolean {
    throw new Error('Method not implemented.')
  }

  protected processEndTurn2 (m: ByteReader): undefined {
    throw new Error('Method not implemented.')
  }

  protected processEndRound (m: ByteReader): void {
    throw new Error('Method not implemented.')
  }

  protected processWelcomeMode (m: ByteReader): void {
    this.modeCard.set(clamp(m.getInt(), 0, OptCardCount._NUM - 1))
    this.modeTrick.set(clamp(m.getInt(), 0, OptTrick._NUM - 1))
    this.modeRound.set(clamp(m.getInt(), 0, OptRound._NUM - 1))
    this.modePenalty.set(clamp(m.getInt(), 0, OptPenalty._NUM - 1))
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
      discardClaim: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      handSize: 0,
    }
  }

  protected makeDiscInfo (): CheatDiscInfo {
    return {
      ...RRTurnGame.DEFAULT_DISC_INFO,
      discardClaim: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    }
  }
}

type CardCount = [
  number, number, number, number, number,
  number, number, number, number, number,
  number, number, number,
]

const enum OptCardCount {
  ANY,
  SAME,
  SAME_INC,
  INC,
  SAME_DEC,
  DIFF,
  _NUM,
}

const enum OptTrick {
  WITHIN_1,
  WITHIN_2,
  SAME,
  CHANGE_1,
  UP_1,
  ANY,
  _NUM,
}

const enum OptRound {
  SKIP,
  PASS,
  FORCE,
  _NUM,
}

const enum OptPenalty {
  ALL,
  NEWEST_3,
  OLDEST_3,
  RANDOM_3,
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
  _NUM,
}
*/
