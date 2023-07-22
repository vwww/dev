import { clamp, sum } from '@/util'
import { valueStore } from '@/util/svelte'
import { ByteReader } from '@gmc/game/ByteReader'
import { ByteWriter } from '@gmc/game/ByteWriter'
import { CommonGame } from '@gmc/game/CommonGame'
import { RRTurnClient, RRTurnDiscInfo, RRTurnGame, RRTurnPlayerInfo } from '@gmc/game/RoundRobinGame'
import { TurnC2S } from '@gmc/game/TurnBasedGame'

interface DClient extends RRTurnClient {
  score: number
  streak: number
  wins: number
  losses: number

  rankLast: number
  rankBest: number
  rankWorst: number
}

interface DPlayerInfo extends RRTurnPlayerInfo {
  discarded: number[]
  discardSum: number
  immune: boolean
  hand?: number
}

interface DDiscInfo extends RRTurnDiscInfo {
  discarded: number[]
  discardSum: number
}

export interface DGameHistory {
  survived: {
    name: string
    rank: number
    hand: number
    discarded: number[]
    discardSum: number
  }[]

  eliminated: {
    name: string
    discarded: number[]
    discardSum: number
  }[]
}

export type DiscardMoveInfo =
  | DiscardMoveInfoMove
  | DiscardMoveInfoReveal
  | DiscardMoveInfoCompare
  | DiscardMoveInfoTrade

interface DiscardMoveInfoMove {
  type: 'move'
  playerName: string
  playerIsMe: boolean
  move: number
  targetName: string
  targetIsMe: boolean
  targetIsPlayer: boolean
  targetValid: boolean
  info: number
}

interface DiscardMoveInfoReveal {
  type: 'reveal'
  playerName: string
  hand: number
}

interface DiscardMoveInfoCompare {
  type: 'cmp'
  playerName: string
  ours: number
  theirs: number
}

interface DiscardMoveInfoTrade {
  type: 'trade'
  playerName: string
  oldHand: number
  newHand: number
}

const CARDS_PER_DECK = 15
const MAX_DECKS = 3

export default class DiscardGame extends RRTurnGame<DClient, DPlayerInfo, DDiscInfo, DGameHistory> {
  public readonly modeTurnTime = valueStore(0)
  public readonly modeDeck = valueStore(0)

  public readonly myHand = valueStore(0)
  public readonly myAltMove = valueStore(0)
  public readonly deckSize = valueStore(0)
  public readonly cardCountDiscard = valueStore(newZeroCardCount())
  public readonly cardCountRemain = valueStore(newZeroCardCount())
  public readonly cardCountTotal = valueStore(newZeroCardCount())
  public readonly moveHistory = valueStore([] as DiscardMoveInfo[])

  public readonly pendingMoveUseHand = valueStore(false)
  public readonly pendingMoveTarget = valueStore(0)
  public readonly pendingMoveGuess = valueStore(0)

  protected override readonly playersSortProps = [
    (p: DClient) => p.score,
    (p: DClient) => p.wins,
    (p: DClient) => p.streak,
  ]

  sendMove (useHand: boolean, target: number, guess: number): void {
    this.room?.send(new ByteWriter()
      .putInt(TurnC2S.MOVE)
      .putBool(useHand)
      .putInt(target)
      .putInt(guess)
      .toArray()
    )
  }

  sendMoveUseHand (uh: boolean): void {
    this.sendMove(uh, this.pendingMoveTarget.get(), this.pendingMoveGuess.get())
  }

  sendMoveTarget (target: number): void {
    this.sendMove(this.pendingMoveUseHand.get(), target, this.pendingMoveGuess.get())
  }

  sendMoveGuess (guess: number): void {
    this.sendMove(this.pendingMoveUseHand.get(), this.pendingMoveTarget.get(), guess)
  }

  protected processMoveConfirm (m: ByteReader): void {
    this.pendingMoveUseHand.set(m.getBool())
    this.pendingMoveTarget.set(m.getInt())
    this.pendingMoveGuess.set(m.getInt())
  }

  protected processPrivateInfo (m: ByteReader): void {
    const x = m.getInt()
    switch (x) {
      case -1:
        this.myHand.set(m.getInt())
        break
      case 0:
        this.myAltMove.set(m.getInt())
        break
      case 2:
      case 3:
      case 6: {
        const pn = m.getInt()
        const hand = m.getInt()

        const player = this.getPlayerInfo(pn)
        const playerName = this.getNameFromPlayer(player, pn)

        switch (x) {
          case 2:
            if (player) {
              player.hand = hand
              this.updatePlayerInfo()
            }
            this.moveHistory.update((h) => [...h, { type: 'reveal', playerName, hand }])
            break
          case 3: {
            const ours = this.myHand.get()
            if (player) {
              player.hand = hand
              this.updatePlayerInfo()
            }
            this.moveHistory.update((h) => [...h, { type: 'cmp', ours, theirs: hand, playerName }])
            break
          }
          case 6: {
            const oldHand = this.myHand.get()
            this.moveHistory.update((h) => [...h, { type: 'trade', oldHand, newHand: hand, playerName }])
            if (player) {
              player.hand = oldHand
              this.updatePlayerInfo()
            }
            this.myHand.set(hand)
            break
          }
        }
        break
      }
    }
  }

