import { clamp } from '@/util'
import { formatClientName } from '@gmc/game/common'
import { ByteReader } from '@gmc/game/ByteReader'
import { ByteWriter } from '@gmc/game/ByteWriter'
import { filterChat } from '@gmc/game/CommonGame.svelte'
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
  EXTEND_TURN,
  PLAYER_ELIMINATE,
  PLAYER_PRIVATE_HAND,
  PLAYER_PRIVATE_REVEAL,
}

const enum C2S {
  RESET,
  RENAME,
  PONG,
  CHAT,
  ACTIVE,
  READY,
  MOVE_CLAIM,
  MOVE_ACTUAL,
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
    this.wins = m.getInt()
    this.streak = m.getInt()
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
  discardClaim: CardCountTotal = newZeroCardCount()
  handSize = 0n
  duration = 0
}

export interface CheatGameHistory {
  duration: number
  players: {
    name: string
    isMe?: boolean
    duration: number
  }[]
}

export type CheatMoveInfo =
  | {
    type: 'move'
    playerName: string
    playerIsMe: boolean
    n: number
    c: bigint
  }
  | {
    type: 'reveal'
    actual: CardCountTotal
  }

// @ts-ignore
const enum CheatModeCheck {
  ARBITER,
  CALLER,
  PUBLIC,
  PUBLIC_ALL,
  NUM,
}

const enum CheatModeTricks {
  SKIP,
  PASS,
  FORCE,
  NUM,
}

// const CARDS_PER_DECK = 52
const MAX_DECKS = 166_799_986_198_907n

export class CheatGame extends RoundRobinGame<CheatClient, CheatPlayerInfo, CheatDiscInfo, CheatGameHistory> {
  PlayerInfoType = CheatPlayerInfo
  PlayerDiscType = CheatDiscInfo

  mode: CheatMode = $state(defaultMode())

  trickTurns = $state(0)
  trickCount = $state(0)
  trickValue = $state(0)

  cardCountHandMine = $state(newZeroCardCount())
  cardCountAllMine = $state(newZeroCardCount())
  cardCountAllOthers = $state(newZeroCardCount())
  cardCountClaimMine = $state(newZeroCardCount())
  cardCountClaimOthers = $state(newZeroCardCount())
  cardCountClaimRemain = $state(newZeroCardCount())
  cardCountTotal = $state(newZeroCardCount())
  moveHistory = $state([] as CheatMoveInfo[])

  pendingMove = $state(newZeroCardCount())
  pendingMoveClaim = $state(0)

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
  sendActive (active: boolean): void { this.sendf('ib', C2S.ACTIVE, active) }
  sendReady (ready: boolean): void { this.sendf('ib', C2S.READY, ready) }
  sendMoveClaim (n: number, c: bigint): void { this.sendf('i2U', C2S.MOVE_CLAIM, n, c) }
  sendMoveActual (actuals: CardCount): void {
    const w = new ByteWriter().putInt(C2S.MOVE_ACTUAL)
    writeCardCount(w, actuals)
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
    [S2C.MOVE_CONFIRM]: this.processMoveConfirm,
    [S2C.END_ROUND]: this.processEndRound,
    [S2C.END_TURN]: this.processEndTurn,
    [S2C.EXTEND_TURN]: this.processExtendTurn,
    [S2C.PLAYER_ELIMINATE]: this.processEliminate,
    [S2C.PLAYER_PRIVATE_HAND]: this.processPrivateInfoHand,
    [S2C.PLAYER_PRIVATE_REVEAL]: this.processPrivateInfoResult,
  }

  protected processWelcomeMode (m: ByteReader): void {
    this.mode.optTurnTime = m.getInt()
    this.mode.optCallTime = m.getInt()
    this.mode.optDecks = clamp(m.getUint64(), 1n, MAX_DECKS)
    const modeFlags0 = m.get()
    const modeFlags1 = m.get()
    const modeFlags2 = m.get()
    this.mode.optCheck = modeFlags0 & 3 // CheatModeCheck.NUM - 1 == 3
    this.mode.optTricks = Math.min((modeFlags0 >> 2) & 3, CheatModeTricks.NUM - 1)
    this.mode.optCountSame = !!(modeFlags1 & (1 << 0))
    this.mode.optCountMore = !!(modeFlags1 & (1 << 1))
    this.mode.optCountLess = !!(modeFlags1 & (1 << 2))
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
    const flags = m.getUint64()

    p.discardClaim = readCardCount(m)
    p.handSize = flags >> 1n
    p.passed = !!(flags & 1n)
  }

  protected processDiscInfo (m: ByteReader, p: CheatDiscInfo): void {
    p.discardClaim = readCardCount(m)
  }

  protected processRoundStartInfo (): void {
    const cards = 52n * this.mode.optDecks
    const playersCount = BigInt(this.roundPlayers.length)
    const cardsPerPlayer = cards / playersCount
    const cardsExtra = cards % playersCount
    this.playerInfo.forEach((p, i) => {
      p.handSize = cardsPerPlayer
      if (i < cardsExtra) {
        p.handSize++
      }
    })

    this.moveHistory = []
  }

