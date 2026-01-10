import { clamp } from '@/util'
import { formatClientName } from '@gmc/game/common'
import { ByteReader } from '@gmc/game/ByteReader'
import { filterChat } from '@gmc/game/CommonGame.svelte'
import { GameState } from '@gmc/game/TurnBasedGame.svelte'
import { RoundRobinClient, RoundRobinGame, RRTurnDiscInfo, RRTurnPlayerInfo } from '@gmc/game/RoundRobinGame.svelte'
import type { BaseGameRoom } from '@gmc/remote/BaseGameRoom'

import { defaultMode, type CribbageMode } from './gamemode'

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
  MOVE_READY,
  END_TURN,
  PLAYER_ELIMINATE,
  PLAYER_PRIVATE_INFO_HAND,
}

const enum C2S {
  RESET,
  RENAME,
  PONG,
  CHAT,
  ACTIVE,
  READY,
  MOVE_KEEP,
  MOVE_PLAY,
  MOVE_PRE,
  MOVE_POST,
}

class CribbageClient extends RoundRobinClient {
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

export class CribbagePlayerInfo extends RRTurnPlayerInfo {
  score = $state(0)
  handSize = $state(0)
  played: number[] = $state([])
  passed = $state(false)
}

export class CribbageDiscInfo extends RRTurnDiscInfo {
  score = 0
}

export interface CribbageGameHistory {
  hand: number
  trick: number
  turn: number
  duration: bigint
  players: {
    name: string
    isMe?: boolean

    score: number
    rank: number
  }[]
}

export type CribbageMoveInfo =
  | CribbageMoveInfoEnd
  | CribbageMoveInfoStart
  | CribbageMoveInfoFinal
  | CribbageMoveInfoPlay
  | CribbageMoveInfoPass
  | CribbageMoveInfoShow
  | CribbageMoveInfoLeave

interface CribbageMoveInfoPlayer {
  playerName: string
  playerIsMe: boolean
}

interface CribbageMoveInfoScore extends CribbageMoveInfoPlayer {
  scoreDelta: number
  score: number
}

interface CribbageMoveInfoScoreCards extends CribbageMoveInfoScore {
  scoreReasons: ScoreReason[]
}

interface CribbageMoveInfoEnd {
  type: 'endHand'
  hand: number
}

interface CribbageMoveInfoStart extends CribbageMoveInfoPlayer {
  type: 'start'
  starter: number
  bonus: boolean
  score: number
}

interface CribbageMoveInfoFinal extends CribbageMoveInfoScore {
  type: 'final'
  hand: number
  trick: number
  turn: number
  count: number
}

interface CribbageMoveInfoPlay extends CribbageMoveInfoScoreCards {
  type: 'play'
  card: number
}

interface CribbageMoveInfoPass extends CribbageMoveInfoPlayer {
  type: 'pass'
}

interface CribbageMoveInfoShow extends CribbageMoveInfoScoreCards {
  type: 'show'
  cards: number[]
  isCrib?: boolean
}

interface CribbageMoveInfoLeave extends CribbageMoveInfoPlayer {
  type: 'leave'
}

export interface ScoreReason {
  score: number
  reason: string
  cards?: number[]
}

// const DECK_SIZE = 52

export class CribbageGame extends RoundRobinGame<CribbageClient, CribbagePlayerInfo, CribbageDiscInfo, CribbageGameHistory> {
  PlayerInfoType = CribbagePlayerInfo
  PlayerDiscType = CribbageDiscInfo

  mode: CribbageMode = $state(defaultMode())

  myHand: number[] = $state([])
  localPlayer: CribbagePlayerInfo | undefined = $state()

  gamePhase = $state(GamePhase.DEAL)
  dealer = $state(0)
  starter = $state(0)
  handNum = $state(0)
  trickNum = $state(0)
  trickTurn = $state(0)
  trickCount = $state(0)
  play: number[] = $state([])
  crib: number[] = $state([])
  cribSize = $state(0)

  moveHistory = $state([] as CribbageMoveInfo[])

