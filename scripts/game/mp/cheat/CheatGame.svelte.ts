import { clamp, sumB, type Repeat } from '@/util'
import { formatClientName } from '@gmc/game/common'
import { ByteReader } from '@gmc/game/ByteReader'
import { ByteWriter } from '@gmc/game/ByteWriter'
import { filterChat } from '@gmc/game/CommonGame.svelte'
import { GameState } from '@gmc/game/TurnBasedGame.svelte'
import { RoundRobinClient, RoundRobinGame, RRTurnDiscInfo, RRTurnPlayerInfo } from '@gmc/game/RoundRobinGame.svelte'
import type { BaseGameRoom } from '@gmc/remote/BaseGameRoom'

import { defaultMode, type CheatMode } from './gamemode'

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
  CALL_WIN,
  CALL_FAIL,
  PLAYER_ELIMINATE,
  PLAYER_ELIMINATE_EARLY,
  PLAYER_PRIVATE_INFO_HAND,
  PLAYER_PRIVATE_INFO_MOVE,
  PLAYER_PRIVATE_INFO_PENALTY,
  PLAYER_PRIVATE_INFO_REVEAL,
}

const enum C2S {
  RESET,
  RENAME,
  PONG,
  CHAT,
  ACTIVE,
  READY,
  MOVE,
  MOVE_CALL,
  MOVE_END,
}

class CheatClient extends RoundRobinClient {
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

export class CheatPlayerInfo extends RRTurnPlayerInfo {
  discardClaim: CardCountTotal = $state(newZeroCardCount())
  handSize = $state(0n)
  passed = $state(false)
}

export class CheatDiscInfo extends RRTurnDiscInfo {
  handSize = 0n
  trickNum = 0
  duration = 0n
}

export interface CheatGameHistory {
  trickNum: number
  duration: bigint
  players: {
    name: string
    isMe?: boolean
    trickNum: number
    duration: bigint
  }[]
}

export type CheatMoveInfo =
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
    count: bigint
  }
  | {
    type: 'callSuccess'
    playerName: string
    playerIsMe: boolean
    victimName: string
    victimIsMe: boolean
  }
  | {
    type: 'callFail'
    playerName: string
    playerIsMe: boolean
  }
  | {
    type: 'pass'
    playerName: string
    playerIsMe: boolean
  }
  | {
    type: 'play' | 'penalty' | 'reveal' | 'reveal2'
    cards: CardCountTotal
  }
  | {
    type: 'leave'
    playerName: string
    playerIsMe: boolean
    handSize: bigint
  }

const enum CheatModeCheck {
  ARBITER,
  CALLER,
  PUBLIC,
  PUBLIC_ALL,
  NUM,
}

export const enum CheatModeTricks {
  FORCED,
  PASS_TURN,
  PASS_TRICK,
  SINGLE_TURN,
  NUM,
}

const CARDS_PER_DECK = 54n
const MAX_DECKS = 1n << 51n

export class CheatGame extends RoundRobinGame<CheatClient, CheatPlayerInfo, CheatDiscInfo, CheatGameHistory> {
  PlayerInfoType = CheatPlayerInfo
  PlayerDiscType = CheatDiscInfo

  mode: CheatMode = $state(defaultMode())

  canChallenge = $state(false)
  shouldChallenge = $state(false)
  trickNum = $state(0)
  trickTurn = $state(0)
  trickCount = $state(0n)
  trickRank = $state(0)

  callTimerStart = $state(0)
  callTimerEnd = $state(0)

  passIndex = $state(0)

  cardCountTotal = $state(newZeroCardCount())
  cardCountHandMine = $state(newZeroCardCount())
  cardCountAllMine = $state(newZeroCardCount())
  cardCountAllOthers = $derived(this.cardCountTotal.map((v, i) => v - this.cardCountHandMine[i]) as CardCountTotal)
  cardCountClaimMine = $state(newZeroCardCount())
  cardCountClaimOthers = $state(newZeroCardCount())
  // cardCountClaimDisc = $state(newZeroCardCount())
  cardCountClaimRemain = $state(newZeroCardCount())

  moveHistory = $state([] as CheatMoveInfo[])

  pendingMoveNum = $state(newZeroCardCountNumber())
  pendingMoveNumB = $derived(this.pendingMoveNum.map(BigInt) as CardCount)
  pendingMoveTotal = $derived(sumB(this.pendingMoveNumB))
  pendingMoveAck = $state(newZeroCardCount())
  pendingMoveClaim = $state(0)
  pendingMoveClaimAck = $state(0)

