import { clamp, sumB, type Repeat } from '@/util'
import { formatClientName } from '@gmc/game/common'
import { ByteReader } from '@gmc/game/ByteReader'
import { filterChat } from '@gmc/game/CommonGame.svelte'
import { GameState } from '@gmc/game/TurnBasedGame.svelte'
import { RoundRobinClient, RoundRobinGame, RRTurnDiscInfo, RRTurnPlayerInfo } from '@gmc/game/RoundRobinGame.svelte'
import type { BaseGameRoom } from '@gmc/remote/BaseGameRoom'

import { defaultMode, type PresidentMode } from './gamemode'

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
  END_TURN_TRANSFER,
  END_TURN_TRANSFER_DISCARD,
  PLAYER_ELIMINATE,
  PLAYER_ELIMINATE_EARLY,
  PLAYER_PRIVATE_INFO_HAND,
  PLAYER_PRIVATE_INFO_GIVE,
}

const enum C2S {
  RESET,
  RENAME,
  PONG,
  CHAT,
  ACTIVE,
  READY,
  MOVE_PASS,
  MOVE_CONTINUE,
  MOVE_START,
  MOVE_TRANSFER,
  MOVE_END,
}

class PresidentClient extends RoundRobinClient {
  score = $state(0)
  streak = $state(0)

  rankLast = $state(0)
  roleLast = $state(5)
  roleCount = $state([0, 0, 0, 0, 0])

  updateScore (rank: number, totalPlayers: number): void {
    this.rankLast = rank
    this.score += (totalPlayers - rank) + 1

    if ((this.roleLast = rank2role(rank, totalPlayers)) === 2) {
      if (this.streak < 0) this.streak = 0
      this.streak++
    } else {
      if (this.streak > 0) this.streak = 0
      this.streak--
    }
    this.roleCount[this.roleLast + 2]++
  }

  resetScore () {
    this.score = 0
    this.streak = 0

    this.rankLast = 0
    this.rankLast = 5
    this.roleCount = [0, 0, 0, 0, 0]
  }

  canResetScore () {
    return this.rankLast
  }

  override readWelcome (m: ByteReader): void {
    super.readWelcome(m)

    this.score = m.getInt()
    this.streak = m.getInt()

    this.rankLast = m.getInt()
    this.roleLast = m.getInt()
    for (let i = 0; i < 5; i++) {
      this.roleCount[i] = m.getInt()
    }
  }
}

export class PresidentPlayerInfo extends RRTurnPlayerInfo {
  role: PresidentRole = $state(0)
  discarded: CardCountTotal = $state(newZeroCardCount())
  handSize = $state(0n)
  passed = $state(false)
}

export class PresidentDiscInfo extends RRTurnDiscInfo {
  trickNum = 0
  trickTurn = 0
  duration = 0n
  discarded: CardCountTotal = newZeroCardCount()
  hand: CardCountTotal = newZeroCardCount()
  prevRole = 0
  newRole = 0
}

export interface PresidentGameHistory {
  trickNum: number
  trickTurn: number
  duration: bigint
  players: {
    name: string
    isMe?: boolean
    trickNum: number
    trickTurn: number
    duration: bigint

    prevRole: PresidentRole
    newRole: PresidentRole
  }[]
}

export type PresidentRole = number // -2 = scum, -1 = vice scum, 0 = neutral, 1 = vice president, 2 = president

export type PresidentMoveInfo =
  | {
    type: 'tEnd'
    trick: number
    turn: number
    move: boolean
  }
  | {
    type: 'move'
    playerName: string
    playerIsMe: boolean
    rank: number
    base: number
    jokers: number
  }
  | {
    type: 'pass'
    playerName: string
    playerIsMe: boolean
  }
  | {
    type: 'give_public'
    playerName: string
    playerIsMe: boolean
    targetName: string
    targetIsMe: boolean
    cardCount: number
  }
  | {
    type: 'give'
    playerName: string
    card0: number
    card1?: number
  }
  | {
    type: 'take'
    playerName: string
    card0: number
    card1?: number
  }
  | {
    type: 'discard'
    playerName: string
    playerIsMe: boolean
    card0: number
    card1?: number
  }
  | {
    type: 'leave'
    playerName: string
    playerIsMe: boolean
    cards: CardCountTotal
  }

