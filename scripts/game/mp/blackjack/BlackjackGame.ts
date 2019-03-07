import { valueStore } from '../../../util/svelte'
import { ByteReader } from '../common/game/ByteReader'
import { ByteWriter } from '../common/game/ByteWriter'
import { RRTurnClient, RRTurnDiscInfo, RRTurnGame, RRTurnPlayerInfo } from '../common/game/RoundRobinGame'
import { TurnC2S } from '../common/game/TurnBasedGame'

interface BClient extends RRTurnClient {
  score: number
  wins: number
  streak: number
}

interface BPlayerInfo extends RRTurnPlayerInfo {
  hand: number[]
  handVal: number
}

interface BDiscInfo extends RRTurnDiscInfo {
  hand: number[]
  handVal: number
}

export interface BGameHistory {
  // duration: number
  players: BGameHistoryPlayer[]
}

export interface BGameHistoryPlayer {
  name: string
  cn: number

  score: number
  scoreChange: number
}

export default class BlackjackGame extends RRTurnGame<BClient, BPlayerInfo, BDiscInfo, BGameHistory> {
  public readonly modeInverted = valueStore(false)
  public readonly mode21 = valueStore(false)
  public readonly modeDecks = valueStore(0)
  public readonly modeDealerHitSoft = valueStore(false)
  public readonly modeDealerPeek = valueStore(false)
  public readonly modeDouble = valueStore(0/*BAny.Off*/)
  public readonly modeDoubleAfterSplit = valueStore(false)
  public readonly modeSurrender = valueStore(0/*BSurrender.Off*/)
  public readonly modeSplitNonAce = valueStore(0)
  public readonly modeSplitAce = valueStore(0)
  public readonly modeHitSplitAce = valueStore(false)

  public readonly pendingMove = valueStore(0)

  protected playersSortProps = [
    (p: BClient) => p.score,
    (p: BClient) => p.wins,
    (p: BClient) => p.streak,
  ]

  sendMove (n: number): void {
    this.room?.send(new ByteWriter()
      .putInt(TurnC2S.MOVE)
      .putInt(n)
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

  protected processPlayerInfo (m: ByteReader, p: BPlayerInfo): void {
    throw new Error('Method not implemented.')
  }

  protected processDiscInfo (m: ByteReader, p: BDiscInfo): void {
    throw new Error('Method not implemented.')
  }

  protected processEliminate (m: ByteReader, d: BDiscInfo, p: BPlayerInfo): false {
    throw new Error('Method not implemented.')
  }

  protected processEndTurn2 (m: ByteReader): undefined {
    throw new Error('Method not implemented.')
  }

  protected processEndRound (m: ByteReader): void {
    throw new Error('Method not implemented.')
  }

  protected processWelcomeMode (m: ByteReader): void {
    this.modeInverted.set(m.getBool())
    this.mode21.set(m.getBool())
  }

  protected processWelcomePlayer (m: ByteReader, p: BClient): void {
    p.score = m.getInt()
    p.wins = m.getInt()
    p.streak = m.getInt()
  }

  protected playerResetStats (p: BClient): void {
    p.score = 0
    p.wins = 0
    p.streak = 0
  }

  protected makePlayer (): BClient {
    return {
      ...RRTurnGame.DEFAULT_PLAYER,
      score: 0,
      wins: 0,
      streak: 0
    }
  }

  protected makePlayerInfo (): BPlayerInfo {
    return {
      ...RRTurnGame.DEFAULT_PLAYER_INFO,
      hand: [],
      handVal: 0,
    }
  }

  protected makeDiscInfo (): BDiscInfo {
    return {
      ...RRTurnGame.DEFAULT_DISC_INFO,
      hand: [],
      handVal: 0,
    }
  }
}