  get ROUND_TIME () { return this.mode.optTurnTime }
  INTERMISSION_TIME = 30000

  override newClient () { return new CheatClient }

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
  sendMove (): void {
    const w = new ByteWriter()
      .putInt(C2S.MOVE)
      .putInt(this.pendingMoveClaim)
    writeCardCount(w, this.pendingMoveNumB)
    this.room?.send(w.toArray())
  }
  sendMoveCallCheat (): void { this.sendf('i', C2S.MOVE_CALL) }
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
    [S2C.CALL_WIN]: this.processCallWin,
    [S2C.CALL_FAIL]: this.processCallFail,
    [S2C.PLAYER_ELIMINATE]: this.processEliminate,
    [S2C.PLAYER_ELIMINATE_EARLY]: this.processEliminateEarly,
    [S2C.PLAYER_PRIVATE_INFO_HAND]: this.processPrivateInfoHand,
    [S2C.PLAYER_PRIVATE_INFO_MOVE]: this.processPrivateInfoMove,
    [S2C.PLAYER_PRIVATE_INFO_PENALTY]: this.processPrivateInfoPenalty,
    [S2C.PLAYER_PRIVATE_INFO_REVEAL]: this.processPrivateInfoResult,
  }

  protected processWelcomeMode (m: ByteReader): void {
    this.mode.optTurnTime = m.getInt()
    this.mode.optCallTime = m.getInt()
    this.mode.optDecks = clamp(m.getUint64(), 1n, MAX_DECKS)
    const modeFlags0 = m.get()
    const modeFlags1 = m.get()
    const modeFlags2 = m.get()
    this.mode.optCheck = modeFlags0 & 3 // Math.min(modeFlags0 & 3, CheatModeCheck.NUM - 1)
    this.mode.optTricks = (modeFlags0 >> 2) & 3 // Math.min((modeFlags0 >> 2) & 3, CheatModeTricks.NUM - 1)
    this.mode.optCountSame = !!(modeFlags0 & (1 << 4))
    this.mode.optCountMore = !!(modeFlags0 & (1 << 5))
    this.mode.optCountLess = !!(modeFlags0 & (1 << 6))
    this.mode.optCountZero = !!(modeFlags0 & (1 << 7))
    this.mode.optRankStartA = !!(modeFlags1 & (1 << 0))
    this.mode.optRankStartO = !!(modeFlags1 & (1 << 1))
    this.mode.optRankStartK = !!(modeFlags1 & (1 << 2))
    this.mode.optRank0 = !!(modeFlags1 & (1 << 3))
    this.mode.optRank1u = !!(modeFlags1 & (1 << 4))
    this.mode.optRank1uw = !!(modeFlags1 & (1 << 5))
    this.mode.optRank1d = !!(modeFlags1 & (1 << 6))
    this.mode.optRank1dw = !!(modeFlags1 & (1 << 7))
    this.mode.optRank2u = !!(modeFlags2 & (1 << 0))
    this.mode.optRank2uw = !!(modeFlags2 & (1 << 1))
    this.mode.optRank2d = !!(modeFlags2 & (1 << 2))
    this.mode.optRank2dw = !!(modeFlags2 & (1 << 3))
    this.mode.optRankother = !!(modeFlags2 & (1 << 4))
  }

  protected processPlayerInfo (m: ByteReader, p: CheatPlayerInfo): void {
    p.discardClaim = readCardCount(m)

    const flags = m.getUint64()
    p.handSize = flags >> 1n
    p.passed = !!(flags & 1n)
  }

  protected processDiscInfo (m: ByteReader, p: CheatDiscInfo): void {
    p.handSize = m.getUint64()
    p.trickNum = m.getInt()
    p.duration = m.getUint64()
  }

  protected processRoundStartInfo (m: ByteReader): void {
    const cards = CARDS_PER_DECK * this.mode.optDecks
    const playersCount = BigInt(this.roundPlayers.length)
    const cardsPerPlayer = cards / playersCount
    const cardsExtra = cards % playersCount
    this.playerInfo.forEach((p, i) => {
      p.discardClaim = newZeroCardCount()
      p.handSize = cardsPerPlayer
      if (i < cardsExtra) {
        p.handSize++
      }
      p.passed = false
    })

    this.canChallenge = false
    this.trickNum = this.trickTurn = 0
    this.trickCount = 0n

    this.cardCountClaimMine = newZeroCardCount()
    this.cardCountClaimOthers = newZeroCardCount()
    this.cardCountClaimRemain = newTotalCardCount(this.mode.optDecks)
    this.cardCountTotal = newTotalCardCount(this.mode.optDecks)

    this.moveHistory = []

    this.turnIndex = m.getInt()
    this.passIndex = -1
    this.resetMove()
  }

  protected processRoundInfo (m: ByteReader): void {
    this.moveHistory = []

    this.cardCountHandMine = newZeroCardCount()
    this.cardCountClaimMine = newZeroCardCount()
    this.cardCountTotal = newTotalCardCount(this.mode.optDecks)

    if (this.roundState !== GameState.ACTIVE) {
      this.canChallenge = false
      this.trickNum = this.trickTurn = 0
      this.trickCount = 0n
      this.cardCountClaimOthers = newZeroCardCount()
      this.cardCountClaimRemain = newTotalCardCount(this.mode.optDecks)
      return
    }

    const flags = m.getInt()
    this.trickNum = flags >> 1
    this.canChallenge = !!(flags & 1)
    if (this.trickTurn = m.getInt()) {
      this.trickRank = m.getInt()
      this.trickCount = m.getUint64()
    }

    const cardsClaim = readCardCount(m)
    this.cardCountClaimOthers = cardsClaim
    this.cardCountClaimRemain = this.cardCountTotal.map((v, i) => v - cardsClaim[i]) as CardCountTotal

    this.setCallTimer(this.canChallenge ? m.getInt() : 0)

    this.passIndex = this.mode.optTricks !== CheatModeTricks.FORCED ? m.getInt() : -1
  }

  protected processMoveConfirm (m: ByteReader) {
    this.pendingMoveClaimAck = m.getInt()
    this.pendingMoveAck = readCardCount(m)
  }

  protected processEndTurn (m: ByteReader): void {
    const p = this.playerInfo[this.turnIndex]
    const cl = this.clients[p.owner]

    const playerName = formatClientName(cl, p.owner)
    const playerIsMe = cl === this.localClient

    const rank = m.getInt()
    if (rank < 0) {
      this.moveHistory.push({
        type: 'pass',
        playerName,
        playerIsMe,
      })

      if (this.mode.optTricks !== CheatModeTricks.FORCED) {
        if (this.nextTurnAfterPass(p)) {
          this.nextTrick()
        }
      }

      this.canChallenge = false
    } else {
      const count = m.getUint64()

      const endTrickByMove = !this.nextRankPossible(rank) || this.nextCountImpossible(count)
      let endTrick = endTrickByMove

      if (this.mode.optTricks !== CheatModeTricks.FORCED) {
        this.passIndex = -1

        const nextIndex = this.nextUnpassed(this.turnIndex)
        if (nextIndex === this.turnIndex) {
          endTrick = true
        }

        if (!endTrick) {
          if (this.mode.optTricks === CheatModeTricks.SINGLE_TURN && this.trickTurn) {
            endTrick = this.nextTurnAfterPass(p)
          } else {
            if (this.mode.optTricks === CheatModeTricks.PASS_TURN) {
              this.unsetPassed()
            }
            this.turnIndex = nextIndex
          }
        } else if (!p.handSize) {
          this.nextTurn()
        }
      }

      if (endTrick) {
        this.nextTrick(endTrickByMove)
      } else {
        this.trickCount = count
        this.trickRank = rank
        this.trickTurn++
      }

      if (count) {
        p.discardClaim[rank] += count
        p.discardClaim[CardRank.NUM] += count
        p.handSize -= count

        const countClaim = playerIsMe ? this.cardCountClaimMine : this.cardCountClaimOthers
        countClaim[rank] += count
        countClaim[CardRank.NUM] += count
        this.cardCountClaimRemain[rank] -= count
        this.cardCountClaimRemain[CardRank.NUM] -= count

        this.shouldChallenge = (this.canChallenge = !playerIsMe) && count > this.cardCountAllOthers[rank] + this.cardCountAllOthers[CardRank.Joker]
        this.setCallTimer(this.mode.optCallTime)
      } else {
        this.canChallenge = false
      }

      this.moveHistory.push({
        type: 'move',
        playerName,
        playerIsMe,
        rank,
        count,
      })
    }

    if (this.mode.optTricks === CheatModeTricks.FORCED) {
      this.nextTurn()
    }

    this.setTimer(this.mode.optTurnTime)

    this.resetMove()
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

  private nextTurnAfterPass (p: CheatPlayerInfo): boolean {
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
    this.pendingMoveNum = newZeroCardCountNumber()
    this.pendingMoveAck = newZeroCardCount()
    this.pendingMoveClaim = this.pendingMoveClaimAck = -1
  }

  protected processCall (m: ByteReader, wrong: boolean): void {
    const caller = m.getCN()
    const callerInfo = this.playerInfo[caller]
    const callerClient = this.clients[callerInfo.owner]

    const victimInfo = wrong ? callerInfo : this.playerInfo[(this.turnIndex || this.playerInfo.length) - 1]
    const victimClient = wrong ? callerClient : this.clients[victimInfo.owner]
    this.moveHistory.push({
      type: wrong ? 'callFail' : 'callSuccess',
      playerName: formatClientName(callerClient, callerInfo.owner),
      playerIsMe: callerClient === this.localClient,
      victimName: formatClientName(victimClient, victimInfo.owner),
      victimIsMe: victimClient === this.localClient,
    })
    victimInfo.handSize += this.cardCountClaimMine[CardRank.NUM] + this.cardCountClaimOthers[CardRank.NUM]

    for (const p of this.playerInfo) {
      p.discardClaim = newZeroCardCount()
    }

    // cardCountHandMine is updated by penalty message if applicable
    this.cardCountAllMine = this.cardCountHandMine.slice() as CardCountTotal

    this.cardCountClaimMine = newZeroCardCount()
    this.cardCountClaimOthers = newZeroCardCount()
    this.cardCountClaimRemain = newTotalCardCount(this.mode.optDecks)

    this.canChallenge = false

    this.setTimer(this.mode.optTurnTime)
    this.setCallTimer(0)
  }

  protected processCallWin (m: ByteReader): void {
    this.processCall(m, false)
  }

  protected processCallFail (m: ByteReader): void {
    this.processCall(m, true)
  }

  protected processEndRound (m: ByteReader): void {
    const duration = m.getUint64()

    const history: CheatGameHistory = {
      duration,
      trickNum: this.trickNum,
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
      duration,
    })

    this.addHistory(history)
  }

  protected eliminatePlayer (m: ByteReader, d: CheatDiscInfo, pn: number, p: CheatPlayerInfo, c: CheatClient, early: boolean): boolean {
    d.duration = m.getUint64()
    d.trickNum = this.trickNum

    if (early) {
      this.cardCountClaimOthers[CardRank.Joker] += (d.handSize = p.handSize)
      this.cardCountClaimOthers[CardRank.NUM] += d.handSize
      this.cardCountClaimRemain[CardRank.Joker] -= d.handSize
      this.cardCountClaimRemain[CardRank.NUM] -= d.handSize

      if (pn + 1 === (this.turnIndex || this.playerInfo.length)) {
        this.canChallenge = false
      } else if (this.mode.optTricks !== CheatModeTricks.FORCED && pn === this.turnIndex) {
        if (this.nextTurnAfterPass(p)) {
          this.nextTrick()
        }
      }

      this.moveHistory.push({
        type: 'leave',
        playerName: c.formatName(),
        playerIsMe: c === this.localClient,
        handSize: d.handSize,
      })

      this.setTimer(this.mode.optTurnTime)
    }

    const totalPlayers = this.playerInfo.length + this.playerDiscInfo.length
    const rank = this.discIndex + (early ? this.playerInfo.length : 1)
    c.updateScore(rank, totalPlayers)

    const lastIndex = this.playerInfo.length - 1
    // fix turnIndex
    if (this.turnIndex > pn) this.turnIndex--
    else if (this.turnIndex === lastIndex) this.turnIndex = 0

    if (this.mode.optTricks !== CheatModeTricks.FORCED) {
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
    }

    return !early
  }

  private processPrivateInfoHand (m: ByteReader): void {
    const c = readCardCount(m)
    this.cardCountHandMine = c
    this.cardCountAllMine = c.slice() as CardCountTotal
  }

  private processPrivateInfoMove (m: ByteReader): void {
    const cards = readCardCount(m)
    for (let i = 0; i <= CardRank.NUM; i++) {
      if (i < CardRank.NUM) {
        this.pendingMoveNum[i] = Number(cards[i])
      }
      this.cardCountHandMine[i] -= cards[i]
    }
    this.moveHistory.push({ type: 'play', cards })
  }

  private processPrivateInfoPenalty (m: ByteReader): void {
    const cards = readCardCount(m)
    this.moveHistory.push({ type: 'penalty', cards })
    for (let i = 0; i <= CardRank.NUM; i++) {
      this.cardCountHandMine[i] += cards[i]
    }
  }

  private processPrivateInfoResult (m: ByteReader): void {
    const cards = readCardCount(m)
    this.moveHistory.push({ type: 'reveal', cards })
    if (this.mode.optCheck === CheatModeCheck.PUBLIC_ALL) {
      const cards = readCardCount(m)
      if (!cards[CardRank.NUM]) return

      this.moveHistory.push({ type: 'reveal2', cards })
    }
  }

  private setCallTimer (remain: number): void {
    const end = Date.now() + remain
    this.callTimerStart = end - Math.max(this.mode.optCallTime, remain)
    this.callTimerEnd = end
  }

  allowRank (a: CardRank): boolean {
    return this.trickTurn ? this.checkRank(a, this.trickRank) : this.checkRankStart(a)
  }

  allowCount (c: bigint): boolean {
    return this.trickTurn
      ? c
        ? c === this.trickCount
          ? this.mode.optCountSame
          : c < this.trickCount
            ? this.mode.optCountLess
            : this.mode.optCountMore && c <= 6n * this.mode.optDecks
        : this.mode.optCountZero
      : !!c
  }

  private checkRankStart (a: CardRank): boolean {
    return a === CardRank.Ace ? this.mode.optRankStartA : a === CardRank.FKing ? this.mode.optRankStartK : this.mode.optRankStartO
  }

  private checkRank (a: CardRank, b: CardRank): boolean {
    if (a === b) {
      return this.mode.optRank0
    } else if (a === b + 1) {
      return this.mode.optRank1u
    } else if (a === b + 2) {
      return this.mode.optRank2u
    } else if (a === b - 1) {
      return this.mode.optRank1d
    } else if (a === b - 2) {
      return this.mode.optRank2d
    } else if (a === CardRank.Joker - 1 && b === 0) {
      return this.mode.optRank1uw
    } else if (a === 0 && b === CardRank.Joker - 1) {
      return this.mode.optRank1dw
    } else if (a === CardRank.Joker - 1 && b === 1 || a === CardRank.Joker - 2 && b === 0) {
      return this.mode.optRank2uw
    } else if (a === 0 && b === CardRank.Joker - 2 || a === 1 && b === CardRank.Joker - 1) {
      return this.mode.optRank2dw
    } else {
      return this.mode.optRankother
    }
  }

  private nextRankPossible (rank: number) {
    return this.mode.optRank0 || this.mode.optRankother
      || (rank === CardRank.Joker - 1 ? this.mode.optRank1uw : this.mode.optRank1u)
      || (rank === 0 ? this.mode.optRank1dw : this.mode.optRank1d)
      || (rank === CardRank.Joker - 2 ? this.mode.optRank2uw : this.mode.optRank2u)
      || (rank === 1 ? this.mode.optRank2dw : this.mode.optRank2d)
  }

  private nextCountImpossible (count: bigint) {
    return !this.mode.optCountSame && (count <= 1n && !this.mode.optCountMore || count === 6n * this.mode.optDecks && !this.mode.optCountLess)
  }

  protected override readonly playersSortProps = [
    (p: CheatClient) => p.score,
    (p: CheatClient) => p.wins,
    (p: CheatClient) => p.streak,
  ]
}

type CardCount = Repeat<bigint, CardRank.NUM>
type CardCountNumber = Repeat<number, CardRank.NUM>
export type CardCountTotal = [...CardCount, bigint]

function newZeroCardCount (): CardCountTotal {
  return [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n]
}

function newZeroCardCountNumber (): CardCountNumber {
  return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
}

function newTotalCardCount (decks: bigint): CardCountTotal {
  const jokers = decks + decks // 2n * decks
  const normal = jokers + jokers // 4n * decks
  return [
    normal, normal, normal, normal, normal,
    normal, normal, normal, normal, normal,
    normal, normal, normal, jokers, CARDS_PER_DECK * decks
  ]
}

function readCardCount (m: ByteReader): CardCountTotal {
  const v = Array.from({ length: CardRank.NUM }, () => m.getUint64())
  v.push(sumB(v))
  return v as CardCountTotal
}

function writeCardCount (w: ByteWriter, c: CardCount) {
  c.forEach((v) => w.putUint64(v))
}

export const enum CardRank {
  Ace,
  N2,
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
  Joker,
  NUM,
}
