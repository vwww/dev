import { clamp, sum, type Repeat } from '@/util'
import { ByteReader } from '@gmc/game/ByteReader'
import { filterChat } from '@gmc/game/CommonGame.svelte'
import { RoundRobinClient, RoundRobinGame, RRTurnDiscInfo, RRTurnPlayerInfo } from '@gmc/game/RoundRobinGame.svelte'
import type { BaseGameRoom } from '@gmc/remote/BaseGameRoom'

import { defaultMode, type BlackjackMode } from './gamemode'

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
  END_TURN,
  PLAYER_ELIMINATE,
}

const enum C2S {
  RESET,
  RENAME,
  PONG,
  CHAT,
  ACTIVE,
  READY,
  MOVE_AMOUNT,
  MOVE,
}

class BlackjackClient extends RoundRobinClient {
  balance = $state(0n)
  streak = $state(0)
  wins = $state(0)
  loss = $state(0)
  ties = $state(0)
  total = $derived(this.wins + this.loss + this.ties)

  resetScore () {
    this.balance = 0n
    this.streak = 0
    this.wins = 0
    this.loss = 0
    this.ties = 0
  }

  override readWelcome (m: ByteReader): void {
    super.readWelcome(m)

    this.balance = m.getInt64()
    this.streak = m.getInt()
    this.wins = m.getInt()
    this.loss = m.getInt()
    this.ties = m.getInt()
  }
}

export type Hand = [bet: number, cards: number[], value: number]

export class BlackjackPlayerInfo extends RRTurnPlayerInfo {
  hands: Hand[] = $state([])
  handIndex = $state(0)
}

export class BlackjackDiscInfo extends RRTurnDiscInfo {
  hands: Hand[] = []
}

export interface BlackjackGameHistory {
  duration: number
  dealerHand: number[]
  dealerHandVal: number
  players: BlackjackGameHistoryPlayer[]
}

export interface BlackjackGameHistoryPlayer {
  name: string
  isMe?: boolean

  hands: [...Hand, outcome: BlackjackOutcome][]
  insurance: number
  insuranceOutcome: number

  score: number
  scoreChange: number
}

const enum BlackjackOutcome {
  PENDING,
  BUST,
  BLACKJACK_NATURAL,
  WIN,
  PUSH,
  LOSE,
}

const enum BlackjackModeDouble {
  ANY,
  ON_9_10_11,
  ON_10_11,
  NUM,
}

/*
const enum BlackjackModeSurrender {
  OFF,
  LATE,
  EARLY_NOT_ACE,
  EARLY,
  NUM,
}
*/

const enum BlackjackMove {
  HIT,
  STAND,
  DOUBLE,
  SPLIT,
  SURRENDER,
  NUM,
}

// const MAX_DECKS = 255

export class BlackjackGame extends RoundRobinGame<BlackjackClient, BlackjackPlayerInfo, BlackjackDiscInfo, BlackjackGameHistory> {
  PlayerInfoType = BlackjackPlayerInfo
  PlayerDiscType = BlackjackDiscInfo

  // override canMove = $derived(this.playing && /*TODO*/)

  mode: BlackjackMode = $state(defaultMode())

  gamePhase = $state(GamePhase.BET)
  dealerCards: number[] = $state([])
  dealerValue = 0
  cardCountShoe = $state(newZeroCardCount())
  cardCountTotal = $derived(newTotalCardCount(this.mode.optDecks || 1))
  cardCountPlayed = $derived(this.cardCountTotal.map((v, i) => v - this.cardCountShoe[i]) as CardCountTotal)

  get ROUND_TIME () { return this.mode.optTurnTime }
  INTERMISSION_TIME = 30000

