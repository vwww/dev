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
  END_TURN_AMOUNT,
  END_TURN_READY,
  PLAYER_ELIMINATE,
}

const enum C2S {
  RESET,
  RENAME,
  PONG,
  CHAT,
  ACTIVE,
  READY,
  MOVE_BET,
  MOVE_INSURANCE,
  MOVE,
  MOVE_READY,
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

  addWin () {
    if (this.streak < 0) this.streak = 0
    this.streak++
    this.wins++
  }

  addLoss () {
    if (this.streak > 0) this.streak = 0
    this.streak--
    this.loss++
  }

  addTie () {
    this.ties++
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

export class Hand {
  cards: number[] = $state([])
  value = $state(0)
  valueHard = $state(0)
  #hasAce = false
  isSoft = $state(false)

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

    this.valueHard = this.cards[0] + (this.cards[1] = card0) + 2
    this.#hasAce = this.cards[0] === CardValue.Ace || this.cards[1] === CardValue.Ace
    this.value = this.valueHard + ((this.isSoft = this.#hasAce && this.valueHard <= 11) ? 10 : 0)

    return newHand
  }

  isNaturalBlackjack (isSplit: boolean): boolean {
    return this.cards.length === 2 && this.value === 21 && !(isSplit && this.cards[0] === CardValue.Ace)
  }
}

type HandBet = [hand: Hand, bet: bigint]
type HandBetOutcome = [...HandBet, outcome: BlackjackOutcome]

export class BlackjackPlayerInfo extends RRTurnPlayerInfo {
  hands: HandBet[] = $state([])
  handIndex = $state(0)

  bet = $state(0n)
  insurance = $state(0n)
  ready = $state(false)
}

export class BlackjackDiscInfo extends RRTurnDiscInfo {
  hands: HandBet[] = []

  insurance = 0n
  score = 0n
  scoreChange = 0n
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
  insurance: bigint
  insuranceOutcome: bigint

  score: bigint
  scoreChange: bigint
}

export const enum BlackjackOutcome {
  // PENDING,
  SURRENDERED,
  BUST,
  BLACKJACK_NATURAL,
  WIN,
  PUSH,
  LOSE,
}

const enum BlackjackModeDealer {
  NO_HOLE,
  HOLE_NO_PEEK,
  HOLE0,
  HOLE1,
  NUM,
}

export const enum BlackjackModeDouble {
  ANY,
  ON_9_10_11,
  ON_10_11,
  NUM,
}

export const enum BlackjackModeSurrender {
  OFF,
  NOT_ACE,
  ANY,
  NUM,
}

export const enum BlackjackMove {
  HIT,
  STAND,
  DOUBLE,
  SPLIT,
  SURRENDER,
  NUM,
}

// const MAX_DECKS = 255
export const MAX_BALANCE = 9_000_000_000_000_000n
const MIN_BALANCE = -MAX_BALANCE

export class BlackjackGame extends RoundRobinGame<BlackjackClient, BlackjackPlayerInfo, BlackjackDiscInfo, BlackjackGameHistory> {
  PlayerInfoType = BlackjackPlayerInfo
  PlayerDiscType = BlackjackDiscInfo

  mode: BlackjackMode = $state(defaultMode())

  gamePhase = $state(GamePhase.BET)
  dealerHand = $state(new Hand())
  // holeCard = $state(0)
  cardCountHole = $state(newZeroCardCount())
  cardCountShoeHasHole = $state(false)
  cardCountShoe = $state(newZeroCardCount())
  cardCountTotal = $derived(newTotalCardCount(this.mode.optDecks))
  cardCountPlayed = $derived(this.cardCountTotal.map((v, i) => v - this.cardCountShoe[i]) as CardCountTotal)

  pendingAmount = $state(0)
  localPlayer: BlackjackPlayerInfo | undefined = $state()

  result: BlackjackGameHistory | undefined = $state()

  override canMove = $derived(this.playing && (this.gamePhase !== GamePhase.PLAY || this.mode.optSpeed || this.playerIsMe(this.playerInfo[this.turnIndex])))

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
  sendMoveBet (amount = BigInt(this.pendingAmount)): void { this.sendf('iU', C2S.MOVE_BET, amount) }
  sendMoveInsurance (amount = BigInt(this.pendingAmount)): void { this.sendf('iU', C2S.MOVE_INSURANCE, amount) }
  sendMoveSurrender (): void { this.sendMove(BlackjackMove.SURRENDER) }
  sendMove (move: BlackjackMove): void { this.sendf('i2', C2S.MOVE, move) }
  sendMoveReady (): void { this.sendf('i', C2S.MOVE_READY) }

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
    [S2C.END_TURN_AMOUNT]: this.processEndTurnAmount,
    [S2C.END_TURN_READY]: this.processEndTurnReady,
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

    if (!this.mode.opt21) {
      this.mode.optSplitNonAce = m.get()
      this.mode.optSplitAce = m.get()
      const modeFlags1 = m.get()
      this.mode.optDouble = Math.min(modeFlags1 & 3, BlackjackModeDouble.NUM - 1)
      this.mode.optSurrender = Math.min((modeFlags0 >> 2) & 3, BlackjackModeSurrender.NUM - 1)

      this.mode.optSplitDouble = !!(modeFlags1 & (1 << 4))
      this.mode.optSplitSurrender = !!(modeFlags1 & (1 << 5))
      this.mode.optHitSurrender = !!(modeFlags1 & (1 << 6))
      this.mode.optSplitAceAdd = !!(modeFlags1 & (1 << 7))
    } else {
      this.mode.optInsureLate = false
    }

    this.localPlayer = undefined
    this.result = undefined
  }

  protected processPlayerInfo (m: ByteReader, p: BlackjackPlayerInfo): void {
    if (this.roundState !== GameState.ACTIVE) return

    p.hands = readHandBets(m)
    p.handIndex = m.getInt()
    const flags = m.getUint64()
    const v = flags >> 1n
    p.bet = this.roundState === GameState.ACTIVE && this.gamePhase === GamePhase.BET ? v : 0n
    p.insurance = this.roundState === GameState.ACTIVE && this.gamePhase !== GamePhase.BET ? v : 0n
    p.ready = !!(flags & 1n)
  }

  protected processDiscInfo (m: ByteReader, p: BlackjackDiscInfo): void {
    p.hands = readHandBets(m)
    p.insurance = m.getUint64()
    p.score = m.getInt64()
    p.scoreChange = m.getInt64()
  }

  protected processRoundStartInfo (): void {
    this.gamePhase = GamePhase.BET
    this.dealerHand = new Hand()
    this.cardCountShoeHasHole = false

    this.localPlayer = undefined
    this.playerInfo.forEach((p) => {
      const bet = Math.max(2, Math.min(Number(MAX_BALANCE - this.clients[p.owner].balance), 100))
      p.hands = []
      p.handIndex = 0
      p.bet = BigInt(bet)
      p.insurance = 0n
      p.ready = false
      if (p.owner === this.localClient.cn) {
        this.localPlayer = p
        this.pendingAmount = bet
      }
    })
  }

  protected processRoundInfo (m: ByteReader): void {
    this.cardCountShoe = readCardCount(m)

    if (this.roundState !== GameState.ACTIVE) {
      return this.processRoundStartInfo()
    }

    const flags = m.get()
    this.gamePhase = flags & 3

    if (this.gamePhase === GamePhase.BET) {
      return this.processRoundStartInfo()
    }

    const dealerFlags = m.get()
    this.dealerHand = new Hand()
    this.dealerHand.addCard(dealerFlags & 0xf)
    this.cardCountShoeHasHole = !!(dealerFlags & (1 << 4))
    if (this.mode.optDecks && this.mode.optDealer !== BlackjackModeDealer.NO_HOLE) {
      this.cardCountHole = readCardCount(m)
    }
  }

  protected processEndTurn (m: ByteReader): void {
    if (this.gamePhase === GamePhase.PRE) {
      // surrender
      const p = this.playerInfo[m.getInt()]

      const handBet = p.hands[p.handIndex]
      handBet[1] = -handBet[1]

      p.handIndex++
      return
    } else if (this.gamePhase !== GamePhase.PLAY) {
      return
    }

    const turnIndex = this.mode.optSpeed ? m.getInt() : this.turnIndex
    const move = clamp(m.get(), 0, BlackjackMove.NUM - 1)

    const p = this.playerInfo[turnIndex]

    const handBet = p.hands[p.handIndex]
    const [hand, bet] = handBet
    let handFinished: boolean | undefined
    switch (move) {
      case BlackjackMove.DOUBLE:
        handBet[1] <<= 1n

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

        const handNew = hand.split(card0, card1)

        p.hands.splice(p.handIndex + 1, 0, [handNew, bet])

        handFinished = hand.value >= 21
        break
      case BlackjackMove.SURRENDER:
        handBet[1] = -handBet[1]
        // fallthrough
      case BlackjackMove.STAND:
        handFinished = true
    }

    this.setTimer(this.mode.optTurnTime)
    if (handFinished) {
      while (++p.handIndex < p.hands.length) {
        if (p.hands[p.handIndex][0].value < 21 && p.hands[p.handIndex][1] > 0) {
          return
        }
      }

      if (!this.mode.optSpeed) {
        // skip surrendered/finished players
        while (++this.turnIndex < this.playerInfo.length) {
          if (this.playerInfo[this.turnIndex].handIndex < this.playerInfo[this.turnIndex].hands.length) {
            break
          }
        }
      }
    }
  }

  protected processEndTurnAmount (m: ByteReader): void {
    const p = this.playerInfo[m.getInt()]
    p[this.gamePhase === GamePhase.BET ? 'bet' : 'insurance'] = m.getUint64()
  }

  protected processEndTurnReady (m: ByteReader): void {
    const p = this.playerInfo[m.getInt()]
    p.ready = true
  }

  protected processEndRound (m: ByteReader): void {
    this.setTimer(this.mode.optTurnTime)

    END: switch (this.gamePhase) {
      case GamePhase.BET: {
        this.pendingAmount = 0

        // hands
        for (const p of this.playerInfo) {
          const cards = m.get()
          const hand = new Hand()
          hand.addCard(cards & 0xf)
          hand.addCard(cards >> 4)
          p.hands = [[hand, p.bet]]
          p.handIndex = hand.value >= 21 ? 1 : 0
          p.ready = false
        }
        const dealerFaceUp = m.get()
        this.dealerHand.addCard(dealerFaceUp)

        // deal cards: players, hole/face-up card, players, face-up card
        this.cardCountShoeHasHole = false
        for (const p of this.playerInfo) {
          this.consumeCard(p.hands[0][0].cards[0])
        }
        if (this.mode.optDecks && this.mode.optDealer > BlackjackModeDealer.NO_HOLE) {
          this.cardCountShoeHasHole = true
          this.cardCountHole = this.cardCountShoe.slice() as CardCountTotal
          this.checkHoleCard()
        } else {
          this.consumeCard(dealerFaceUp)
        }
        for (const p of this.playerInfo) {
          this.consumeCard(p.hands[0][0].cards[1])
        }
        if (this.mode.optDealer > BlackjackModeDealer.NO_HOLE) {
          this.consumeCard(dealerFaceUp)
        }

        // skip finished players
        while (this.playerInfo[this.turnIndex].handIndex) {
          if (++this.turnIndex === this.playerInfo.length) {
            break END
          }
        }

        // peek early (late surrender, no insurance) result
        if (this.mode.opt21
          ? this.mode.optDealer >= BlackjackModeDealer.HOLE0 && (dealerFaceUp === CardValue.Ace || dealerFaceUp === CardValue.Ten)
          : this.mode.optDealer === BlackjackModeDealer.HOLE0 && dealerFaceUp === CardValue.Ten
        ) {
          if (m.get()) {
            break END
          } else if (this.cardCountShoeHasHole) {
            const impossible = dealerFaceUp === CardValue.Ace ? CardValue.Ten : CardValue.Ace
            this.cardCountHole[CardValue.NUM] -= this.cardCountHole[impossible]
            this.cardCountHole[impossible] = 0
          }
        }
        this.gamePhase = !this.mode.opt21 && (!this.mode.optInsureLate && dealerFaceUp === CardValue.Ace ||
          this.mode.optSurrender && this.mode.optDealer === BlackjackModeDealer.HOLE1)
            ? GamePhase.PRE : GamePhase.PLAY
        return
      }
      case GamePhase.PRE: {
        // skip surrendered players
        while (this.playerInfo[this.turnIndex].handIndex) {
          if (++this.turnIndex === this.playerInfo.length) {
            break END
          }
        }

        // peek late (early surrender) result
        const dealerFaceUp = this.dealerHand.cards.at(-1)
        if (this.mode.optDealer === BlackjackModeDealer.HOLE0 && dealerFaceUp === CardValue.Ace
          || this.mode.optDealer === BlackjackModeDealer.HOLE1 && (dealerFaceUp === CardValue.Ace || dealerFaceUp === CardValue.Ten)) {
          if (m.get()) {
            break END
          } else if (this.cardCountShoeHasHole) {
            const impossible = dealerFaceUp === CardValue.Ace ? CardValue.Ten : CardValue.Ace
            this.cardCountHole[CardValue.NUM] -= this.cardCountHole[impossible]
            this.cardCountHole[impossible] = 0
          }
        }
        this.gamePhase = GamePhase.PLAY
        return
      }
      case GamePhase.PLAY: {
        if (this.mode.optInsureLate && this.dealerHand.cards.at(-1) === CardValue.Ace) {
          for (const p of this.playerInfo) {
            p.handIndex = p.hands.length
          }
          this.gamePhase = GamePhase.POST
          return
        }
        // break
      }
      // case GamePhase.POST:
    }

    // end phase: read dealer cards
    const duration = m.getUint64()

    if (this.mode.optDealer > BlackjackModeDealer.NO_HOLE) {
      const dealerHole = m.get()
      this.dealerHand.addCard(dealerHole, true)
      if (this.cardCountShoeHasHole) {
        this.cardCountShoeHasHole = false
        this.consumeCard(dealerHole)
      }
    }

    if (this.playerInfo.some((p) => p.hands.some(([h, b]) => b > 0 && (h.value < 21 || h.value === 21 && h.cards.length > 2)))) {
      while (this.dealerShouldHit()) {
        const card = m.get()
        this.dealerHand.addCard(card)
        this.consumeCard(card)
      }
    }

    const history: BlackjackGameHistory = {
      duration,
      dealerHand: this.dealerHand,
      players: [],
    }

    const dealerBJ = this.dealerHand.isNaturalBlackjack(false)

    for (const p of this.playerInfo) {
      const c = this.clients[p.owner]

      let scoreChange = 0n

      const hands = p.hands.map(([hand, bet]): HandBetOutcome => {
        let outcome = BlackjackOutcome.PUSH

        if (bet < 0) {
          outcome = BlackjackOutcome.SURRENDERED
          scoreChange += bet >> 1n
          c.addLoss()
        } else if (hand.value > 21) {
          outcome = BlackjackOutcome.BUST
          scoreChange -= bet
          c.addLoss()
        } else if (hand.isNaturalBlackjack(p.hands.length > 1)) {
          if (dealerBJ) {
            c.addTie()
          } else {
            outcome = BlackjackOutcome.BLACKJACK_NATURAL
            scoreChange += bet + (bet >> 1n)
            c.addWin()
          }
        } else if (hand.value === this.dealerHand.value) {
          c.addTie()
        } else if (this.dealerHand.value > 21 || hand.value > this.dealerHand.value) {
          outcome = BlackjackOutcome.WIN
          scoreChange += bet
          c.addWin()
        } else {
          outcome = BlackjackOutcome.LOSE
          scoreChange -= bet
          c.addLoss()
        }

        return [hand, bet, outcome]
      })

      const insuranceOutcome = dealerBJ ? p.insurance : -p.insurance
      scoreChange += insuranceOutcome

      if (this.mode.optInverted) {
        scoreChange = -scoreChange
      }

      c.balance += scoreChange
      if (c.balance < MIN_BALANCE) {
        c.balance = MIN_BALANCE
      } else if (c.balance > MAX_BALANCE) {
        c.balance = MAX_BALANCE
      }

      history.players.push({
        name: c.formatName(),
        isMe: c === this.localClient,

        hands,
        insurance: p.insurance,
        insuranceOutcome,

        score: c.balance,
        scoreChange,
      })
    }

    for (const d of this.playerDiscInfo) {
      history.players.push({
        name: d.ownerName,
        isMe: d.isMe,

        hands: d.hands.map(([hand, bet]) => [
          hand, bet,
          bet < 0
            ? BlackjackOutcome.SURRENDERED
            : hand.value > 21
              ? BlackjackOutcome.BUST
              : hand.isNaturalBlackjack(d.hands.length > 1)
                ? BlackjackOutcome.PUSH
                : BlackjackOutcome.LOSE
        ]),
        insurance: d.insurance,
        insuranceOutcome: -d.insurance,

        score: d.score,
        scoreChange: d.scoreChange,
      })
    }

    this.addHistory(this.result = history)
  }

  protected eliminatePlayer (_m: ByteReader, d: BlackjackDiscInfo, pn: number, p: BlackjackPlayerInfo, c: BlackjackClient): boolean {
    d.insurance = p.insurance
    let scoreChange = -p.insurance
    for (const [hand, bet] of d.hands = p.hands) {
      if (bet < 0) {
        scoreChange += bet >> 1n
        c.addLoss()
      } else if (!hand.isNaturalBlackjack(p.hands.length > 1)) {
        scoreChange -= bet
        c.addLoss()
      } else {
        c.addTie()
      }
    }
    if (this.mode.optInverted) {
      scoreChange = -scoreChange
    }
    d.score = (c.balance += (d.scoreChange = scoreChange))

    if (!this.mode.optSpeed && this.gamePhase === GamePhase.PLAY && pn === this.turnIndex) {
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

    this.cardCountShoe[card]--
    this.cardCountShoe[CardValue.NUM]--

    if (this.cardCountShoeHasHole && this.cardCountHole[card] > this.cardCountShoe[card]) {
      const diff = this.cardCountHole[card] - this.cardCountShoe[card]
      this.cardCountHole[card] -= diff
      this.cardCountHole[CardValue.NUM] -= diff
    }

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

export const enum CardValue {
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
  return [readHand(m), m.getInt64()]
}

function readHandBets (m: ByteReader): HandBet[] {
  const MAX_HANDS = 256

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