export const enum PresidentModeRevolution {
  OFF,
  ON_STRICT,
  ON_RELAXED,
  ON,
  NUM,
}

export const enum PresidentModePass {
  PASS_TURN,
  PASS_TRICK,
  SINGLE_TURN,
  NUM,
}

export const enum PresidentModeEqualize {
  DISALLOW,
  ALLOW,
  CONTINUE_OR_SKIP,
  CONTINUE_OR_PASS,
  FORCE_SKIP,
  NUM,
}

export const enum PresidentModeFirstTrick {
  SCUM,
  PRESIDENT,
  RANDOM,
  NUM,
}

const MAX_DECKS = 1n << 51n

export class PresidentGame extends RoundRobinGame<PresidentClient, PresidentPlayerInfo, PresidentDiscInfo, PresidentGameHistory> {
  PlayerInfoType = PresidentPlayerInfo
  PlayerDiscType = PresidentDiscInfo

  mode: PresidentMode = $state(defaultMode())

  gamePhase = $state(GamePhase.GIVE_CARDS)

  giveFlags = $state(0)
  givePlayerIndex = $state(0)
  pres = $state(0)
  scum = $state(0)
  vicePres = $state(0)
  highScum = $state(0)
  giveDown = $state(false)
  take0 = $state(0)
  take1 = $state(0)
  give0 = $state(0)
  give1 = $state(0)

  revolution = $state(false)
  trickNum = $state(0)
  trickTurn = $state(0)
  trickCount = $state(0n)
  trickTotal = $state(0n)
  trickRank = $state(0)
  trick1Fewer = $state(false)
  penalty = false

  passIndex = $state(0)

  cardCountTotal = $state(newZeroCardCount())
  cardCountMine = $state(newZeroCardCount())
  cardCountDiscard = $state(newZeroCardCount())
  cardCountOthers = $derived(this.cardCountTotal.map((v, i) => v - this.cardCountMine[i] - this.cardCountDiscard[i]) as CardCountTotal)

  moveHistory = $state([] as PresidentMoveInfo[])

  pendingMoveRank = $state(0)
  pendingMoveBase = $state(0)
  pendingMoveJokers = $state(0)
  pendingMoveRankAck = $state(0)
  pendingMoveBaseAck = $state(0)
  pendingMoveJokersAck = $state(0)

  get ROUND_TIME () { return this.mode.optTurnTime }
  INTERMISSION_TIME = 30000