  override newClient () { return new BlackjackClient }

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
  sendMoveAmount (amount: number): void { this.sendf('i2', C2S.MOVE_AMOUNT, amount) }
  sendMove (move: BlackjackMove): void { this.sendf('i2', C2S.MOVE, move) }

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
    [S2C.END_TURN]: this.processEndTurn,
    [S2C.PLAYER_ELIMINATE]: this.processEliminate,
  }

  protected processWelcomeMode (m: ByteReader): void {
    this.mode.optTurnTime = m.getInt()
    this.mode.optDecks = m.get() // clamp(m.get(), 0, MAX_DECKS) // 1 byte exactly
    const modeFlags0 = m.get()
    this.mode.optSpeed = !!(modeFlags0 & (1 << 0))
    this.mode.optInverted = !!(modeFlags0 & (1 << 1))
    this.mode.opt21 = !!(modeFlags0 & (1 << 2))
    this.mode.optDealerHitSoft = !!(modeFlags0 & (1 << 3))
    this.mode.optDealerPeek = !!(modeFlags0 & (1 << 4))
    this.mode.optInsureLate = !!(modeFlags0 & (1 << 5)) // moved to modeFlags0 because it doesn't fit in modeFlags1

    if (this.mode.opt21) {
      this.mode.optSplitNonAce = m.get()
      this.mode.optSplitAce = m.get()
      const modeFlags1 = m.get()
      this.mode.optDouble = Math.min(modeFlags1 & 3, BlackjackModeDouble.NUM - 1)
      this.mode.optSurrender = (modeFlags1 >> 2) & 3 // Math.min((modeFlags0 >> 2) & 3, BlackjackModeSurrender.NUM - 1) // 2 bits exactly
      
      this.mode.optSplitDouble = !!(modeFlags1 & (1 << 4))
      this.mode.optSplitSurrender = !!(modeFlags1 & (1 << 5))
      this.mode.optHitSplitAce = !!(modeFlags1 & (1 << 6))
      this.mode.optInsurePartial = !!(modeFlags1 & (1 << 7))
    }
  }

  protected processPlayerInfo (m: ByteReader, p: BlackjackPlayerInfo): void {
    p.hands = readHands(m)
    p.handIndex = m.getInt()
  }

  protected processDiscInfo (m: ByteReader, p: BlackjackDiscInfo): void {
    p.hands = readHands(m)
  }

  protected processRoundStartInfo (): void {
    this.gamePhase = GamePhase.BET
    this.dealerCards = []
    this.dealerValue = 0
  }

  protected processRoundInfo (m: ByteReader): void {
    this.cardCountShoe = readCardCount(m)

    const flags = m.get()
    this.gamePhase = flags & 3

    if (this.gamePhase == GamePhase.BET) {
      return this.processRoundStartInfo()
    }

    this.dealerCards = readHand(m)
    // TODO
  }

  protected processEndTurn (m: ByteReader): void {
    const turnIndex = this.mode.optSpeed ? m.getInt() : this.turnIndex
    const move = clamp(m.get(), 0, BlackjackMove.NUM - 1)

    const p = this.playerInfo[turnIndex]

    switch (move) {
      case BlackjackMove.DOUBLE: {
        const hand = p.hands[p.handIndex]
        this.clients[p.owner].balance -= BigInt(hand[0])
        hand[0] *= 2
        // fallthrough
      }
      case BlackjackMove.HIT: {
        const card = m.get()
        const hand = p.hands[p.handIndex]
        hand[1].push(card)
        hand[2] = getHandVal(hand[1])
        if (move !== BlackjackMove.DOUBLE && hand[2] < 21) break
        // fallthrough
      }
      case BlackjackMove.STAND:
        p.handIndex++
        break
      case BlackjackMove.SPLIT: {
        const card1 = m.get()
        const card2 = m.get()

        const hand = p.hands[p.handIndex]
        const newCards = [hand[1][1], card2]
        const newHand: Hand = [hand[0], newCards, getHandVal(newCards)]

        this.clients[p.owner].balance -= BigInt(hand[0])
        hand[1][1] = card1
        hand[2] = getHandVal(hand[1])

        p.hands.splice(p.handIndex + 1, 0, newHand)
        break
      }
      case BlackjackMove.SURRENDER: {
        const hand = p.hands[p.handIndex]
        this.clients[p.owner].balance -= BigInt(hand[0])
        hand[0] *= -1
        p.handIndex++
        break
      }
    }

    this.setTimer(this.mode.optTurnTime)
    if (!this.mode.optSpeed) {
      this.nextTurn()
    }
  }

  protected processEndRound (m: ByteReader): void {
    if (this.gamePhase === GamePhase.BET) {
      // TODO bet amounts

      // TODO deal cards: players, hole card, players, face-up card

      this.gamePhase = false ? GamePhase.INSURANCE : GamePhase.PLAY
    } else if (this.gamePhase === GamePhase.INSURANCE) {
      if (!this.mode.optInsureLate) {
        this.gamePhase = GamePhase.PLAY
      }
    } else { // this.gamePhase === GamePhase.PLAY
      if (this.mode.optInsureLate) {
        this.gamePhase = GamePhase.INSURANCE
      }
    }
  }

  protected eliminatePlayer (m: ByteReader, d: BlackjackDiscInfo, pn: number, p: BlackjackPlayerInfo): boolean {
    // TODO
    return true
  }

  protected override readonly playersSortProps = [
    (p: BlackjackClient) => p.balance,
    (p: BlackjackClient) => p.wins,
    (p: BlackjackClient) => p.streak,
  ]
}

export const enum GamePhase {
  BET,
  INSURANCE,
  PLAY,
  // END,
}

const enum CardValues {
  Ace,
  N2,
  N3,
  N4,
  N5,
  N6,
  N7,
  N8,
  N9,
  Ten,
  NUM,
}

function getHandVal (hand: number[]): number {
  let total = 0
  let hasAce = false
  for (const card of hand) {
    total += card + 1
    if (card === CardValues.Ace) {
      hasAce = true
    }
  }

  if (hasAce && total <= 11) total += 10
  return total
}

function readHand (m: ByteReader): number[] {
  // TODO improve encoding scheme for hands
  const length = m.get()
  return Array.from({ length }).map(() => Math.min(m.get(), CardValues.NUM - 1))
}

function readHands (m: ByteReader): Hand[] {
  const MAX_HANDS = 512

  const length = Math.min(m.getInt(), MAX_HANDS)
  return Array.from({ length }).map(() => {
    const hand = readHand(m)
    return [m.getInt(), hand, getHandVal(hand)]
  })
}

type CardCount = Repeat<number, CardValues.NUM>

export type CardCountTotal = [...CardCount, number]

function newZeroCardCount (): CardCountTotal {
  return [
    0, 0, 0, 0, 0,
    0, 0, 0, 0, 0,
    0,
  ]
}

function newTotalCardCount (decks: number): CardCountTotal {
  const normal = 4 * decks
  return [
    normal, normal, normal, normal, normal,
    normal, normal, normal, normal, 4 * normal,
    52 * decks
  ]
}

function readCardCount (m: ByteReader): CardCountTotal {
  const v = Array.from({ length: CardValues.NUM }, () => m.get())
  v.push(sum(v))
  return v as CardCountTotal
}
