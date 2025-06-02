import { clamp, sum, type Repeat } from '@/util'
import { formatClientName } from '@gmc/game/common'
import { ByteReader } from '@gmc/game/ByteReader'
import { filterChat } from '@gmc/game/CommonGame.svelte'
import { RoundRobinClient, RoundRobinGame, RRTurnDiscInfo, RRTurnPlayerInfo } from '@gmc/game/RoundRobinGame.svelte'
import type { BaseGameRoom } from '@gmc/remote/BaseGameRoom'

import { defaultMode, type DiscardMode } from './gamemode'

const enum S2C {
  WELCOME,
  JOIN,
  LEAVE,
  RESET,
  RENAME,
  PING,
  PING_TIME,
  CHAT,
  ACTIVE,
  ROUND_WAIT,
  ROUND_INTERM,
  ROUND_START,
  READY,
  MOVE_CONFIRM,
  END_ROUND,
  END_TURN,
  PLAYER_ELIMINATE,
  PLAYER_PRIVATE_INFO,
}

const enum C2S {
  RESET,
  RENAME,
  PONG,
  CHAT,
  ACTIVE,
  READY,
  MOVE,
  MOVE_END,
}

class DiscardClient extends RoundRobinClient {
  score = $state(0)
  streak = $state(0)
  wins = $state(0)
  losses = $state(0)

  rankLast = $state(0)
  rankBest = $state(0)
  rankWorst = $state(0)

  resetScore () {
    this.score = 0
    this.streak = 0
    this.wins = 0
    this.losses = 0

    this.rankLast = 0
    this.rankBest = 0
    this.rankWorst = 0
  }

  override readWelcome (m: ByteReader): void {
    super.readWelcome(m)

    this.score = m.getInt()
    this.streak = m.getInt()
    this.wins = m.getInt()
    this.losses = m.getInt()
    this.rankLast = m.getInt()
    this.rankBest = m.getInt()
    this.rankWorst = m.getInt()
  }
}

export class DiscardPlayerInfo extends RRTurnPlayerInfo {
  discarded: number[] = $state([])
  discardSum = $state(0)
  immune = $state(false)
  hand?: number = $state()
}

export class DiscardDiscInfo extends RRTurnDiscInfo {
  discarded: number[] = []
  discardSum = 0
}

export interface DiscardGameHistory {
  survived: {
    name: string
    isMe?: boolean
    rank: number
    hand: number
    discarded: number[]
    discardSum: number
  }[]

