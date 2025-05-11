import { clamp, sum } from '@/util'
import { ByteReader } from '@gmc/game/ByteReader'
import { filterChat } from '@gmc/game/CommonGame.svelte'
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

class PresidentClient extends RoundRobinClient {
  score = $state(0)
  streak = $state(0)

  rank2p = $state(0)
  rank1p = $state(0)
  rank0 = $state(0)
  rank1s = $state(0)
  rank2s = $state(0)

  resetScore () {
    this.score = 0
    this.streak = 0

    this.rank2p = 0
    this.rank1p = 0
    this.rank0 = 0
    this.rank1s = 0
    this.rank2s = 0
  }

  override readWelcome (m: ByteReader): void {
    super.readWelcome(m)

    this.score = m.getInt()
    this.streak = m.getInt()
    this.rank2p = m.getInt()
    this.rank1p = m.getInt()
    this.rank0 = m.getInt()
    this.rank1s = m.getInt()
    this.rank2s = m.getInt()
  }
}

export class PresidentPlayerInfo extends RRTurnPlayerInfo {
  discarded: CardCountTotal = $state(newZeroCardCount())
  handSize = $state(0)
}

export class PresidentDiscInfo extends RRTurnDiscInfo {
  discarded: CardCountTotal = newZeroCardCount()
  hand: CardCountTotal = newZeroCardCount()
}

export interface PresidentGameHistory {
  // duration: number
  players: PresidentGameHistoryPlayer[]
}

export interface PresidentGameHistoryPlayer {
  name: string
  cn: number

  prevRankType: PresidentRankType
  newRankType: PresidentRankType
}

export type PresidentRankType = number // -2 = scum, -1 = vice scum, 0 = neutral, 1 = vice president, 2 = president

const enum PresidentModeRevolution {
  OFF,
  ON_STRICT,
  ON_RELAXED,
  ON,
  NUM,
}

const enum PresidentModeEqualize {
  DISALLOW,
  ALLOW,
  CONTINUE_OR_SKIP,
  CONTINUE_OR_PASS,
  FORCE_SKIP,
  NUM,
}

const enum PresidentModeEqualizeEndTrick {
  OFF,
  SCUM,
  ALL,
  NUM,
}

const enum PresidentModeFirstTrick {
  SCUM,
  PRESIDENT,
  RANDOM,
  NUM,
}

// const CARDS_PER_DECK = 52
const MAX_DECKS = 166_799_986_198_907n

export class PresidentGame extends RoundRobinGame<PresidentClient, PresidentPlayerInfo, PresidentDiscInfo, PresidentGameHistory> {
  PlayerInfoType = PresidentPlayerInfo
  PlayerDiscType = PresidentDiscInfo

  mode: PresidentMode = $state(defaultMode())

  gamePhase = $state(0 as GamePhase)

  pres = $state(0)
  scum = $state(0)
  vicePres = $state(0)
  viceScum = $state(0)

  lowGive0 = $state(0)
  lowGive1 = $state(0)
  hiGive0 = $state(0)
  hiGive1 = $state(0)

  revolution = $state(false)
  trickCount = $state(0)
  trickValue = $state(0)
  trickMaxed = $state(false)

  cardCountMine = $state(newZeroCardCount())
  cardCountOthers = $state(newZeroCardCount())
  cardCountDiscard = $state(newZeroCardCount())
  cardCountTotal = $state(newZeroCardCount())
  moveHistory = $state([] as PresidentGameHistory[])