  protected processRoundStartInfo (m: ByteReader): void {
    // infer deck size by dealing 1 card per player, then first player card
    // special case: (15 * decks) players => 0 turns
    this.deckSize.set(Math.max(0, this.modeDeck.get() * CARDS_PER_DECK - this.playerInfo.get().length - 1))
    this.cardCountDiscard.set(newZeroCardCount())
    this.cardCountRemain.set(newTotalCardCount(this.modeDeck.get()))
    this.cardCountTotal.set(newTotalCardCount(this.modeDeck.get()))

    this.moveHistory.set([])
  }

  protected processRoundInfo (m: ByteReader): void {
    this.deckSize.set(m.getInt())
    const discardCount: CardCountTotal = [
      m.getInt(), m.getInt(), m.getInt(), m.getInt(),
      m.getInt(), m.getInt(), m.getInt(), m.getInt(),
      0
    ]
    discardCount[8] = sum(discardCount.slice(0, 8))

    const totalCard = newTotalCardCount(this.modeDeck.get())
    this.cardCountDiscard.set(discardCount)
    this.cardCountRemain.set(totalCard.map((v, i) => v - discardCount[i]) as CardCountTotal)
    this.cardCountTotal.set(totalCard)

    this.moveHistory.set([])
  }

  protected processPlayerInfo (m: ByteReader, p: DPlayerInfo): void {
    const discardSize = Math.min(m.getInt(), CARDS_PER_DECK * MAX_DECKS)
    p.discarded = Array(discardSize).fill(undefined).map(() => m.getInt())
    p.immune = m.getBool()
    p.discardSum = sum(p.discarded)
  }

  protected processDiscInfo (m: ByteReader, d: DDiscInfo): void {
    const discardSize = Math.min(m.getInt(), CARDS_PER_DECK * MAX_DECKS)
    d.discarded = Array(discardSize).fill(undefined).map(() => m.getInt())
    d.discardSum = sum(d.discarded)
  }

  protected processEliminate (m: ByteReader, d: DDiscInfo, p: DPlayerInfo): false {
    const hand = m.getInt()
    d.discarded = [...p.discarded, hand]
    d.discardSum = p.discardSum + hand
    this.updateDiscardCount(hand)

    const c = this.clients.get(p.owner)
    if (c) {
      const rank = this.playerInfo.get().length
      updateScore(c, rank, rank + this.playerDiscInfo.get().length)
    }

    return false
  }

  protected processEndTurn2 (m: ByteReader): number | undefined {
    const p = this.getPlayerInfo(0)
    if (!p) return
    const move = m.getInt()
    const target = m.getInt()

    const c = this.clients.get(p.owner)
    const targetInfo = this.getPlayerInfo(target)

    const moveHistoryEntry: DiscardMoveInfoMove = {
      type: 'move',
      playerName: CommonGame.formatPlayerName(c, p.owner),
      playerIsMe: c?.isMe ?? false,
      move,
      targetName: targetInfo ? CommonGame.formatPlayerName(this.clients.get(targetInfo.owner), target) : 'nobody',
      targetIsMe: this.playerIsMe(targetInfo),
      targetIsPlayer: targetInfo === p,
      targetValid: !!targetInfo,
      info: 0,
    }

    if (c?.isMe && move === this.myHand.get()) {
      this.myHand.set(this.myAltMove.get())
    }
    if (p.hand === move) {
      // if other players' revealed card is used, it is now unknown
      p.hand = undefined
    }
    if (move !== 8) {
      // when voluntarily discarding 8, it will be discarded during elimination
      p.discarded.push(move)
      p.discardSum += move
      this.updateDiscardCount(move)
    }

    switch (move) {
      case 1: {
        // guess
        const guess = m.getInt()
        const elim = m.getBool()
        moveHistoryEntry.info = elim ? -guess : guess
        break
      }
      case 2: // reveal separately
        break
      case 3: { // also compare separately
        if (target > 0) {
          const result = m.getInt()
          moveHistoryEntry.info = result
          if (result) {
            // different cards: we can infer a range, or infer exact if the other is 7
            if (result === -7 && targetInfo) {
              targetInfo.hand = 8
            } else if (result === 7) {
              p.hand = 8
            }
          } else {
            // equal cards: copy hand value from other
            if (targetInfo && targetInfo.hand !== p.hand) {
              if (targetInfo.hand === undefined) {
                targetInfo.hand = p.hand
              } else if (p.hand === undefined) {
                p.hand = targetInfo.hand
              }
            }
          }
        }
        break
      }
      case 4:
        // immune until next turn
        p.immune = true
        break
      case 5: {
        // target draws (target receives new card separately)
        const discarded = m.getInt()
        moveHistoryEntry.info = discarded
        if (discarded !== 8) {
          p.discarded.push(discarded)
          p.discardSum += discarded
          this.updateDiscardCount(discarded)
          this.deckSize.update((s) => s - 1)
        } else {
          // other players' known hands can become unknown
          // when they are forced to draw
          p.hand = undefined
        }
        break
      }
      case 6:
        // trade
        // just swap hand knowledge
        if (targetInfo && !this.playerIsMe(p) && !this.playerIsMe(targetInfo)) {
          const tmp = targetInfo.hand
          targetInfo.hand = p.hand
          p.hand = tmp
        }
        break
      case 7:
      case 8:
        // do nothing
    }

    // pre-deal out next card (not if less than 2 left)
    this.deckSize.update((s) => s > 1 ? s - 1 : s)
    this.moveHistory.update((h) => [...h, moveHistoryEntry])

    const nextPlayer = this.getPlayerInfo(1)
    if (nextPlayer) {
      nextPlayer.immune = false
    }
    return undefined
  }