  eliminated: {
    name: string
    isMe?: boolean
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

export class DiscardGame extends RoundRobinGame<DiscardClient, DiscardPlayerInfo, DiscardDiscInfo, DiscardGameHistory> {
  PlayerInfoType = DiscardPlayerInfo
  PlayerDiscType = DiscardDiscInfo

  mode: DiscardMode = $state(defaultMode())

  myHand = $state(0)
  myAltMove = $state(0)
  deckSize = $state(0)
  cardCountDiscard = $state(newZeroCardCount())
  cardCountRemain = $state(newZeroCardCount())
  cardCountTotal = $state(newZeroCardCount())
  moveHistory = $state([] as DiscardMoveInfo[])

  pendingMoveUseHand = $state(false)
  pendingMoveTarget = $state(0)
  pendingMoveGuess = $state(0)

  get ROUND_TIME () { return this.mode.optTurnTime }
  INTERMISSION_TIME = 30000

  override newClient () { return new DiscardClient }

  enterGame (room: BaseGameRoom, name: string): void {
    this.setupGame(room)
    this.sendf('is', this.PROTOCOL_VERSION, name)
  }

  sendReset (): void { this.sendf('i', C2S.RESET) }
  sendRename (newName: string): void { this.sendf('is', C2S.RENAME, newName) }
  sendPong (t: number): void { this.sendf('i2', C2S.PONG, t) }
  sendChat (s: string, flags: number, target = -1): void { this.sendf('i3s', C2S.CHAT, flags, target, filterChat(s)) }
  sendActive (active: boolean): void { this.sendf('ib', C2S.ACTIVE, active) }
  sendReady (ready: boolean): void { this.sendf('ib', C2S.READY, ready) }
  sendMove (useHand: boolean, target: number, guess: number): void { this.sendf('ibi2', C2S.MOVE, useHand, target, guess) }
  sendMoveUseHand (uh: boolean): void { this.sendMove(uh, this.pendingMoveTarget, this.pendingMoveGuess) }
  sendMoveTarget (target: number): void { this.sendMove(this.pendingMoveUseHand, target, this.pendingMoveGuess) }
  sendMoveGuess (guess: number): void { this.sendMove(this.pendingMoveUseHand, this.pendingMoveTarget, guess) }
  sendMoveEnd (): void { this.sendf('i', C2S.MOVE_END) }

  MESSAGE_HANDLERS: Record<number, (this: this, m: ByteReader) => void> = {
    [S2C.WELCOME]: this.processWelcome,
    [S2C.JOIN]: this.processJoin,
    [S2C.LEAVE]: this.processLeave,
    [S2C.RESET]: this.processReset,
    [S2C.RENAME]: this.processRename,
    [S2C.PING]: this.processPing,
    [S2C.PING_TIME]: this.processPingTime,
    [S2C.CHAT]: this.processChat,
    [S2C.ACTIVE]: this.processActive,
    [S2C.ROUND_WAIT]: this.processRoundWait,
    [S2C.ROUND_INTERM]: this.processRoundInterm,
    [S2C.ROUND_START]: this.processRoundStart,
    [S2C.READY]: this.processReady,
    [S2C.MOVE_CONFIRM]: this.processMoveConfirm,
    [S2C.END_ROUND]: this.processEndRound,
    [S2C.END_TURN]: this.processEndTurn,
    [S2C.PLAYER_ELIMINATE]: this.processEliminate,
    [S2C.PLAYER_PRIVATE_INFO]: this.processPrivateInfo,
  }

  protected processWelcomeMode (m: ByteReader): void {
    this.mode.optTurnTime = m.getInt()
    this.mode.optDecks = clamp(m.getInt(), 1, MAX_DECKS)
  }

  protected processPlayerInfo (m: ByteReader, p: DiscardPlayerInfo): void {
    const discardSize = Math.min(m.getInt(), CARDS_PER_DECK * MAX_DECKS)
    p.discarded = Array(discardSize).fill(undefined).map(() => m.getInt())
    p.immune = m.getBool()
    p.discardSum = sum(p.discarded)
  }

  protected processDiscInfo (m: ByteReader, p: DiscardDiscInfo): void {
    const discardSize = Math.min(m.getInt(), CARDS_PER_DECK * MAX_DECKS)
    p.discarded = Array(discardSize).fill(undefined).map(() => m.getInt())
    p.discardSum = sum(p.discarded)
  }

  protected processRoundStartInfo (m: ByteReader): void {
    // infer deck size by dealing 1 card per player, then first player card
    // special case: (15 * decks) players => 0 turns => start at -1 and increment in END_ROUND
    this.deckSize = this.mode.optDecks * CARDS_PER_DECK - this.playerInfo.length - 1
    this.cardCountDiscard = newZeroCardCount()
    this.cardCountRemain = newTotalCardCount(this.mode.optDecks)
    this.cardCountTotal = newTotalCardCount(this.mode.optDecks)

    this.moveHistory = []
  }

  protected processRoundInfo (m: ByteReader): void {
    this.deckSize = m.getInt()
    const discardCount: CardCountTotal = [
      m.getInt(), m.getInt(), m.getInt(), m.getInt(),
      m.getInt(), m.getInt(), m.getInt(), m.getInt(),
      0
    ]
    discardCount[8] = sum(discardCount.slice(0, 8))

    const totalCard = newTotalCardCount(this.mode.optDecks)
    this.cardCountDiscard = discardCount
    this.cardCountRemain = totalCard.map((v, i) => v - discardCount[i]) as CardCountTotal
    this.cardCountTotal = totalCard

    this.moveHistory = []
  }

  protected processMoveConfirm (m: ByteReader) {
    this.pendingMoveUseHand = m.getBool()
    this.pendingMoveTarget = m.getInt()
    this.pendingMoveGuess = m.getInt()
  }

  protected processEndTurn (m: ByteReader): void {
    const [p, nextPlayer] = this.playerInfo
    if (!p) return
    const move = m.getInt()
    const target = m.getInt()

    const c = this.clients[p.owner]
    const targetInfo = this.playerInfo[target]

    const playerIsMe = c === this.localClient

    const moveHistoryEntry: DiscardMoveInfoMove = {
      type: 'move',
      playerName: formatClientName(c, p.owner),
      playerIsMe,
      move,
      targetName: targetInfo ? formatClientName(this.clients[targetInfo.owner], targetInfo.owner) : 'nobody',
      targetIsMe: this.playerIsMe(targetInfo),
      targetIsPlayer: targetInfo === p,
      targetValid: !!targetInfo,
      info: 0,
    }

    if (playerIsMe && move === this.myHand) {
      this.myHand = this.myAltMove
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
          // other players' known hands become unknown
          // when they are forced to draw
          p.hand = undefined

          p.discarded.push(discarded)
          p.discardSum += discarded
          this.updateDiscardCount(discarded)
          this.deckSize--
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

    // pre-deal out next card
    this.deckSize--
    this.moveHistory.push(moveHistoryEntry)

    if (nextPlayer) {
      nextPlayer.immune = false
    }

    this.setTimer(this.mode.optTurnTime)
    this.nextTurn()
  }

  protected processEndRound (m: ByteReader): void {
    // cancel out pre-dealt card
    this.deckSize++

    const playerInfos = this.playerInfo

    for (const p of playerInfos) {
      p.hand = m.getInt()
    }

    const eliminated = this.playerDiscInfo.map((d) => ({ ...d, name: d.ownerName, isMe: d.isMe }))
    eliminated.reverse()

    const gameHistoryEntry: DiscardGameHistory = {
      survived: [],
      eliminated,
    }

    const totalPlayers = playerInfos.length + this.playerDiscInfo.length

    const sortedPlayers = [...playerInfos].sort(comparePlayerInfo)
    let rank = 1
    for (let i = 0; i < sortedPlayers.length; i++) {
      const p = sortedPlayers[i]
      if (i && comparePlayerInfo(p, sortedPlayers[i - 1])) {
        rank = i + 1
      }

      const c = this.clients[p.owner]

      gameHistoryEntry.survived.push({
        name: formatClientName(c, p.owner),
        isMe: c === this.localClient,
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

  protected eliminatePlayer (m: ByteReader, d: DiscardDiscInfo, p: DiscardPlayerInfo, c: DiscardClient): void {
    const hand = m.getInt()
    d.discarded = [...p.discarded, hand]
    d.discardSum = p.discardSum + hand
    this.updateDiscardCount(hand)

    if (c) {
      const rank = this.playerInfo.length
      const totalPlayers = rank + this.playerDiscInfo.length
      updateScore(c, rank, totalPlayers)
    }
  }

  private processPrivateInfo (m: ByteReader): void {
    const x = m.getInt()
    switch (x) {
      case -1:
        this.myHand = m.getInt()
        break
      case 0:
        this.myAltMove = m.getInt()
        break
      case 2:
      case 3:
      case 6: {
        const pn = m.getInt()
        const hand = m.getInt()

        const player = this.playerInfo[pn]
        const playerName = this.formatPlayerName(player, pn)

        switch (x) {
          case 2:
            if (player) {
              player.hand = hand
            }
            this.moveHistory.push({ type: 'reveal', playerName, hand })
            break
          case 3: {
            const ours = this.myHand
            if (player) {
              player.hand = hand
            }
            this.moveHistory.push({ type: 'cmp', ours, theirs: hand, playerName })
            break
          }
          case 6: {
            const oldHand = this.myHand
            this.moveHistory.push({ type: 'trade', oldHand, newHand: hand, playerName })
            if (player) {
              player.hand = oldHand
            }
            this.myHand = hand
            break
          }
        }
        break
      }
    }
  }

  protected override readonly playersSortProps = [
    (p: DiscardClient) => p.score,
    (p: DiscardClient) => p.wins,
    (p: DiscardClient) => p.streak,
  ]

  private updateDiscardCount (card: number): void {
    card-- // convert to 0-based index

    this.cardCountDiscard[card]++
    this.cardCountDiscard[8]++

    this.cardCountRemain[card]--
    this.cardCountRemain[8]--
  }
}

function comparePlayerInfo (a: DiscardPlayerInfo, b: DiscardPlayerInfo): number {
  const aH = a.hand ?? 0
  const bH = b.hand ?? 0
  return (bH - aH) || (b.discardSum - a.discardSum)
}

function updateScore (c: DiscardClient, rank: number, totalPlayers: number): void {
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

type CardCount = Repeat<number, 8>
type CardCountTotal = [...CardCount, number]

const baseCardCount: CardCountTotal = [5, 2, 2, 2, 2, 1, 1, 1, 15]

function newZeroCardCount (): CardCountTotal {
  return [0, 0, 0, 0, 0, 0, 0, 0, 0]
}

function newTotalCardCount (decks: number): CardCountTotal {
  return baseCardCount.map((v) => v * decks) as typeof baseCardCount
}
