import { clamp, sum, type Repeat } from '@/util'
import { ByteReader } from '@gmc/game/ByteReader'
import { filterChat } from '@gmc/game/CommonGame.svelte'
import { GameState } from '@gmc/game/TurnBasedGame.svelte'
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
  wins = $state(0)
  loss = $state(0)
  ties = $state(0)
  total = $derived(this.wins + this.loss + this.ties)

  resetScore () {
    this.balance = 0n
    this.wins = 0
    this.loss = 0
    this.ties = 0
  }

  override readWelcome (m: ByteReader): void {
    super.readWelcome(m)

    this.balance = m.getInt64()
    this.wins = m.getInt()
    this.loss = m.getInt()
    this.ties = m.getInt()
  }
}

class Hand {
  cards: number[] = []
  value = 0
  valueHard = 0
  #hasAce = false
  isSoft = false

  addCard (card: CardValue, front?: boolean): void {
    this.cards[front ? 'unshift' : 'push'](card)

    if (card === CardValue.Ace) {
      this.#hasAce = true
    }

    this.valueHard += card + 1
    this.value = this.valueHard + ((this.isSoft = this.#hasAce && this.valueHard <= 11) ? 10 : 0)
  }

  split (card0: CardValue, card1: CardValue): Hand {
    const newHand = new Hand()
    newHand.addCard(this.cards[1])
    newHand.addCard(card1)

    this.valueHard = this.cards[0] + (this.cards[1] = card0)
    this.#hasAce = this.cards[0] === CardValue.Ace || this.cards[1] === CardValue.Ace
    this.value = this.valueHard + ((this.isSoft = this.#hasAce && this.valueHard <= 11) ? 10 : 0)

    return newHand
  }

  isNaturalBlackjack (isSplit: boolean): boolean {
    return this.cards.length === 2 && this.value === 21 && !(isSplit && this.cards[0] === CardValue.Ace)
  }
}

type HandBet = [hand: Hand, bet: number]
type HandBetOutcome = [...HandBet, outcome: BlackjackOutcome]

export class BlackjackPlayerInfo extends RRTurnPlayerInfo {
  hands: HandBet[] = $state([])
  handIndex = $state(0)

  insurance = $state(0)
}

export class BlackjackDiscInfo extends RRTurnDiscInfo {
  hands: HandBet[] = []

  insurance = 0
  scoreChange = 0
}

export interface BlackjackGameHistory {
  duration: bigint
  dealerHand: Hand
  players: BlackjackGameHistoryPlayer[]
}

export interface BlackjackGameHistoryPlayer {
  name: string
  isMe?: boolean

  hands: HandBetOutcome[]
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

const enum BlackjackModeDealer {
  NO_HOLE,
  HOLE_NO_PEEK,
  HOLE1,
  HOLE2,
  NUM,
}

const enum BlackjackModeDouble {
  ANY,
  ON_9_10_11,
  ON_10_11,
  NUM,
}

const enum BlackjackModeSurrender {
  OFF,
  NOT_ACE,
  ANY,
  NUM,
}

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
  dealerHand = $state(new Hand())
  // holeCard = $state(0)
  cardCountHole = $state(newZeroCardCount())
  cardCountShoeHasHole = $state(false)
  cardCountShoe = $state(newZeroCardCount())
  cardCountTotal = $derived(newTotalCardCount(this.mode.optDecks))
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
    this.mode.optDealer =  (modeFlags0 >> 4) & 3 // Math.min((modeFlags0 >> 4) & 3, BlackjackModeDealer.NUM - 1) // 2 bits exactly
    // moved to modeFlags0 because they don't fit in modeFlags1
    this.mode.optInsurePartial = !!(modeFlags0 & (1 << 6))
    this.mode.optInsureLate = !!(modeFlags0 & (1 << 7))

    if (this.mode.opt21) {
      this.mode.optSplitNonAce = m.get()
      this.mode.optSplitAce = m.get()
      const modeFlags1 = m.get()
      this.mode.optDouble = Math.min(modeFlags1 & 3, BlackjackModeDouble.NUM - 1)
      this.mode.optSurrender = Math.min((modeFlags0 >> 2) & 3, BlackjackModeSurrender.NUM - 1)

      this.mode.optSplitDouble = !!(modeFlags1 & (1 << 4))
      this.mode.optSplitSurrender = !!(modeFlags1 & (1 << 5))
      this.mode.optSurrenderPlay = !!(modeFlags1 & (1 << 6))
      this.mode.optHitSplitAce = !!(modeFlags1 & (1 << 7))
    } else {
      this.mode.optInsureLate = false
    }
  }

  protected processPlayerInfo (m: ByteReader, p: BlackjackPlayerInfo): void {
    p.hands = readHandBets(m)
    p.handIndex = m.getInt()
    p.insurance = m.getInt()
  }

  protected processDiscInfo (m: ByteReader, p: BlackjackDiscInfo): void {
    p.hands = readHandBets(m)
  }

  protected processRoundStartInfo (): void {
    this.gamePhase = GamePhase.BET
    this.dealerHand = new Hand()
    this.cardCountShoeHasHole = false
    this.cardCountHole = this.cardCountShoe.slice() as CardCountTotal

    this.playerInfo.forEach((p) => {
      p.hands = []
      // p.handIndex = 0
      p.insurance = 0
    })
  }

  protected processRoundInfo (m: ByteReader): void {
    if (this.roundState !== GameState.ACTIVE) {
      this.cardCountShoe = newZeroCardCount()
      return this.processRoundStartInfo()
    }

    this.cardCountShoe = readCardCount(m)

    const flags = m.get()
    this.gamePhase = flags & 3

    if (this.gamePhase === GamePhase.BET) {
      return this.processRoundStartInfo()
    }

    const dealerFlags = m.get()
    this.dealerHand = new Hand()
    this.dealerHand.addCard(dealerFlags & 0xf)
    this.cardCountShoeHasHole = !!(dealerFlags & (1 << 4))
    this.cardCountHole = readCardCount(m)
  }

  protected processEndTurn (m: ByteReader): void {
    const turnIndex = this.mode.optSpeed ? m.getInt() : this.turnIndex
    const move = clamp(m.get(), 0, BlackjackMove.NUM - 1)

    const p = this.playerInfo[turnIndex]

    const handBet = p.hands[p.handIndex]
    const [hand, bet] = handBet
    const cost = bet * (this.mode.optInverted ? 1 : -1)
    const costB = BigInt(cost)
    let handFinished: boolean | undefined
    switch (move) {
      case BlackjackMove.DOUBLE:
        this.clients[p.owner].balance += costB
        handBet[1] *= 2

        handFinished = true
        // fallthrough
      case BlackjackMove.HIT:
        const card = m.get()

        this.consumeCard(card)

        hand.addCard(card)
        handFinished ||= hand.value >= 21
        break
      case BlackjackMove.SPLIT:
        const card0 = m.get()
        const card1 = m.get()

        this.consumeCard(card0)
        this.consumeCard(card1)

        this.clients[p.owner].balance += costB

        const handNew = hand.split(card0, card1)

        p.hands.splice(p.handIndex + 1, 0, [handNew, bet])

        handFinished = hand.value >= 21
        break
      case BlackjackMove.SURRENDER:
        const c = this.clients[p.owner]

        c.balance += costB >> 1n
        c.loss++

        handBet[1] *= -1
        // fallthrough
      case BlackjackMove.STAND:
        handFinished = true
    }

    this.setTimer(this.mode.optTurnTime)
    if (handFinished) {
      do {
        p.handIndex++
      } while (p.handIndex < p.hands.length && p.hands[p.handIndex][0].value >= 21)

      if (!this.mode.optSpeed && p.handIndex === p.hands.length) {
        this.nextTurn()
      }
    }
  }

  protected processEndRound (m: ByteReader): void {
    if (this.gamePhase === GamePhase.BET) {
      // bet amounts
      for (const p of this.playerInfo) {
        const bet = m.getInt()
        const cards = m.get()
        const hand = new Hand()
        hand.addCard(cards & 0xf)
        hand.addCard((cards >> 4) & 0xf)
        p.hands = [[hand, bet]]
        p.handIndex = 0
      }
      const dealerFaceUp = m.get()
      this.dealerHand.addCard(dealerFaceUp)

      // deal cards: players, hole card, players, face-up card
      this.cardCountShoeHasHole = false
      for (const p of this.playerInfo) {
        this.consumeCard(p.hands[0][0].cards[0])
      }
      if (this.mode.optDealer > BlackjackModeDealer.NO_HOLE) {
        this.cardCountShoeHasHole = true
        this.checkHoleCard()
        for (const p of this.playerInfo) {
          this.consumeCard(p.hands[0][0].cards[1])
        }
      }
      this.consumeCard(dealerFaceUp)

      this.gamePhase = !this.mode.opt21 && (dealerFaceUp === CardValue.Ace || this.mode.optSurrender) ? GamePhase.PRE : GamePhase.PLAY
      return
    } else if (this.gamePhase === GamePhase.PRE) {
      // insurance amounts
      for (const p of this.playerInfo) {
        const insurance = m.getInt()
        p.insurance = insurance
      }

      // TODO! surrender

      this.gamePhase = GamePhase.PLAY
      return
    } else if (this.gamePhase === GamePhase.POST) {
      // insurance amounts
      // TODO!
    } else { // this.gamePhase === GamePhase.PLAY
      if (this.mode.optInsureLate && this.dealerHand.cards.at(-1) === CardValue.Ace) {
        this.gamePhase = GamePhase.POST
        return
      }
    }

    // end phase: read dealer cards
    const duration = m.getUint64()

    if (this.mode.optDealer > BlackjackModeDealer.NO_HOLE) {
      const dealerHole = m.get()
      this.dealerHand.addCard(dealerHole, true)
    }

    while (this.dealerShouldHit()) {
      this.dealerHand.addCard(m.get())
    }

    const history: BlackjackGameHistory = {
      duration,
      dealerHand: this.dealerHand,
      players: [],
    }

    const dealerBJ = this.dealerHand.value === 21 && this.dealerHand.cards.length < 3

    for (const p of this.playerInfo) {
      const c = this.clients[p.owner]

      history.players.push({
        name: c.formatName(),
        isMe: c === this.localClient,

        hands: p.hands.map(([hand, bet]) => {
          return [hand, bet,
            hand.value > 21 ? BlackjackOutcome.BUST :
              hand.isNaturalBlackjack(p.hands.length > 1) ?
                dealerBJ ? BlackjackOutcome.PUSH : BlackjackOutcome.BLACKJACK_NATURAL
                : (this.dealerHand.value === 21 || hand.value > this.dealerHand.value) ? BlackjackOutcome.WIN : BlackjackOutcome.LOSE]
        }),
        insurance: p.insurance,
        insuranceOutcome: 0,

        score: 0,
        scoreChange: 0,
      })
    }

    for (const d of this.playerDiscInfo) {
      history.players.push({
        name: d.ownerName,
        isMe: d.isMe,

        hands: d.hands.map(([hand, bet]) => {
          return [hand, bet, hand.value > 21 ? BlackjackOutcome.BUST : hand.isNaturalBlackjack(d.hands.length > 1) ? BlackjackOutcome.PUSH : BlackjackOutcome.LOSE]
        }),
        insurance: d.insurance,
        insuranceOutcome: 0,

        score: 0,
        scoreChange: d.scoreChange,
      })
    }

    this.addHistory(history)
  }

  protected eliminatePlayer (_m: ByteReader, d: BlackjackDiscInfo, pn: number, p: BlackjackPlayerInfo, c: BlackjackClient): boolean {
    d.insurance = p.insurance
    const hands = (d.hands = p.hands)
    const handsLost = hands.filter(([hand, bet]) => bet > 0 && !hand.isNaturalBlackjack(hands.length > 1))
    c.loss += handsLost.length
    d.scoreChange = -sum(handsLost.map(([_, bet]) => bet))

    if (!this.mode.optSpeed && this.gamePhase !== GamePhase.BET && pn === this.turnIndex) {
      this.setTimer(this.mode.optTurnTime)
    }

    const lastIndex = this.playerInfo.length - 1
    // fix turnIndex
    if (this.turnIndex > pn) this.turnIndex--
    else if (this.turnIndex === lastIndex) this.turnIndex = 0

    return true
  }

  protected override readonly playersSortProps = [
    (p: BlackjackClient) => p.balance,
    (p: BlackjackClient) => p.wins - p.loss,
    (p: BlackjackClient) => p.wins,
    (p: BlackjackClient) => p.ties,
  ]

  private consumeCard (card: CardValue): void {
    if (!this.mode.optDecks) return

    if (this.cardCountShoeHasHole && this.cardCountHole[card]) {
      this.cardCountHole[card]--
      this.cardCountHole[CardValue.NUM]--
    }

    this.cardCountShoe[card]--
    this.cardCountShoe[CardValue.NUM]--
    this.checkHoleCard()
    this.checkRefillShoe()
  }

  private checkHoleCard (): void {
    if (!this.cardCountShoeHasHole) return

    const cardCountHoleTotal = this.cardCountHole[CardValue.NUM]
    const holeCard = this.cardCountHole.findIndex((v) => v === cardCountHoleTotal)
    if (holeCard < CardValue.NUM) {
      this.cardCountShoeHasHole = false

      this.cardCountHole[holeCard] = this.cardCountHole[CardValue.NUM] = 1

      this.cardCountShoe[holeCard]--
      this.cardCountShoe[CardValue.NUM]--
      this.checkRefillShoe()
    }
  }

  private checkRefillShoe (): void {
    if (!this.cardCountShoe[CardValue.NUM]) {
      this.cardCountShoe = newTotalCardCount(this.mode.optDecks)
    }
  }

  private dealerShouldHit (): boolean {
    const { value, isSoft } = this.dealerHand
    return value < 17 || this.mode.optDealerHitSoft && value === 17 && isSoft
  }
}

export const enum GamePhase {
  BET,
  PRE,
  PLAY,
  POST,
}

const enum CardValue {
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

function readHand (m: ByteReader): Hand {
  // TODO improve encoding scheme for hands
  const length = m.get()
  const hand = new Hand()
  for (let i = 0; i < length; i++) {
    hand.addCard(Math.min(m.get(), CardValue.NUM - 1))
  }
  return hand
}

function readHandBet (m: ByteReader): HandBet {
  return [readHand(m), m.getInt()]
}

function readHandBets (m: ByteReader): HandBet[] {
  const MAX_HANDS = 512

  const length = Math.min(m.getInt(), MAX_HANDS)
  return Array.from({ length }).map(() => readHandBet(m))
}

type CardCount = Repeat<number, CardValue.NUM>

export type CardCountTotal = [...CardCount, number]

function newZeroCardCount (): CardCountTotal {
  return [
    0, 0, 0, 0, 0,
    0, 0, 0, 0, 0,
    0,
  ]
}

function newTotalCardCount (decks: number): CardCountTotal {
  const normal = 4 * decks || 1
  return [
    normal, normal, normal, normal, normal,
    normal, normal, normal, normal, 4 * normal,
    13 * normal
  ]
}

function readCardCount (m: ByteReader): CardCountTotal {
  const v = Array.from({ length: CardValue.NUM }, () => m.get())
  v.push(sum(v))
  return v as CardCountTotal
}