  discard0 = $state(0)
  discard1 = $state(0)
  pendingMove = $state(0)

  override canMove = $derived(this.playing && (this.gamePhase === GamePhase.PLAY ? this.playerIsMe(this.playerInfo[this.turnIndex]) : !this.localPlayer!.passed))

  get ROUND_TIME () { return this.mode.optTurnTime }
  INTERMISSION_TIME = 30000

  override newClient () { return new CribbageClient }

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
  sendMoveKeep (): void { this.sendf('ic', C2S.MOVE_KEEP, this.discard0 | (this.discard1 << 3)) }
  sendMovePlay (): void { this.sendf('ic', C2S.MOVE_PLAY, this.pendingMove) }
  sendMoveReady (): void { this.sendf('i', this.gamePhase === GamePhase.PRE ? C2S.MOVE_PRE : C2S.MOVE_POST) }

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
    [S2C.MOVE_READY]: this.processMoveReady,
    [S2C.END_TURN]: this.processEndTurn,
    [S2C.PLAYER_ELIMINATE]: this.processEliminate,
    [S2C.PLAYER_PRIVATE_INFO_HAND]: this.processPrivateInfoHand,
  }

  protected processWelcomeMode (m: ByteReader): void {
    const flags = Number(m.getUint64())
    this.mode.optTurnTime = flags >> 5
    this.mode.optScoreTarget = clamp(Number(m.getUint64()) + 1, 1, 1000)
    this.mode.optSkipEmpty = !!(flags & (1 << 0))
    this.mode.optSkipPass = !!(flags & (1 << 1))
    this.mode.optSkipOnlyMove = !!(flags & (1 << 2))
    this.mode.optPre = !!(flags & (1 << 3))
    this.mode.optPost = !!(flags & (1 << 4))
  }

  protected processPlayerInfo (m: ByteReader, p: CribbagePlayerInfo): void {
    const flags = Number(m.getUint64())
    p.score = flags >> 1
    p.handSize = 0
    const length = m.get()
    p.played = Array.from({ length }, () => m.get())
    p.passed = !!(flags & 1)
  }

  protected processDiscInfo (m: ByteReader, p: CribbageDiscInfo): void {
    p.score = Number(m.getUint64())
  }

  protected processRoundStartInfo (m: ByteReader): void {
    this.handNum = 0
    this.moveHistory = []
    this.localPlayer = this.localClient.active ? this.playerInfo.find((p) => p.owner === this.localClient.cn) : undefined

    this.resetTrick()

    this.gamePhase = GamePhase.DEAL
    this.dealer = -1
  }

  protected processStartHand (m: ByteReader): void {
    this.resetTrick()

    if ((this.turnIndex = (this.dealer = m.getCN()) + 1) === this.playerInfo.length) {
      this.turnIndex = 0
    }

    const cardsPerPlayer = this.cardsPerPlayer()
    for (const p of this.playerInfo) {
      p.handSize = cardsPerPlayer
      p.played = []
    }

    this.discard0 = 0
    this.discard1 = 1
  }

  private cardsPerPlayer () {
    return this.playerInfo.length > 2 ? 5 : 6
  }

  protected processRoundInfo (m: ByteReader): void {
    this.moveHistory = []

    this.localPlayer = undefined

    if (this.roundState !== GameState.ACTIVE) {
      this.handNum = 0
      this.resetTrick()
      return
    }

    const flags = Number(m.getUint64())

    this.gamePhase = flags & 3
    this.handNum = flags >> 2
    this.dealer = m.getCN()
    this.crib = []

    if (this.gamePhase) {
      this.trickNum = m.getInt()
      this.trickTurn = m.getInt()
      this.trickCount = m.get()
      this.starter = m.get()

      this.cribSize = 4
      for (const p of this.playerInfo) {
        p.handSize = 4 - p.played.length
      }

      this.play = Array.from({ length: m.get() }, () => m.get())

      if (this.gamePhase === GamePhase.POST) {
        this.crib = readHand(m)
      }
    } else {
      this.resetTrick()

      const cardsPerPlayer = this.cardsPerPlayer()
      for (const p of this.playerInfo) {
        if (p.passed) {
          p.handSize = 4
          this.cribSize += cardsPerPlayer - 4
        } else {
          p.handSize = cardsPerPlayer
        }
      }
    }
  }