  protected processRoundInfo (m: ByteReader): void {
    const cardsRemain = readCardCount(m)
    const cardsClaim = readCardCount(m)
    const cardsTotal = newTotalCardCount(this.mode.optDecks)
    // const cardsClaimRemain = [] // calc from total

    this.cardCountAllOthers = cardsRemain
    this.cardCountClaimOthers = cardsClaim
    this.cardCountTotal = cardsTotal
    // this.cardCountClaimRemain = cardsClaimRemain
  }

  protected processMoveConfirm (m: ByteReader) {
    this.pendingMove = readCardCount(m)
    this.pendingMoveClaim = m.getInt()
  }

  protected processEndTurn (m: ByteReader): void {
    const [p] = this.playerInfo
    const cl = this.clients[p.owner]

    const n = m.getInt()
    const count = m.getUint64()

    this.moveHistory.push({
      type: 'move',
      playerName: formatClientName(cl, p.owner),
      playerIsMe: cl === this.localClient,
      n,
      c: count,
    })

    this.setTimer(this.mode.optTurnTime)
    this.nextTurn()
  }

  protected processExtendTurn (): void {
    this.setTimer(this.mode.optTurnTime)
  }

  protected processCheat1 (m: ByteReader): void {
    this.processCheatCall(m, false)
  }

  protected processCheat2 (m: ByteReader): void {
    this.processCheatCall(m, true)
  }

  protected processCheatCall (m: ByteReader, callerWrong: boolean): void {
    // cheat called
    const caller = m.getInt()
    const callerInfo = this.playerInfo[caller]

    console.log(callerInfo)
    // TODO
  }

  protected processEndRound (m: ByteReader): void {
    const duration = m.getInt()

    const players = this.playerDiscInfo.map((d) => ({ ...d, name: d.ownerName, isMe: d.isMe, duration: d.duration }))

    const [p] = this.playerInfo
    const c = this.clients[p.owner]
    const totalPlayers = 1 + this.playerDiscInfo.length
    updateScore(c, 1, totalPlayers)

    this.addHistory({ duration, players }) // TODO push to players?
  }

  protected eliminatePlayer (m: ByteReader, d: CheatDiscInfo, p: CheatPlayerInfo, c: CheatClient): void {
    const rank = m.getInt()
    const duration = m.getInt()
    d.handSize = p.handSize
    d.duration = duration
    // TODO: how does dumping the cards affect other state?

    if (c) {
      const totalPlayers = this.playerInfo.length + this.playerDiscInfo.length
      updateScore(c, rank, totalPlayers)
    }
  }

  private processPrivateInfoHand (m: ByteReader): void {
    this.cardCountHandMine = readCardCount(m)
  }

  private processPrivateInfoResult (m: ByteReader): void {
    this.moveHistory.push({ type: 'reveal', actual: readCardCount(m) })
  }

  protected override readonly playersSortProps = [
    (p: CheatClient) => p.score,
    (p: CheatClient) => p.wins,
    (p: CheatClient) => p.streak,
  ]
}

function updateScore (c: CheatClient, rank: number, totalPlayers: number): void {
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

type CardCount = [
  bigint, bigint, bigint, bigint, bigint,
  bigint, bigint, bigint, bigint, bigint,
  bigint, bigint, bigint,
  bigint,
]
type CardCountTotal = [...CardCount, bigint]

function newZeroCardCount (): CardCountTotal {
  return [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n]
}

function newTotalCardCount (decks: bigint): CardCountTotal {
  const jokers = decks + decks // 2n * decks
  const normal = jokers + jokers // 4n * decks
  return [
    normal, normal, normal, normal, normal,
    normal, normal, normal, normal, normal,
    normal, normal, normal, jokers, 54n * decks
  ]
}

function readCardCount (m: ByteReader): CardCountTotal {
  const c0 = m.getUint64()
  const c1 = m.getUint64()
  const c2 = m.getUint64()
  const c3 = m.getUint64()
  const c4 = m.getUint64()
  const c5 = m.getUint64()
  const c6 = m.getUint64()
  const c7 = m.getUint64()
  const c8 = m.getUint64()
  const c9 = m.getUint64()
  const c10 = m.getUint64()
  const c11 = m.getUint64()
  const c12 = m.getUint64()
  const c13 = m.getUint64()
  return [
    c0, c1, c2, c3, c4,
    c5, c6, c7, c8, c9,
    c10, c11, c12, c13,
    c0 + c1 + c2 + c3 + c4 + c5 + c6 + c7 + c8 + c9 + c10 + c11 + c12 + c13,
  ]
}

function writeCardCount (w: ByteWriter, c: CardCount) {
  c.forEach((v) => w.putUint64(v))
}

//@ts-ignore
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
  Joker,
  NUM,
}
