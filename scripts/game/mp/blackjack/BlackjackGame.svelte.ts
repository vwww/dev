import { ByteReader } from '@gmc/game/ByteReader'
import { ByteWriter } from '@gmc/game/ByteWriter'
import { type RRTurnClient, type RRTurnDiscInfo, RRTurnGame, type RRTurnPlayerInfo } from '@/game/mp/common/game/RoundRobinGame.svelte'
import { TurnC2S } from '@/game/mp/common/game/TurnBasedGame.svelte'

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
  public modeInverted = $state(false)
  public mode21 = $state(false)
  public modeDecks = $state(0)
  public modeDealerHitSoft = $state(false)
  public modeDealerPeek = $state(false)
  public modeDouble = $state(0/* BAny.Off */)
  public modeDoubleAfterSplit = $state(false)
  public modeSurrender = $state(0/* BSurrender.Off */)
  public modeSplitNonAce = $state(0)
  public modeSplitAce = $state(0)
  public modeHitSplitAce = $state(false)

  public pendingMove = $state(0)

  protected override readonly playersSortProps = [
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
    this.pendingMove = m.getInt()
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
    this.modeInverted = m.getBool()
    this.mode21 = m.getBool()
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