  private resetTrick (): void {
    this.trickNum = this.trickTurn = 0
    this.trickCount = 0
    this.play = []
    this.crib = []
    this.cribSize = this.playerInfo.length === 3 ? 1 : 0
  }

  protected processMoveConfirm (m: ByteReader) {
    const flags = m.get()
    const discard0 = flags & 7
    const discard1 = flags >> 3

    this.crib.push(this.myHand[discard0])
    if (this.playerInfo.length <= 2) {
      this.crib.push(this.myHand[discard1])
      this.myHand.splice(Math.max(discard0, discard1), 1)
      this.myHand.splice(Math.min(discard0, discard1), 1)
    } else {
      this.myHand.splice(discard0, 1)
    }

    this.pendingMove = 4
  }

  protected processMoveReady (m: ByteReader): void {
    const p = this.playerInfo[m.getCN()]

    switch (this.gamePhase) {
      case GamePhase.DEAL:
        this.processDealKeep(p)
        p.passed = true
        break
      case GamePhase.PLAY:
        throw new Error('unexpected ready during PLAY phase')
      case GamePhase.PRE:
      case GamePhase.POST:
        p.passed = true
        break
    }
  }

  protected processDealKeep (p: CribbagePlayerInfo): void {
    p.handSize = 4

    this.cribSize++
    if (this.playerInfo.length <= 2) {
      this.cribSize++
    }
  }

  protected processEndTurn (m: ByteReader): void {
    this.setTimer(this.mode.optTurnTime)

    switch (this.gamePhase) {
      case GamePhase.DEAL:
        this.processMoveDeal(m)
        break
      case GamePhase.PLAY:
        this.processMovePlay(m)
        break
      case GamePhase.PRE:
        this.processMoveShow(m)
        break
      case GamePhase.POST:
        this.gamePhase = GamePhase.DEAL
        this.unsetPassed()
        break
    }
  }

  private processMoveDeal (m: ByteReader): void {
    if (this.dealer < 0) {
      return this.processStartHand(m)
    }

    for (const p of this.playerInfo) {
      if (p.passed) {
        p.passed = false
      } else {
        this.processDealKeep(p)
      }
    }

    const bonus = (this.starter = m.get()) >> 2 === CardRank.FJack

    const p = this.playerInfo[this.dealer]
    const c = this.clients[p.owner]

    if (bonus) {
      p.score += 2
    }

    this.moveHistory.push({
      type: 'start',
      playerName: c.formatName(),
      playerIsMe: c === this.localClient,
      starter: this.starter,
      bonus,
      score: p.score,
    })

    this.gamePhase = GamePhase.PLAY
  }

  private processMovePlay (m: ByteReader): void {
    this.pendingMove = 4

    const card = m.get()
    if (card === 0xff) {
      this.pass()
      if (this.nextTurnUnpassed()) {
        this.processMoveFinalNextTrick()
      }
      return
    }

    const p = this.playerInfo[this.turnIndex]
    const c = this.clients[p.owner]
    const playerIsMe = c === this.localClient

    if (playerIsMe) {
      const i = this.myHand.length - p.handSize
      this.myHand[this.myHand.indexOf(card)] = this.myHand[i]
      this.myHand[i] = card
    }

    p.handSize--
    p.played.push(card)

    const [scoreDelta, scoreReasons] = this.scorePlay(card)

    this.play.push(card)
    const cardRank = card >> 2
    const cardValue = Math.min(cardRank + 1, 10)
    this.trickCount += cardValue

    const score = p.score += scoreDelta
    this.moveHistory.push({
      type: 'play',
      card,
      playerName: c.formatName(),
      playerIsMe,
      score,
      scoreDelta,
      scoreReasons,
    })

    if (score >= this.mode.optScoreTarget) return

    if (this.playerInfo.some(p => p.handSize)) {
      this.processMovePlayPost()
    } else if (!this.processMoveFinal()) {
      if (this.mode.optPre) {
        this.gamePhase = GamePhase.PRE
        this.unsetPassed()
        this.setTimer(this.mode.optTurnTime)
      } else {
        this.processMoveShow(m)
      }
    }
  }