  pendingMove = $state(0)
  pendingMoveCount = $state(0)

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
  sendActive (active: boolean): void { this.sendf('ib', C2S.ACTIVE, active) }
  sendReady (ready: boolean): void { this.sendf('ib', C2S.READY, ready) }
  sendMove (n: number, c: number): void { this.sendf('i4', C2S.MOVE, 1, n, c) }
  sendMoveTransfer (a: number, b: number): void { this.sendf('i4', C2S.MOVE, 0, a, b) }
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
    [S2C.END_TURN]: this.processEndTurn,
    [S2C.END_ROUND]: this.processEndRound,
    [S2C.PLAYER_ELIMINATE]: this.processEliminate,
    [S2C.PLAYER_PRIVATE_INFO]: this.processPrivateInfo,
  }

  protected processWelcomeMode (m: ByteReader): void {
    this.mode.optTurnTime = m.getInt()
    this.mode.optDecks = clamp(m.getUint64Old(), 1n, MAX_DECKS)
    this.mode.optJokers = clamp(m.getInt(), 0, 2)
    this.mode.optRevolution = clamp(m.getInt(), 0, PresidentModeRevolution.NUM - 1)
    this.mode.optEqualize = clamp(m.getInt(), 0, PresidentModeEqualize.NUM - 1)
    this.mode.optEqualizeEndTrick = clamp(m.getInt(), 0, PresidentModeEqualizeEndTrick.NUM - 1)
    this.mode.optFirstTrick = clamp(m.getInt(), 0, PresidentModeFirstTrick.NUM - 1)
    const modeFlags = m.getInt()
    this.mode.optRevEndTrick = !!(modeFlags & (1 << 0))
    this.mode.opt1Fewer2 = !!(modeFlags & (1 << 1))
    this.mode.optPlayAfterPass = !!(modeFlags & (1 << 2))
    this.mode.optEqualizeOnlyScum = !!(modeFlags & (1 << 3))
    this.mode.opt4inARow = !!(modeFlags & (1 << 4))
    this.mode.opt8 = !!(modeFlags & (1 << 5))
    this.mode.optSingleTurn = !!(modeFlags & (1 << 6))
    this.mode.optPenalizeFinal2 = !!(modeFlags & (1 << 7))
    this.mode.optPenalizeFinalJoker = !!(modeFlags & (1 << 8))
  }

  protected processPlayerInfo (m: ByteReader, p: PresidentPlayerInfo) {
    p.handSize = m.getInt()
    p.discarded = readCardCount(m)
  }

  protected processDiscInfo (m: ByteReader, p: PresidentDiscInfo) {
    p.discarded = readCardCount(m)
    p.hand = readCardCount(m)
  }

  protected processRoundStartInfo (m: ByteReader): void {
    const noPres = m.getBool()
    if (noPres) {
      this.gamePhase = GamePhase.NEW_TRICK
      // TODO
    } else {
      this.gamePhase = GamePhase.GIVE_CARDS
      this.processGiveCardInfo(m)
    }
    // TODO init cards
  }

  protected processRoundInfo (m: ByteReader): void {
    // TODO just discard count, calc others?
    const phase = m.getInt()
    this.gamePhase = phase
    switch (phase) {
      case GamePhase.GIVE_CARDS:
        this.processGiveCardInfo(m)
        break
      case GamePhase.IN_TRICK:
      case GamePhase.NEW_TRICK: {
        const discardCount = readCardCount(m)
        this.cardCountDiscard = discardCount
        // TODO infer from discarded?
      }
    }
  }

  protected processMoveConfirm (m: ByteReader) {
    this.pendingMove = m.getInt()
    this.pendingMoveCount = m.getInt()
  }

  protected processEndTurn (m: ByteReader): void {
    // TODO
    // const card = m.getInt()
    // const cardCount = m.getUint64Old()

    this.setTimer(this.mode.optTurnTime)
    this.nextTurn()
  }

  protected processEndRound (m: ByteReader): void {
    // TODO
    // const playerInfos = this.playerInfo

    // for (const p of playerInfos) {
    //   p.hand = readCardCount(m)
    // }

    // calculate ranks
    // this.addHistory(gameHistoryEntry)
  }

  protected eliminatePlayer (m: ByteReader, d: PresidentDiscInfo, p: PresidentPlayerInfo, c?: PresidentClient): void {
    const isFirst = m.getBool()

    d.discarded = p.discarded
    d.hand = readCardCount(m)

    if (c) {
      // const rank = this.playerInfo.length
      // updateScore(c, rank, rank + this.playerDiscInfo.length)
    }
    return void isFirst
  }

  private processPrivateInfo (m: ByteReader): void {
    switch (m.getInt()) {
      case 0: // my card count
        this.cardCountMine = readCardCount(m)
        // this.recalcCards()
        break
      case 1: // (vice-)scum cards
        // TODO
        m.getInt()
        m.getInt()
        break
    }
  }

  protected override readonly playersSortProps = [
    (p: PresidentClient) => p.score,
    (p: PresidentClient) => p.streak,
    (p: PresidentClient) => p.rank2p,
    (p: PresidentClient) => p.rank1p,
    (p: PresidentClient) => p.rank0,
  ]

  private processGiveCardInfo (m: ByteReader): void {
    const pres = m.getInt()
    const scum = m.getInt()
    const vicePres = m.getInt()
    const viceScum = m.getInt()
    this.pres = pres
    this.scum = scum
    this.vicePres = vicePres
    this.viceScum = viceScum
  }
}

/*
const enum CardRank {
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
  _NUM,
}
*/

const enum GamePhase { // TODO merge into GameState?
  GIVE_CARDS,
  NEW_TRICK,
  IN_TRICK,
}

type CardCount = [
  number, number, number, number, number,
  number, number, number, number, number,
  number, number, number
]

type CardCountTotal = [...CardCount, number]

function newZeroCardCount (): CardCountTotal {
  return [
    0, 0, 0, 0, 0,
    0, 0, 0, 0, 0,
    0, 0, 0, 0,
  ]
}

function readCardCount (m: ByteReader): CardCountTotal {
  const v: CardCount = [
    m.getInt(), m.getInt(), m.getInt(), m.getInt(), m.getInt(),
    m.getInt(), m.getInt(), m.getInt(), m.getInt(), m.getInt(),
    m.getInt(), m.getInt(), m.getInt(),
  ]
  return [...v, sum(v)]
}