  override newClient () { return new PresidentClient }

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
  setPendingRank (r: CardRank, cards: bigint, try1Fewer2: boolean): void {
    this.pendingMoveRank = r
    if (this.trickTurn) {
      const count = this.trickCount - (try1Fewer2 && this.mode.opt1Fewer2 && this.trickCount > 1 ? 1n : 0n)
      if (cards > count) {
        this.pendingMoveBase = Number(count)
        this.pendingMoveJokers = 0
      } else {
        this.pendingMoveBase = Number(cards)
        this.pendingMoveJokers = Number(count - cards)
      }
    } else {
      this.pendingMoveJokers = (this.pendingMoveBase = Number(cards)) ? 0 : 1
    }
  }
  sendMove (): void {
    if (this.pendingMoveRank < 0) {
      this.pendingMoveBase = this.pendingMoveJokers = 0
      this.sendf('i', C2S.MOVE_PASS)
    } else if (this.trickTurn || !this.pendingMoveBase) {
      this.pendingMoveBase = 0
      this.sendf('i2U', C2S.MOVE_CONTINUE, this.pendingMoveRank, BigInt(this.pendingMoveJokers))
    } else {
      this.sendf('i2U2', C2S.MOVE_START, this.pendingMoveRank, BigInt(this.pendingMoveJokers), BigInt(this.pendingMoveBase))
    }
  }
  sendMoveTransfer (a: number, b: number): void { this.sendf('i3', C2S.MOVE_TRANSFER, a, b) }
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
    [S2C.END_TURN_TRANSFER]: this.processEndTurnTransfer,
    [S2C.END_TURN_TRANSFER_DISCARD]: this.processEndTurnTransferDiscard,
    [S2C.PLAYER_ELIMINATE]: this.processEliminate,
    [S2C.PLAYER_ELIMINATE_EARLY]: this.processEliminateEarly,
    [S2C.PLAYER_PRIVATE_INFO_HAND]: this.processPrivateInfoHand,
    [S2C.PLAYER_PRIVATE_INFO_GIVE]: this.processPrivateInfoGive,
  }

  protected processWelcomeMode (m: ByteReader): void {
    this.mode.optTurnTime = m.getInt()
    this.mode.optDecks = clamp(m.getUint64(), 1n, MAX_DECKS)
    const modeFlags0 = m.get()
    const modeFlags1 = m.get()
    const modeFlags2 = m.get()
    this.mode.optJokers = Math.min(modeFlags0 & 3, 2) // 2 bits
    this.mode.optRev = (modeFlags0 >> 2) & 3 // Math.min(x, PresidentModeRevolution.NUM - 1) // 2 bits exactly, no need for min
    this.mode.optPass = Math.min((modeFlags0 >> 4) & 3, PresidentModePass.NUM - 1)
    this.mode.optFirstTrick = Math.min((modeFlags0 >> 6) & 3, PresidentModeFirstTrick.NUM - 1)
    this.mode.optEqualize = Math.min(modeFlags1 & 7, PresidentModeEqualize.NUM - 1)
    this.mode.optKeepJokers = !!(modeFlags1 & (1 << 3))
    this.mode.optMustGiveLowest = !!(modeFlags1 & (1 << 4))
    this.mode.optRevEndTrick = !!(modeFlags1 & (1 << 5))
    this.mode.opt1Fewer2 = !!(modeFlags1 & (1 << 6))
    this.mode.optEqualizeEndTrickByScum = !!(modeFlags1 & (1 << 7))
    this.mode.optEqualizeEndTrickByOthers = !!(modeFlags2 & (1 << 0))
    this.mode.optEqualizeOnlyScum = !!(modeFlags2 & (1 << 1))
    this.mode.opt4inARow = !!(modeFlags2 & (1 << 2))
    this.mode.opt8 = !!(modeFlags2 & (1 << 3))
    this.mode.optPenalizeFinal2 = !!(modeFlags2 & (1 << 4))
    this.mode.optPenalizeFinalJoker = !!(modeFlags2 & (1 << 5))
  }

  protected processPlayerInfo (m: ByteReader, p: PresidentPlayerInfo) {
    p.role = 0 // will be overwritten in processRoundInfo
    p.discarded = readCardCount(m)

    const flags = m.getUint64()
    p.handSize = flags >> 1n
    p.passed = !!(flags & 1n)
  }

  protected processDiscInfo (m: ByteReader, p: PresidentDiscInfo) {
    p.trickNum = m.getInt()
    p.trickTurn = m.getInt()
    p.duration = m.getUint64()
    p.discarded = readCardCount(m)
    p.hand = readCardCount(m)
    p.prevRole = m.getInt()
    p.newRole = m.getInt()
  }

  protected processRoundStartInfo (m: ByteReader): void {
    const cards = BigInt(52 + this.mode.optJokers) * this.mode.optDecks
    const playersCount = BigInt(this.roundPlayers.length)
    const cardsPerPlayer = cards / playersCount
    const cardsExtra = cards % playersCount
    this.playerInfo.forEach((p, i) => {
      p.role = 0
      p.discarded = newZeroCardCount()
      p.handSize = cardsPerPlayer
      if (i < cardsExtra) {
        p.handSize++
      }
      p.passed = false
    })

    this.moveHistory = []

    this.giveFlags = 0
    this.giveDown = false
    this.givePlayerIndex = -1
    this.give0 = this.give1 = -1

    if ((this.scum = m.getCN()) >= 0) {
      this.pres = 0
      const pPres = this.playerInfo[this.pres]
      const pScum = this.playerInfo[this.scum]
      pPres.role = 2
      pScum.role = -2
      this.giveFlags = 2

      if (pPres.owner === this.localClient.cn) {
        this.givePlayerIndex = this.scum
      } else if (pScum.owner === this.localClient.cn) {
        this.givePlayerIndex = this.pres
      }

      this.addGivePublic(pScum, pPres, 2)
    } else {
      this.pres = -1
    }
    if ((this.highScum = m.getCN()) >= 0) {
      this.vicePres = m.getCN()
      const pVP = this.playerInfo[this.vicePres]
      const pHS = this.playerInfo[this.highScum]
      pVP.role = 1
      pHS.role = -1
      this.giveFlags |= 1

      if (pVP.owner === this.localClient.cn) {
        this.givePlayerIndex = this.highScum
      } else if (pHS.owner === this.localClient.cn) {
        this.givePlayerIndex = this.vicePres
      }

      this.addGivePublic(pHS, pVP, 1)
    } else {
      this.vicePres = -1
    }

    this.revolution = false
    this.trickNum = this.trickTurn = 0
    this.trickCount = this.trickTotal = 0n

    this.cardCountDiscard = newZeroCardCount()
    this.cardCountTotal = newTotalCardCount(this.mode.optDecks, this.mode.optJokers)

    this.turnIndex = m.getInt()
    this.passIndex = -1

    if (this.giveFlags) {
      this.gamePhase = GamePhase.GIVE_CARDS
    } else {
      this.gamePhase = GamePhase.PLAYING_MUST_3
    }
    this.resetMove()
  }

  protected processRoundInfo (m: ByteReader): void {
    this.moveHistory = []

    this.cardCountMine = newZeroCardCount()
    this.cardCountDiscard = newZeroCardCount()
    this.cardCountTotal = newTotalCardCount(this.mode.optDecks, this.mode.optJokers)

    if (this.roundState !== GameState.ACTIVE) {
      // this.gamePhase = GamePhase.GIVE_CARDS
      // this.trickNum = this.trickTurn = 0
      // this.trickCount = 0n

      return
    }

    const flags = m.get()
    this.gamePhase = flags & 3
    if (this.gamePhase === GamePhase.GIVE_CARDS) {
      this.giveFlags = (flags >> 2) & 3
      this.revolution = false
    } else {
      this.revolution = !!(flags & (1 << 2))
    }

    let p: PresidentPlayerInfo | undefined
    if (p = this.playerInfo[this.pres = flags & (1 << 4) ? m.getCN() : -1]) p.role = 2
    if (p = this.playerInfo[this.scum = flags & (1 << 5) ? m.getCN() : -1]) p.role = -2
    if (p = this.playerInfo[this.vicePres = flags & (1 << 6) ? m.getCN() : -1]) p.role = 1
    if (p = this.playerInfo[this.highScum = flags & (1 << 7) ? m.getCN() : -1]) p.role = -1

    this.trickNum = m.getInt()
    if (this.trickTurn = m.getInt()) {
      this.trickRank = m.getInt()
      const trickFlags = m.getUint64()
      this.trickCount = trickFlags >> 1n
      this.trickTotal = m.getUint64()
      this.trick1Fewer = !!(trickFlags & 1n)
    } else {
      this.trickCount = this.trickTotal = 0n
    }

    this.playerInfo.forEach((p) => {
      for (let i = 0; i <= CardRank.NUM; i++) {
        this.cardCountDiscard[i] += p.discarded[i]
      }
    })
    this.playerDiscInfo.forEach((d) => {
      for (let i = 0; i <= CardRank.NUM; i++) {
        this.cardCountDiscard[i] += d.discarded[i] + d.hand[i]
      }
    })

    this.passIndex = m.getInt()
  }

  protected processMoveConfirm (m: ByteReader) {
    this.pendingMoveRankAck = m.getInt()
    this.pendingMoveJokersAck = Number(m.getUint64())
    this.pendingMoveBaseAck = Number(m.getUint64())
  }

  protected processEndTurn (m: ByteReader): void {
    const p = this.playerInfo[this.turnIndex]
    const cl = this.clients[p.owner]

    const playerName = formatClientName(cl, p.owner)
    const playerIsMe = cl === this.localClient

    let rank = m.getInt()
    if (rank < 0) {
      this.moveHistory.push({
        type: 'pass',
        playerName,
        playerIsMe,
      })

      if (this.gamePhase === GamePhase.PLAYING_MUST_EQUALIZE && this.mode.optEqualize === PresidentModeEqualize.CONTINUE_OR_SKIP) {
        this.turnIndex = this.nextUnpassed(this.turnIndex)
      } else {
        if (this.nextTurnAfterPass(p)) {
          this.nextTrick()
        }
      }
      this.gamePhase = GamePhase.PLAYING
    } else {
      const jokers = m.getUint64()
      let count = this.trickTurn ? BigInt(this.trickCount) : m.getUint64() + jokers

      if (this.mode.opt1Fewer2) {
        const maxRank = this.revolution ? CardRank.N3 : CardRank.N2
        if (this.trick1Fewer = (!!this.trickTurn && count > 1 && rank === maxRank)) {
          count--
        } else if (rank === CardRank.Joker) {
          rank = maxRank
        }
      }
      const base = count - jokers

      let endTrick = this.mode.opt8 && rank === CardRank.N8
      let forceSkip = false
      if (count >= 4 && this.mode.optRev) {
        const revOK =
          this.mode.optRev === PresidentModeRevolution.ON_STRICT ? !jokers :
            this.mode.optRev === PresidentModeRevolution.ON_RELAXED ? base >= 4 :
              this.mode.optRev === PresidentModeRevolution.ON
        if (revOK) {
          this.revolution = !this.revolution
          if (this.mode.optRevEndTrick) {
            endTrick = true
          }
        }
      }

      if (this.trickTurn && this.trickRank === rank) {
        this.trickTotal += count
      } else {
        this.trickTotal = count
      }

      if (this.mode.opt4inARow && this.trickTotal >= 4) {
        endTrick = true
      }

      this.gamePhase = GamePhase.PLAYING

      if (this.trickTurn && this.trickRank === rank) {
        if (p.role === -2 ? this.mode.optEqualizeEndTrickByScum : this.mode.optEqualizeEndTrickByOthers) {
          endTrick = true
        }

        if (!endTrick && this.mode.optEqualize >= PresidentModeEqualize.CONTINUE_OR_SKIP) {
          if (this.mode.optEqualize === PresidentModeEqualize.FORCE_SKIP) {
            forceSkip = true
          } else {
            this.gamePhase = GamePhase.PLAYING_MUST_EQUALIZE
          }
        }
      }

      const endTrickByMove = endTrick

      const maxRankNew = this.revolution ? CardRank.N3 : CardRank.N2
      const nextIndex = this.nextUnpassed(this.turnIndex)
      if (nextIndex === this.turnIndex || rank === maxRankNew && (!this.mode.optEqualize || this.mode.optEqualizeOnlyScum && this.scum !== nextIndex)) {
        endTrick = true
      }

      // apply move
      p.discarded[rank] += base
      p.discarded[CardRank.Joker] += jokers
      p.discarded[CardRank.NUM] += count
      if (!(p.handSize -= count)) {
        this.penalty = !!(rank === CardRank.N2 && this.mode.optPenalizeFinal2 && base || jokers && this.mode.optPenalizeFinalJoker)
      }

      this.cardCountDiscard[rank] += base
      this.cardCountDiscard[CardRank.Joker] += jokers
      this.cardCountDiscard[CardRank.NUM] += count
      if (playerIsMe) {
        this.cardCountMine[rank] -= base
        this.cardCountMine[CardRank.Joker] -= jokers
        this.cardCountMine[CardRank.NUM] -= count
      }

      this.passIndex = -1
      if (!endTrick) {
        if (this.mode.optPass === PresidentModePass.SINGLE_TURN && this.trickTurn) {
          endTrick = this.nextTurnAfterPass(p)
        } else {
          if (this.mode.optPass === PresidentModePass.PASS_TURN) {
            this.unsetPassed()
          }
          this.turnIndex = nextIndex

          if (forceSkip) {
            this.turnIndex = this.nextUnpassed(this.turnIndex)
          }
        }
      }

      if (endTrick) {
        this.nextTrick(endTrickByMove)
      } else {
        this.trickRank = rank
        if (!this.trickTurn++) {
          this.trickCount = count
        }
      }

      this.moveHistory.push({
        type: 'move',
        playerName,
        playerIsMe,
        rank,
        base: Number(base),
        jokers: Number(jokers),
      })
    }
    this.resetMove()

    this.setTimer(this.mode.optTurnTime)
  }

  private nextTrick (move = false): void {
    this.moveHistory.push({
      type: 'tEnd',
      trick: this.trickNum,
      turn: this.trickTurn,
      move,
    })

    this.unsetPassed()
    this.trickNum++
    this.trickTurn = 0
  }

  private nextTurnAfterPass (p: PresidentPlayerInfo): boolean {
    const nextIndex = this.nextUnpassed(this.turnIndex)
    if (nextIndex === this.turnIndex || this.passIndex < 0 && this.nextUnpassed(nextIndex) === this.turnIndex) {
      this.turnIndex = this.passIndex < 0 ? nextIndex : this.passIndex
      this.passIndex = -1
      return true
    } else {
      this.turnIndex = nextIndex
      p.passed = true
      return false
    }
  }

  nextUnpassed (start: number): number {
    let i = start
    do {
      if (++i === this.playerInfo.length) {
        i = 0
      }
    } while (i !== start && this.playerInfo[i].passed)
    return i
  }

  private unsetPassed () {
    this.playerInfo.forEach((p) => p.passed = false)
  }

  private resetMove () {
    this.pendingMoveRank = this.pendingMoveRankAck = -1
    this.pendingMoveBase = this.pendingMoveBaseAck =
      this.pendingMoveJokers = this.pendingMoveJokersAck = 0
  }

  protected processEndRound (m: ByteReader): void {
    const duration = m.getUint64()

    const history: PresidentGameHistory = {
      duration,
      trickNum: this.trickNum,
      trickTurn: this.trickTurn,
      players: this.playerDiscInfo.map((d) => ({ ...d, name: d.ownerName }))
    }

    // handle last player
    const [p] = this.playerInfo
    const c = this.clients[p.owner]
    const rank = this.discIndex + 1
    const totalPlayers = 1 + this.playerDiscInfo.length
    c.updateScore(rank, totalPlayers)
    history.players.splice(this.discIndex, 0, {
      name: c.formatName(),
      isMe: c === this.localClient,
      trickNum: this.trickNum,
      trickTurn: this.trickTurn,
      duration,
      prevRole: p.role,
      newRole: rank2role(rank, totalPlayers),
    })

    this.updatePlayers()
    this.addHistory(history)
  }

  protected eliminatePlayer (m: ByteReader, d: PresidentDiscInfo, pn: number, p: PresidentPlayerInfo, c: PresidentClient, early: boolean): boolean {
    d.trickNum = this.trickNum
    d.trickTurn = this.trickTurn
    d.duration = m.getUint64()

    d.discarded = p.discarded
    d.hand = readCardCount(m)
    if (c !== this.localClient) {
      for (let i = 0; i <= CardRank.NUM; i++) {
        this.cardCountDiscard[i] += d.hand[i]
      }
    }

    d.prevRole = p.role

    if (early) {
      if (this.gamePhase === GamePhase.GIVE_CARDS) {
        if (this.pres === pn) {
          this.giveFlags &= ~2
        } else if (this.vicePres === pn) {
          this.giveFlags &= ~1
        }

        this.checkGivePhaseEnd()
      } else {
        if (pn === this.turnIndex) {
          if (this.gamePhase === GamePhase.PLAYING_MUST_EQUALIZE && this.mode.optEqualize === PresidentModeEqualize.CONTINUE_OR_SKIP) {
            this.turnIndex = this.nextUnpassed(this.turnIndex)
          } else {
            if (this.nextTurnAfterPass(p)) {
              this.nextTrick()
            }
          }
          this.gamePhase = GamePhase.PLAYING
        }

        this.setTimer(this.mode.optTurnTime)
      }
    }

    this.moveHistory.push({
      type: 'leave',
      playerName: c.formatName(),
      playerIsMe: c === this.localClient,
      cards: d.hand,
    })

    const totalPlayers = this.playerInfo.length + this.playerDiscInfo.length
    const rank = this.discIndex + (early || this.penalty ? this.playerInfo.length : 1)
    c.updateScore(rank, totalPlayers)

    d.newRole = rank2role(rank, totalPlayers)

    const lastIndex = this.playerInfo.length - 1
    // fix turnIndex
    if (this.turnIndex > pn) this.turnIndex--
    else if (this.turnIndex === lastIndex) this.turnIndex = 0

    if (early) {
      // fix passIndex
      if (this.passIndex > pn) {
        this.passIndex--
      } else if (this.passIndex === lastIndex) {
        this.passIndex = 0
      }
    } else {
      this.passIndex = this.turnIndex
    }

    this.fixGiveIndex('givePlayerIndex', pn)
    this.fixGiveIndex('pres', pn)
    this.fixGiveIndex('scum', pn)
    this.fixGiveIndex('vicePres', pn)
    this.fixGiveIndex('highScum', pn)

    return !early
  }

  private fixGiveIndex (member: 'givePlayerIndex' | 'pres' | 'scum' | 'vicePres' | 'highScum', pn: number): void {
    if (this[member] > pn) {
      this[member]--
    } else if (this[member] === pn) {
      this[member] = -1
    }
  }

  private processPrivateInfoHand (m: ByteReader): void {
    this.cardCountMine = readCardCount(m)
  }

  private processEndTurnTransfer (m: ByteReader): void {
    const pn = m.getCN()
    const p = this.playerInfo[pn]

    const tn = p.role === 2 ? this.scum : this.highScum
    const t = this.playerInfo[tn]

    this.giveFlags &= ~p.role

    this.addGivePublic(p, t, p.role)
    this.checkGivePhaseEnd()
  }

  private addGivePublic (src: PresidentPlayerInfo, dst: PresidentPlayerInfo, cardCount: number) {
    const player = this.clients[src.owner]
    const target = this.clients[dst.owner]

    src.handSize -= BigInt(cardCount)
    dst.handSize += BigInt(cardCount)

    this.moveHistory.push({
      type: 'give_public',
      playerName: player.formatName(),
      playerIsMe: player === this.localClient,
      targetName: target.formatName(),
      targetIsMe: target === this.localClient,
      cardCount,
    })
  }

  private processEndTurnTransferDiscard (m: ByteReader): void {
    const pn = m.getCN()
    const p = this.playerInfo[pn]
    const pl = this.clients[p.owner]
    const playerName = pl.formatName()
    const playerIsMe = pl === this.localClient

    const card0 = m.getInt()
    this.updateDiscardCount(p, card0)

    let card1: number | undefined
    if (p.role === 2) {
      this.updateDiscardCount(p, (card1 = m.getInt()))
    }
    this.giveFlags &= ~p.role

    this.moveHistory.push({
      type: 'discard',
      playerName,
      playerIsMe,
      card0,
      card1,
    })
    this.checkGivePhaseEnd()
  }

  private checkGivePhaseEnd (): void {
    if (!this.giveFlags) {
      this.gamePhase = GamePhase.PLAYING
      this.setTimer(this.mode.optTurnTime)
    }
  }

  private processPrivateInfoGive (m: ByteReader): void {
    const p = this.playerInfo[this.givePlayerIndex]
    const playerName = this.clients[p.owner].formatName()

    const otherGive = (p.role > 0) === this.giveDown
    const type = otherGive ? 'give' : 'take'
    const cardDelta = otherGive ? 1n : -1n

    const card0 = m.getInt()
    this.cardCountMine[this.take0 = card0] += cardDelta
    this.cardCountMine[CardRank.NUM] += cardDelta
    // handSize is handled by public messages

    let card1: number | undefined
    if (p.role === 2 || p.role === -2) {
      card1 = m.getInt()

      this.cardCountMine[this.take1 = card1] += cardDelta
      this.cardCountMine[CardRank.NUM] += cardDelta
    }

    this.moveHistory.push({ type, playerName, card0, card1 })
    this.giveDown = true
  }

  private updateDiscardCount (p: PresidentPlayerInfo, c: number, n = 1n) {
    p.discarded[c] += n
    p.discarded[CardRank.NUM] += n
    this.cardCountDiscard[c] += n
    this.cardCountDiscard[CardRank.NUM] += n

    if (p.owner === this.localClient.cn) {
      this.cardCountMine[c] -= n
      this.cardCountMine[CardRank.NUM] -= n
    }

    p.handSize -= n
  }

  allowRank (a: CardRank, isScum: boolean): 0 | 1 | 2 | 3 {
    const jokers = this.cardCountMine[CardRank.Joker]
    if (this.trickTurn) {
      const showMaxButton = this.mode.opt1Fewer2 && this.trickCount > 1 // this.trickTurn is satisfied
      const isJokerFlag = a === CardRank.Joker

      const maxRank = this.revolution ? CardRank.N3 : CardRank.N2
      const count = this.trickCount - (showMaxButton && a === maxRank ? 1n : 0n)
      const trickRankMax = showMaxButton && this.trickRank == maxRank && !this.trick1Fewer
      const trickRankMsg = trickRankMax ? CardRank.Joker : this.trickRank
      const rankCards = this.cardCountMine[isJokerFlag ? maxRank : a]

      return rankCards + jokers >= count && (a === trickRankMsg
        ? (this.mode.optEqualize !== PresidentModeEqualize.DISALLOW && (!this.mode.optEqualizeOnlyScum || isScum))
        : this.gamePhase !== GamePhase.PLAYING_MUST_EQUALIZE && (this.revolution
          ? !trickRankMax && (a < trickRankMsg || isJokerFlag)
          : a > trickRankMsg))
        ? rankCards == count ? 3
          : rankCards >= count ? 2
            : 1
        : 0
    }
    const rankCards = this.cardCountMine[a]
    return rankCards + jokers > 0 && (this.gamePhase !== GamePhase.PLAYING_MUST_3 || a === CardRank.N3) ? rankCards ? 3 : 1 : 0
  }

  protected override readonly playersSortProps = [
    (p: PresidentClient) => p.score,
    (p: PresidentClient) => p.streak,
    (p: PresidentClient) => -p.rankLast,
    (p: PresidentClient) => p.roleLast,
    (p: PresidentClient) => p.roleCount[4],
    (p: PresidentClient) => p.roleCount[3],
    (p: PresidentClient) => p.roleCount[2],
    (p: PresidentClient) => p.roleCount[1],
    (p: PresidentClient) => p.roleCount[0],
  ]
}

