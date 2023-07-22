import { valueStore } from '@/util/svelte'
import { ByteReader } from './ByteReader'
import { ByteWriter } from './ByteWriter'
import { CommonGame } from './CommonGame'
import { TurnBasedClient, TurnBasedGame, TurnC2S, TurnS2C } from './TurnBasedGame'

export interface TPTurnClient extends TurnBasedClient {
  score: number
  wins: number
  loss: number
  ties: number
  streak: number
}

export interface TPHistoryEntry {
  p0Name: string
  p1Name: string
  winner: number
  earlyEnd: boolean // forfeit or tie by agreement
  ply: number
}

export const enum TPTurnS2C {
  OFFER_DRAW = TurnS2C.NUM,
  NUM,
}

export const enum TPTurnC2S {
  FORFEIT = TurnC2S.NUM,
  OFFER_DRAW,
  REJECT_DRAW,
  NUM,
}

export abstract class TPTurnGame<C extends TPTurnClient> extends TurnBasedGame<C, TPHistoryEntry> {
  protected static override readonly DEFAULT_PLAYER: TPTurnClient = {
    ...TurnBasedGame.DEFAULT_PLAYER,
    score: 0, // 4 * win + 2 * tie + loss
    wins: 0,
    loss: 0,
    ties: 0,
    streak: 0,
  }

  protected p0 = -1
  protected p1 = -1
  protected ply = valueStore(0)
  protected winner = valueStore(0)
  protected myTurn = valueStore(false)
  protected myPlayer = valueStore(0)
  protected drawOffer = valueStore(0)

  public override sendMoveEnd (): void {
    this.room?.send(new ByteWriter()
      .putInt(TurnC2S.MOVE_END)
      .toArray()
    )
  }

  public sendResign (): void {
    this.room?.send(new ByteWriter()
      .putInt(TPTurnC2S.FORFEIT)
      .toArray()
    )
  }

  public sendDrawOffer (): void {
    this.room?.send(new ByteWriter()
      .putInt(TPTurnC2S.OFFER_DRAW)
      .toArray()
    )
  }

  public sendDrawReject (): void {
    this.room?.send(new ByteWriter()
      .putInt(TPTurnC2S.REJECT_DRAW)
      .toArray()
    )
  }

  protected override processWelcomeGame2 (m: ByteReader): void {
    this.resetRound()
    this.processPlayerInfo(m)
    this.processRoundInfo(m)
  }

  protected override processRoundStart (m: ByteReader): void {
    this.resetRound()
    this.processPlayerInfo(m)
    this.processRoundStartInfo(m)
  }

  protected abstract processRoundInfo (m: ByteReader): void
  protected abstract processRoundStartInfo (m: ByteReader): void

  protected processEndRound (m: ByteReader): void {
    const winner = m.getInt()
    const earlyEnd = m.getBool()
    const p0 = this.clients.get(this.p0)
    const p1 = this.clients.get(this.p1)

    if (p0) this.setResult(p0, winner)
    if (p1) this.setResult(p1, 1 - winner)

    const entry: TPHistoryEntry = {
      p0Name: CommonGame.formatPlayerName(p0, this.p0),
      p1Name: CommonGame.formatPlayerName(p1, this.p1),
      winner,
      earlyEnd,
      ply: this.ply.get(),
    }
    this.addHistory(entry)

    this.winner.set(winner + 1)
    this.drawOffer.set(0)
  }

  protected processWelcomePlayer (m: ByteReader, p: C): void {
    p.wins = m.getInt()
    p.loss = m.getInt()
    p.ties = m.getInt()
    p.streak = m.getInt()
    p.score = (((p.wins << 1) + p.ties) << 1) + p.loss
  }

  protected playerResetStats (p: C): void {
    p.score = 0
    p.wins = 0
    p.loss = 0
    p.ties = 0
    p.streak = 0
  }

  protected processEndTurn (m: ByteReader): void {
    this.processEndTurn2(m)

    this.ply.update((v) => v + 1)
    const myPlayer = this.myPlayer.get()
    this.myTurn.set(!!myPlayer && (this.ply.get() & 1) === myPlayer - 1)

    this.setTimer(this.ROUND_TIME)
  }

  protected abstract processEndTurn2 (m: ByteReader): void

  protected override processMessage3 (type: number, m: ByteReader): boolean {
    switch (type) {
      case TPTurnS2C.OFFER_DRAW: {
        const drawReq = m.getInt()
        const cn = m.getInt()

        this.drawOffer.set(drawReq && (cn === this.myCn ? 1 : 2))
        break
      }
      default:
        return false
    }
    return true
  }

  private resetRound (): void {
    this.ply.set(0)
    this.winner.set(0)
    this.drawOffer.set(0)
  }

  private processPlayerInfo (m: ByteReader): void {
    this.p0 = m.getInt()
    this.p1 = m.getInt()

    this.myPlayer.set(
      this.p0 === this.myCn
        ? 1
        : this.p1 === this.myCn
          ? 2
          : 0)
    this.myTurn.set(this.p0 === this.myCn)
  }

  private setResult (p: C, win: number): void {
    if (!win) {
      p.wins++
      if (p.streak < 0) p.streak = 0
      p.streak++
      p.score += 4
    } else if (win === 1) {
      p.loss++
      if (p.streak > 0) p.streak = 0
      p.streak--
      p.score++
    } else {
      p.ties++
      p.score += 2
    }
  }
}
