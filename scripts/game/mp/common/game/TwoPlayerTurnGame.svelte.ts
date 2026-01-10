import type { ByteReader } from './ByteReader'
import { formatClientName } from './common'
import { TurnBasedClient, TurnBasedGame } from './TurnBasedGame.svelte'

export class TwoPlayerTurnClient extends TurnBasedClient {
  score = $state(0) // 4 * win + 2 * tie + loss
  streak = $state(0)
  wins = $state(0)
  loss = $state(0)
  ties = $state(0)
  total = $state(0)

  setResult (win: number): void {
    if (!win) {
      this.wins++
      if (this.streak < 0) this.streak = 0
      this.streak++
      this.score += 4
    } else if (win === 1) {
      this.loss++
      if (this.streak > 0) this.streak = 0
      this.streak--
      this.score++
    } else {
      this.ties++
      this.score += 2
    }
    this.total++
  }

  resetScore () {
    this.score = 0
    this.streak = 0
    this.wins = 0
    this.loss = 0
    this.ties = 0
    this.total = 0
  }

  canResetScore () {
    return this.total
  }

  override readWelcome (m: ByteReader): void {
    super.readWelcome(m)

    this.streak = m.getInt()
    this.wins = m.getInt()
    this.loss = m.getInt()
    this.ties = m.getInt()
    this.total = this.wins + this.loss + this.ties
    this.score = (this.wins * 2 + this.ties) * 2 + this.loss
  }
}

export interface TwoPlayerTurnHistory {
  p0Name: string
  p1Name: string
  meIndex: number
  winner: number
  earlyEnd: boolean // forfeit or tie by agreement
  ply: number
}

export abstract class TwoPlayerTurnGame extends TurnBasedGame<TwoPlayerTurnClient, TwoPlayerTurnHistory> {
  p0 = -1
  p1 = -1
  ply = $state(0)
  winner = $state(0)
  myTurn = $state(false)
  myPlayer = $state(0)
  drawOffer = $state(0)

  canMove = $derived(this.playing && this.myTurn)

  override newClient () { return new TwoPlayerTurnClient }

  protected resetRound (): void {
    this.ply = 0
    this.winner = 0
    this.drawOffer = 0
  }

  protected abstract processRoundInfo (m: ByteReader): void
  protected override processWelcomeGame (m: ByteReader): void {
    super.processWelcomeGame(m)

    this.resetRound()
    this.processPlayerInfo(m)
    this.processRoundInfo(m)
  }

  protected abstract processRoundStartInfo (m: ByteReader): void
  protected override processRoundStart (m: ByteReader): void {
    super.processRoundStart(m)

    this.resetRound()
    this.processPlayerInfo(m)
    this.processRoundStartInfo(m)
  }

  protected processEndRound (m: ByteReader): void {
    const flags = m.getInt()
    const winner = flags & 3
    const earlyEnd = !!(flags & (1 << 2))
    const p0 = this.clients[this.p0]
    const p1 = this.clients[this.p1]

    p0?.setResult(winner)
    p1?.setResult(1 - winner)

    this.updatePlayers()
    this.addHistory({
      p0Name: formatClientName(p0, this.p0),
      p1Name: formatClientName(p1, this.p1),
      meIndex: this.myPlayer - 1,
      winner,
      earlyEnd,
      ply: this.ply,
    })

    this.winner = winner + 1
    this.drawOffer = 0
  }

  protected processPlayerInfo (m: ByteReader): void {
    this.p0 = m.getInt()
    this.p1 = m.getInt()

    const { cn } = this.localClient
    this.myPlayer =
      this.p0 === cn
        ? 1
        : this.p1 === cn
          ? 2
          : 0
    this.myTurn = (this.myPlayer === 1)
  }

  protected processOfferDraw (m: ByteReader): void {
    const drawReq = m.getInt()
    const cn = m.getCN()

    this.drawOffer = drawReq && (cn === this.localClient.cn ? 1 : 2)
  }

  protected nextTurn (): void {
    this.ply++
    const myPlayer = this.myPlayer
    this.myTurn = !!myPlayer && (this.ply & 1) === myPlayer - 1
  }

  protected override readonly playersSortProps = [
    (p: TwoPlayerTurnClient) => p.streak,
    (p: TwoPlayerTurnClient) => p.score,
    (p: TwoPlayerTurnClient) => p.wins,
    (p: TwoPlayerTurnClient) => p.ties,
  ]
}