export const enum GamePhase {
  GIVE_CARDS,
  PLAYING,
  PLAYING_MUST_3,
  PLAYING_MUST_EQUALIZE,
}

export const enum CardRank {
  N3,
  N4,
  N5,
  N6,
  N7,
  N8,
  N9,
  N10,
  FJack,
  FQueen,
  FKing,
  Ace,
  N2,
  Joker,
  NUM,
}

function rank2role (rank: number, totalPlayers: number): PresidentRole {
  if (rank === 1) return 2
  if (rank === totalPlayers) return -2
  if (totalPlayers >= 4) {
    if (rank === 2) return 1
    if (rank === totalPlayers - 1) return -1
  }
  return 0
}

type CardCount = Repeat<bigint, CardRank.NUM>

export type CardCountTotal = [...CardCount, bigint]

function newZeroCardCount (): CardCountTotal {
  return [
    0n, 0n, 0n, 0n, 0n,
    0n, 0n, 0n, 0n, 0n,
    0n, 0n, 0n, 0n, 0n,
  ]
}

function newTotalCardCount (decks: bigint, jokers: number): CardCountTotal {
  const normal = 4n * decks
  return [
    normal, normal, normal, normal, normal,
    normal, normal, normal, normal, normal,
    normal, normal, normal, BigInt(jokers) * decks, BigInt(52 + jokers) * decks
  ]
}

function readCardCount (m: ByteReader): CardCountTotal {
  const v = Array.from({ length: CardRank.NUM }, () => m.getUint64())
  v.push(sumB(v))
  return v as CardCountTotal
}