  protected processEndRound (m: ByteReader): void {
    const playerInfos = this.playerInfo.get()

    for (const p of playerInfos) {
      p.hand = m.getInt()
    }

    const eliminated = this.playerDiscInfo.get().map((d) => ({ ...d, name: d.ownerName }))
    eliminated.reverse()

    const gameHistoryEntry: DGameHistory = {
      survived: [],
      eliminated,
    }

    const totalPlayers = playerInfos.length + this.playerDiscInfo.get().length

    const sortedPlayers = [...playerInfos].sort(comparePlayerInfo)
    let rank = 1
    for (let i = 0; i < sortedPlayers.length; i++) {
      const p = sortedPlayers[i]
      if (i && comparePlayerInfo(p, sortedPlayers[i - 1])) {
        rank = i + 1
      }

      const c = this.clients.get(p.owner)

      gameHistoryEntry.survived.push({
        name: CommonGame.formatPlayerName(c, p.owner),
        hand: p.hand ?? 0,
        rank,
        discarded: p.discarded,
        discardSum: p.discardSum,
      })

      if (!c) continue
      updateScore(c, rank, totalPlayers)
    }

    this.addHistory(gameHistoryEntry)
  }

  protected processWelcomeMode (m: ByteReader): void {
    this.modeTurnTime.set(this.ROUND_TIME = m.getInt())
    this.modeDeck.set(clamp(m.getInt(), 1, MAX_DECKS))
  }

  protected processWelcomePlayer (m: ByteReader, p: DClient): void {
    p.score = m.getInt()
    p.streak = m.getInt()
    p.wins = m.getInt()
    p.losses = m.getInt()
    p.rankLast = m.getInt()
    p.rankBest = m.getInt()
    p.rankWorst = m.getInt()
  }

  protected playerResetStats (p: DClient): void {
    p.score = 0
    p.streak = 0
    p.wins = 0
    p.losses = 0
    p.rankLast = 0
    p.rankBest = 0
    p.rankWorst = 0
  }

  protected makePlayer (): DClient {
    return {
      ...RRTurnGame.DEFAULT_PLAYER,
      score: 0,
      streak: 0,
      wins: 0,
      losses: 0,
      rankLast: 0,
      rankBest: 0,
      rankWorst: 0,
    }
  }

  protected makePlayerInfo (): DPlayerInfo {
    return {
      ...RRTurnGame.DEFAULT_PLAYER_INFO,
      discarded: [],
      discardSum: 0,
      immune: false,
    }
  }

  protected makeDiscInfo (): DDiscInfo {
    return {
      ...RRTurnGame.DEFAULT_DISC_INFO,
      discarded: [],
      discardSum: 0,
    }
  }

  private updateDiscardCount (card: number): void {
    card-- // convert to 0-based index

    this.cardCountDiscard.update((c) => {
      c[card]++
      c[8]++
      return c
    })

    this.cardCountRemain.update((c) => {
      c[card]--
      c[8]--
      return c
    })
  }
}

function comparePlayerInfo (a: DPlayerInfo, b: DPlayerInfo): number {
  const aH = a.hand ?? 0
  const bH = b.hand ?? 0
  return (bH - aH) || (b.discardSum - a.discardSum)
}

function updateScore (c: DClient, rank: number, totalPlayers: number): void {
  c.rankLast = rank
  c.rankLast = rank
  c.rankBest = Math.min(c.rankBest || rank, rank)
  c.rankWorst = Math.max(c.rankWorst, rank)
  c.score += (totalPlayers - rank) + 1

  if (rank === 1) {
    if (c.streak < 0) c.streak = 0
    c.streak++
    c.wins++
  } else {
    if (c.streak > 0) c.streak = 0
    c.streak--
    c.losses++
  }
}

type CardCount = [number, number, number, number, number, number, number, number]
type CardCountTotal = [...CardCount, number]

const baseCardCount: CardCountTotal = [5, 2, 2, 2, 2, 1, 1, 1, 15]

function newZeroCardCount (): CardCountTotal {
  return [0, 0, 0, 0, 0, 0, 0, 0, 0]
}

function newTotalCardCount (decks: number): CardCountTotal {
  return baseCardCount.map((v) => v * decks) as typeof baseCardCount
}