  scorePlay (card: number): [number, ScoreReason[]] {
    let scoreDelta = 0
    const scoreReasons: ScoreReason[] = []

    const cardRank = card >> 2
    const cardValue = Math.min(cardRank + 1, 10)

    const cards = [...this.play, card]

    // check 15
    if (this.trickCount + cardValue === 15) {
      scoreDelta = 2
      scoreReasons.push({
        score: 2,
        reason: '15',
        cards,
      })
    }

    // check pairs
    if (cards.length >= 2 && cards.at(-2)! >> 2 === cardRank) {
      if (cards.length >= 3 && cards.at(-3)! >> 2 === cardRank) {
        if (cards.length >= 4 && cards.at(-4)! >> 2 === cardRank) {
          scoreDelta += 12
          scoreReasons.push({
            score: 12,
            reason: 'quad',
            cards: cards.slice(-4),
          })
        } else {
          scoreDelta += 6
          scoreReasons.push({
            score: 6,
            reason: 'triple',
            cards: cards.slice(-3),
          })
        }
      } else {
        scoreDelta += 2
        scoreReasons.push({
          score: 2,
          reason: 'pair',
          cards: cards.slice(-2),
        })
      }
    }

    // check run
    let bestRun = cards.length - 1
    let bitmask = 0
    let lowRank = cardRank
    let highRank = cardRank
    for (let i = bestRun; i >= 0; i--) {
      const rank = cards[i] >> 2
      if ((bitmask & (1 << rank)) != 0) {
        break
      }
      bitmask |= 1 << rank

      if (lowRank > rank) {
        lowRank = rank
      }
      if (highRank < rank) {
        highRank = rank
      }

      if (highRank - lowRank + 1 === cards.length - i) {
        bestRun = i
      }
    }
    if (bestRun <= cards.length - 3) {
      const score = cards.length - bestRun
      scoreDelta += score
      scoreReasons.push({
        score,
        reason: 'run',
        cards: cards.slice(bestRun),
      })
    }

    return [scoreDelta, scoreReasons]
  }

  private processMovePlayPost (): void {
    this.trickTurn++

    if (this.trickCount === 31) {
      this.processMoveFinalNextTrick()
    } else {
      this.nextTurnUnpassed()

      if (this.mode.optSkipEmpty) {
        while (!this.playerInfo[this.turnIndex].handSize) {
          this.pass()

          if (this.nextTurnUnpassed()) {
            this.processMoveFinalNextTrick()
            break
          }
        }
      }
    }
  }

  private processMoveFinalNextTrick (): void {
    if (!this.processMoveFinal()) {
      this.nextTurn()

      if (this.mode.optSkipEmpty) {
        while (!this.playerInfo[this.turnIndex].handSize) {
          this.pass()
          this.nextTurn()
        }
      }
    }
  }

  private processMoveFinal (): boolean {
    const p = this.playerInfo[this.turnIndex]
    const c = this.clients[p.owner]

    const scoreDelta = this.trickCount === 31 ? 2 : 1
    const score = p.score += scoreDelta

    this.moveHistory.push({
      type: 'final',
      playerName: c.formatName(),
      playerIsMe: c === this.localClient,
      score,
      scoreDelta,
      hand: this.handNum,
      trick: this.trickNum,
      turn: this.trickTurn,
      count: this.trickCount,
    })

    if (score >= this.mode.optScoreTarget) {
      return true
    }

    this.trickNum++
    this.trickTurn = 0
    this.trickCount = 0
    this.play = []
    this.unsetPassed()
    return false
  }

