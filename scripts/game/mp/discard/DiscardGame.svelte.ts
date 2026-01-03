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
  END_ROUND,
  MOVE_CONFIRM,
  END_TURN,
  PLAYER_ELIMINATE,
  PLAYER_ELIMINATE_EARLY,
  PLAYER_PRIVATE_INFO_MY_HAND,
  PLAYER_PRIVATE_INFO_ALT_MOVE,
  PLAYER_PRIVATE_INFO_MOVE,
}

const enum C2S {
  RESET,
  RENAME,
  PONG,
  CHAT,
  ACTIVE,
  READY,
  MOVE_HAND0,
  MOVE_HAND1,
  MOVE_TARGET,
  MOVE_GUESS,
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

  updateScore (rank: number, totalPlayers: number): void {
    this.rankLast = rank
    this.rankLast = rank
    this.rankBest = Math.min(this.rankBest || rank, rank)
    this.rankWorst = Math.max(this.rankWorst, rank)
    this.score += (totalPlayers - rank) + 1

    if (rank === 1) {
      if (this.streak < 0) this.streak = 0
      this.streak++
      this.wins++
    } else {
      if (this.streak > 0) this.streak = 0
      this.streak--
      this.losses++
    }
  }

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
  | DiscardMoveInfoLeave

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

interface DiscardMoveInfoLeave {
  type: 'leave'
  playerName: string
  playerIsMe: boolean
  hand: number
  alt?: number
}

const CARDS_PER_DECK = 16
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
  sendActive (): void { this.sendf('i', C2S.ACTIVE) }
  sendReady (): void { this.sendf('i', C2S.READY) }
  sendMoveUseHand (uh: boolean): void { this.sendf('i', uh ? C2S.MOVE_HAND1 : C2S.MOVE_HAND0) }
  sendMoveTarget (target: number): void { this.sendf('i2', C2S.MOVE_TARGET, target) }
  sendMoveGuess (guess: number): void { this.sendf('i2', C2S.MOVE_GUESS, guess) }
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
    [S2C.END_ROUND]: this.processEndRound,
    [S2C.MOVE_CONFIRM]: this.processMoveConfirm,
    [S2C.END_TURN]: this.processEndTurn,
    [S2C.PLAYER_ELIMINATE]: this.processEliminate,
    [S2C.PLAYER_ELIMINATE_EARLY]: this.processEliminateEarly,
    [S2C.PLAYER_PRIVATE_INFO_MY_HAND]: this.processPrivateInfoMyHand,
    [S2C.PLAYER_PRIVATE_INFO_ALT_MOVE]: this.processPrivateInfoAltMove,
    [S2C.PLAYER_PRIVATE_INFO_MOVE]: this.processPrivateInfoMove,
  }

  protected processWelcomeMode (m: ByteReader): void {
    this.mode.optTurnTime = m.getInt()
    this.mode.optDecks = clamp(m.getInt(), 1, MAX_DECKS)
  }

  protected processPlayerInfo (m: ByteReader, p: DiscardPlayerInfo): void {
    const flags = m.getInt()
    const discardSize = Math.min(flags >> 1, CARDS_PER_DECK * MAX_DECKS)
    p.discarded = Array.from({ length: discardSize }, () => m.getInt())
    p.immune = !!(flags & 1)
    p.discardSum = sum(p.discarded)
  }

  protected processDiscInfo (m: ByteReader, p: DiscardDiscInfo): void {
    const discardSize = Math.min(m.getInt(), CARDS_PER_DECK * MAX_DECKS)
    p.discarded = Array.from({ length: discardSize }, () => m.getInt())
    p.discardSum = sum(p.discarded)
  }

  protected processRoundStartInfo (m: ByteReader): void {
    // infer deck size by dealing 1 card per player, then first player card
    // special case: CARD_COUNT players => 0 turns => start at -1 and increment in END_ROUND
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
    discardCount[8] = sum(discardCount)

    const totalCard = newTotalCardCount(this.mode.optDecks)
    this.cardCountDiscard = discardCount
    this.cardCountRemain = totalCard.map((v, i) => v - discardCount[i]) as CardCountTotal
    this.cardCountTotal = totalCard

    this.moveHistory = []
  }

  protected processMoveConfirm (m: ByteReader) {
    const flags = m.getInt()
    this.pendingMoveUseHand = !!(flags & 1)
    this.pendingMoveTarget = m.getInt()
    this.pendingMoveGuess = flags >> 1
  }

  protected processEndTurn (m: ByteReader): void {
    const p = this.playerInfo[this.turnIndex]!

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
        // guess (negative sign bit if guess is correct, can't be 0)
        moveHistoryEntry.info = m.getInt()
        break
      }
      case 2: // reveal separately
        break
      case 3: { // also compare separately
        if (target >= 0) {
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

    this.setTimer(this.mode.optTurnTime)
    this.nextTurn()

    // clear immune on next player
    this.playerInfo[this.turnIndex].immune = false
  }

  protected processEndRound (m: ByteReader): void {
    // cancel out pre-dealt card
    this.deckSize++

    const playerInfos = this.playerInfo

    for (const p of playerInfos) {
      p.hand = m.getInt()
    }

    const eliminated = this.playerDiscInfo.map((d) => ({ ...d, name: d.ownerName }))

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

      c.updateScore(rank, totalPlayers)
    }
    this.updatePlayers()

    this.addHistory(gameHistoryEntry)
  }

  protected eliminatePlayer (m: ByteReader, d: DiscardDiscInfo, pn: number, p: DiscardPlayerInfo, c: DiscardClient, early: boolean): boolean {
    let alt: number | undefined
    if (early) {
      const isMove = this.playerInfo[this.turnIndex] == p

      if (isMove) {
        alt = m.getInt()

        p.discarded.push(alt)
        p.discardSum += alt
        this.updateDiscardCount(alt)
        this.deckSize--
      }
    }

    const hand = m.getInt()
    d.discarded = [...p.discarded, hand]
    d.discardSum = p.discardSum + hand
    this.updateDiscardCount(hand)

    const rank = this.playerInfo.length
    const totalPlayers = rank + this.playerDiscInfo.length
    c.updateScore(rank, totalPlayers)
    this.updatePlayers()

    if (early) {
      this.moveHistory.push({
        type: 'leave',
        playerName: c.formatName(),
        playerIsMe: c === this.localClient,
        hand,
        alt,
      })

      this.setTimer(this.mode.optTurnTime)
    }

    // fix turnIndex
    if (this.turnIndex > pn) this.turnIndex--
    else if (this.turnIndex === this.playerInfo.length - 1) this.turnIndex = 0

    return false
  }

  private processPrivateInfoMyHand (m: ByteReader): void {
    this.myHand = m.getInt()
  }

  private processPrivateInfoAltMove (m: ByteReader): void {
    this.myAltMove = m.getInt()
  }

  private processPrivateInfoMove (m: ByteReader): void {
    const move = m.getInt()
    const pn = m.getInt()
    const hand = m.getInt()

    const player = this.playerInfo[pn]
    const playerName = this.formatPlayerName(player, pn)

    switch (move) {
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
  }

  protected override readonly playersSortProps = [
    (p: DiscardClient) => p.score,
    (p: DiscardClient) => p.wins,
    (p: DiscardClient) => p.streak,
    (p: DiscardClient) => -p.rankLast,
    (p: DiscardClient) => -p.rankBest,
    (p: DiscardClient) => -p.rankWorst,
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
  return ((b.hand ?? 0) - (a.hand ?? 0))
    || (b.discardSum - a.discardSum)
}

type CardCount = Repeat<number, 8>
type CardCountTotal = [...CardCount, number]

const baseCardCount: CardCountTotal = [5, 2, 2, 2, 2, 1, 1, 1, CARDS_PER_DECK]

function newZeroCardCount (): CardCountTotal {
  return [0, 0, 0, 0, 0, 0, 0, 0, 0]
}

function newTotalCardCount (decks: number): CardCountTotal {
  return baseCardCount.map((v) => v * decks) as typeof baseCardCount
}