  private pass (): void {
    const p = this.playerInfo[this.turnIndex]
    const c = this.clients[p.owner]

    p.passed = true

    this.moveHistory.push({
      type: 'pass',
      playerName: c.formatName(),
      playerIsMe: c === this.localClient,
    })
  }

  private nextTurnUnpassed (): boolean {
    let i = this.turnIndex
    do {
      if (++i === this.playerInfo.length) {
        i = 0
      }
    } while (i !== this.turnIndex && this.playerInfo[i].passed)
    return this.turnIndex === (this.turnIndex = i)
  }

  private processMoveShow (m: ByteReader): void {
    this.turnIndex = this.dealer
    do {
      this.nextTurn()

      if (this.processShow(m)) return
    } while (this.turnIndex !== this.dealer)

    if (this.processShow(m, true)) return

    this.endHand()
  }

  private endHand (): void {
    this.moveHistory.push({
      type: 'endHand',
      hand: this.handNum++,
    })

    this.gamePhase = this.mode.optPost ? GamePhase.POST : GamePhase.DEAL
    this.dealer = -1
    this.unsetPassed()
    this.setTimer(this.mode.optTurnTime)
  }

  private processShow (m: ByteReader, isCrib?: boolean) {
    const hand = readHand(m)
    const cards = [this.starter, ...hand]
    if (isCrib) {
      this.crib = hand
    }

    const [scoreDelta, scoreReasons] = this.scoreShow(hand, true, isCrib)

    const p = this.playerInfo[this.turnIndex]
    const c = this.clients[p.owner]
    const score = p.score += scoreDelta
    this.moveHistory.push({
      type: 'show',
      playerName: c.formatName(),
      playerIsMe: c === this.localClient,
      cards,
      isCrib,
      score,
      scoreDelta,
      scoreReasons,
    })

    return score >= this.mode.optScoreTarget
  }

  scoreShow (hand: number[], hasStarter: boolean, isCrib?: boolean): [number, ScoreReason[]] {
    let scoreDelta = 0
    const scoreReasons: ScoreReason[] = []

    const cards = hasStarter ? [this.starter, ...hand] : hand.slice()

    // 15
    const byRank = Array.from({ length: CardRank.NUM }, (): number[] => [])
    const reachableValues = [1]

    for (let i = cards.length - 1; i >= 0; i--) {
      const c = cards[i]

      const rank = c >> 2
      byRank[rank].push(i)

      const reach = reachableValues[reachableValues.length - 1]
      reachableValues.push(reach | (reach << Math.min(rank + 1, 10)) & 0xffff)
    }

    const cardsUsed: number[] = []
    function backtrack (i: number, target: number) {
      const c = cards[i]

      // use current card
      const v = Math.min((c >> 2) + 1, 10)
      if (target >= v) {
        cardsUsed.push(c)
        if (target > v) {
          backtrack(i + 1, target - v)
        } else {
          scoreDelta += 2
          scoreReasons.push({
            score: 2,
            reason: '15',
            cards: cardsUsed.slice(),
          })
        }
        cardsUsed.pop()
      }

      // skip current card
      const prevRow = reachableValues[cards.length - 1 - i]
      if (prevRow & (1 << target)) {
        backtrack(i + 1, target)
      }
    }
    backtrack(0, 15)

    // runs
    if (cards.length > 2) {
      let maxRunLength = 0
      let maxRunStart = 0
      for (let i = 0, j = 0; i < CardRank.NUM; i++) {
        if (!byRank[i].length) {
          j = i + 1
        } else if (maxRunLength <= i - j) {
          maxRunLength = i - j + 1
          maxRunStart = j
        }
      }
      if (maxRunLength >= 3) {
        let runs = byRank[maxRunStart].length
        for (let i = 1; i < maxRunLength; i++) {
          runs *= byRank[maxRunStart + i].length
        }

        const score = runs * maxRunLength
        scoreDelta += score
        scoreReasons.push({
          score,
          reason: `${['', 'double ', 'triple ', 'double-double '][runs - 1]}run${maxRunLength > 3 ? ` of ${maxRunLength}` : ''}`,
          cards: byRank.slice(maxRunStart, maxRunStart + maxRunLength).flat().sort().map((i) => cards[i]),
        })
      }
    }

    // pairs
    for (const indexes of byRank) {
      if (indexes.length > 1) {
        const score = [2, 6, 12][indexes.length - 2]
        scoreDelta += score
        scoreReasons.push({
          score,
          reason: ['pair', 'triple', 'quad'][indexes.length - 2],
          cards: indexes.map((i) => cards[i]),
        })
      }
    }

    const flushSuit = hand[0] & 3
    const startSuit = this.starter & 3
    if (hand.length === 4 && hand.every((c) => (c & 3) === flushSuit)) {
      // flush
      if (hasStarter && flushSuit === startSuit) {
        scoreDelta += 5
        scoreReasons.push({
          score: 5,
          reason: '5-card flush',
          cards,
        })
      } else {
        const score = isCrib ? 0 : 4
        scoreDelta += score
        scoreReasons.push({
          score,
          reason: '4-card flush',
          cards: hand,
        })
      }
    }

    if (hasStarter) {
      const nobs = (CardRank.FJack << 2) | startSuit
      if (hand.includes(nobs)) {
        // jack of same suit as starter
        scoreDelta++
        scoreReasons.push({
          score: 1,
          reason: 'nobs',
          cards: [nobs],
        })
      }
    }

    return [scoreDelta, scoreReasons]
  }

  protected processEndRound (m: ByteReader): void {
    const duration = m.getUint64()

    const playerInfos = this.playerInfo

    const history: CribbageGameHistory = {
      duration,
      hand: this.handNum,
      trick: this.trickNum,
      turn: this.trickTurn,
      players: [],
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

      history.players.push({
        name: formatClientName(c, p.owner),
        isMe: c === this.localClient,
        score: p.score,
        rank,
      })

      c.updateScore(rank, totalPlayers)
    }

    for (const d of this.playerDiscInfo) {
      history.players.push({
        name: d.ownerName,
        isMe: d.isMe,
        score: d.score,
        rank: history.players.length + 1,
      })
    }

    this.updatePlayers()

    this.addHistory(history)
  }

  private unsetPassed () {
    this.playerInfo.forEach((p) => p.passed = false)
  }

  protected eliminatePlayer (m: ByteReader, d: CribbageDiscInfo, pn: number, p: CribbagePlayerInfo, c: CribbageClient, early: boolean): boolean {
    d.score = p.score

    const rank = this.playerInfo.length
    const totalPlayers = rank + this.playerDiscInfo.length
    c.updateScore(rank, totalPlayers)
    this.updatePlayers()

    this.moveHistory.push({
      type: 'leave',
      playerName: c.formatName(),
      playerIsMe: c === this.localClient,
    })

    this.endHand()
    this.pendingMove = 4

    // fix turnIndex
    if (this.turnIndex > pn) this.turnIndex--
    else if (this.turnIndex === this.playerInfo.length - 1) this.turnIndex = 0

    return false
  }

  private processPrivateInfoHand (m: ByteReader): void {
    this.myHand = Array.from({ length: this.cardsPerPlayer() }, () => m.get())
  }

  protected override readonly playersSortProps = [
    (p: CribbageClient) => p.score,
    (p: CribbageClient) => p.wins,
    (p: CribbageClient) => p.streak,
    (p: CribbageClient) => -p.rankLast,
    (p: CribbageClient) => -p.rankBest,
    (p: CribbageClient) => -p.rankWorst,
  ]
}

export const enum GamePhase {
  DEAL,
  PLAY,
  PRE,
  POST,
}

const enum CardRank {
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
  NUM,
}

function comparePlayerInfo (a: CribbagePlayerInfo, b: CribbagePlayerInfo): number {
  return b.score - a.score
}

function readHand (m: ByteReader): [number, number, number, number] {
  return [m.get(), m.get(), m.get(), m.get()]
}
