import { clamp, sum } from '@/util'
import { filterCN, MAX_PLAYERS, filterName, sortAndRankPlayers, formatClientName } from '@gmc/game/common'
import { ByteReader } from '@gmc/game/ByteReader'
import { ByteWriter } from '@gmc/game/ByteWriter'
import { RoundRobinClient, RoundRobinGame } from '@gmc/game/RoundRobinGame.svelte'
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

export class PresidentPlayerInfo {
  owner = $state(-1)

  discarded: CardCountTotal = $state(newZeroCardCount())
  handSize = $state(0)
}

export class PresidentDiscInfo {
  ownerName = ''

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

const MAX_NAME_LEN = 20
const MAX_CHAT_LEN = 100

const PROTOCOL_VERSION = 0

const INTERMISSION_TIME = 30000

// const CARDS_PER_DECK = 52
const MAX_DECKS = 166_799_986_198_907

export class PresidentGame extends RoundRobinGame<PresidentClient, PresidentGameHistory> {
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

  playerInfo: PresidentPlayerInfo[] = $state([])
  playerDiscInfo: PresidentDiscInfo[] = $state([])

  override newClient () { return new PresidentClient }

  enterGame (room: BaseGameRoom, name: string): void {
    this.setupGame(room)
    this.sendf('is', PROTOCOL_VERSION, name)
  }

  sendReset (): void { this.sendf('i', C2S.RESET) }
  sendRename (newName: string): void { this.sendf('is', C2S.RENAME, newName) }
  sendActive (active: boolean): void { this.sendf('ib', C2S.ACTIVE, active) }
  sendChat (s: string, flags: number, target = -1): void { this.sendf('i3s', C2S.CHAT, flags, target, s.slice(0, MAX_CHAT_LEN)) }
  sendReady (ready: boolean): void { this.sendf('ib', C2S.READY, ready) }
  sendMove (n: number, c: number): void { this.sendf('i4', C2S.MOVE, 1, n, c) }
  sendMoveTransfer (a: number, b: number): void { this.sendf('i4', C2S.MOVE, 0, a, b) }
  sendMoveEnd (): void { this.sendf('i', C2S.MOVE_END) }

  formatPlayerName (player?: PresidentPlayerInfo, pn?: number): string {
    if (!player) {
      return `<unknown${pn === undefined ? '' : (' pn#' + pn)}>`
    }
    return formatClientName(this.clients[player.owner], player.owner)
  }

  playerIsMe (player?: PresidentPlayerInfo): boolean {
    return player?.owner === this.localClient.cn
  }

  processMessage (m: ByteReader): void {
    const type = m.getInt()
    switch (type) {
      case S2C.WELCOME: {
        const protocol = m.getInt()
        if (protocol !== PROTOCOL_VERSION) {
          alert(`different protocol version (client: ${PROTOCOL_VERSION}, server: ${protocol})\nrefresh the page for updates?`)
        }

        this.clients.length = 0

        const myCn = filterCN(m.getInt())

        this.mode.optTurnTime = m.getInt()
        this.mode.optDecks = clamp(m.getFloat64(), 1, MAX_DECKS)
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

        for (let i = 0; i <= MAX_PLAYERS; i++) {
          const cn = m.getInt()
          if (cn < 0) break
          const p = cn == myCn ? this.localClient : new PresidentClient()
          p.cn = cn
          p.readWelcome(m)
          this.clients[cn] = p
        }

        const roundState = m.getInt()
        if (roundState === 0) {
          this.roundWait()
        } else if (roundState === 1) {
          this.roundIntermission(m.getInt())
          for (let i = 0; i <= MAX_PLAYERS; i++) {
            const cn = m.getInt()
            if (cn < 0) break
            const p = this.clients[cn]
            if (!p) continue
            p.ready = true
          }
        } else if (roundState === 2) {
          this.roundStart(m.getInt())
        }

        const curRoundPlayers = []
        for (let i = 0; i <= MAX_PLAYERS; i++) {
          const cn = m.getInt()
          if (cn < 0) break
          const p = this.clients[cn]
          if (!p) continue
          p.inRound = true
          curRoundPlayers.push(p)
        }
        this.roundPlayers = curRoundPlayers

        const curRoundQueue = []
        for (let i = 0; i <= MAX_PLAYERS; i++) {
          const cn = m.getInt()
          if (cn < 0) break
          const p = this.clients[cn]
          if (!p) continue
          curRoundQueue.push(p)
        }
        this.roundPlayerQueue = curRoundQueue

        this.processPlayerInfos(m)
        this.processDiscInfos(m)
        this.processRoundInfo(m)

        this.updatePlayers()
        break
      }
      case S2C.JOIN: {
        const cn = m.getInt()
        const name = filterName(m.getString(MAX_NAME_LEN))
        if (this.clients[cn]) break

        const newPlayer = new PresidentClient()
        newPlayer.cn = cn
        newPlayer.name = name

        this.clients[cn] = newPlayer

        this.chat.playerJoined(newPlayer.formatName())
        this.updatePlayers()
        break
      }
      case S2C.LEAVE: {
        const cn = m.getInt()
        const player = this.clients[cn]
        if (!player) break
        if (player.active) {
          this.playerDeactivated(player)
        }
        this.chat.playerLeft(player.formatName())
        delete this.clients[cn]
        this.updatePlayers()
        break
      }
      case S2C.RESET: {
        const cn = m.getInt()
        const player = this.clients[cn]
        if (player) {
          player.resetScore()
          this.updatePlayers()
          this.chat.playerReset(player.formatName())
        }
        break
      }
      case S2C.RENAME: {
        const cn = m.getInt()
        const newName = filterName(m.getString(MAX_NAME_LEN))
        const player = this.clients[cn]
        if (player) {
          this.chat.playerRename(player.formatName(), newName)
          player.name = newName
        }
        break
      }
      case S2C.PING: {
        // send pong
        this.room?.send(new ByteWriter()
          .putInt(C2S.PONG)
          .putInt(m.getInt())
          .toArray()
        )
        break
      }
      case S2C.PING_TIME: {
        // ping times
        for (let i = 0; i <= MAX_PLAYERS; i++) {
          const cn = m.getInt()
          if (cn < 0) break
          const ping = m.getInt()
          const player = this.clients[cn]
          if (player) {
            player.ping = ping
          }
        }
        break
      }

      case S2C.CHAT: {
        const cn = m.getInt()
        const flags = m.getInt()
        const target = m.getInt()
        const msg = m.getString(MAX_CHAT_LEN)

        const player = this.clients[cn]
        const playerName = formatClientName(player, cn)
        const targetPlayer = this.clients[target]
        const targetName = targetPlayer
          ? player === this.localClient
            ? 'you'
            : formatClientName(targetPlayer, target)
          : undefined
        this.chat.addChatMessage(playerName, msg, flags, targetName)
        break
      }
      case S2C.ACTIVE: {
        // active
        const cn = m.getInt()
        const active = m.getBool()
        const p = this.clients[cn]
        if (p) {
          p.active = active
          if (active) {
            this.playerActivated(p)
          } else {
            this.playerDeactivated(p)
          }
          this.updatePlayers()
        }
        break
      }
      case S2C.ROUND_WAIT:
        this.roundWait()
        break
      case S2C.ROUND_INTERM:
        this.roundIntermission(INTERMISSION_TIME)
        break
      case S2C.ROUND_START: {
        this.unsetInRound()
        const curRoundPlayers = []
        for (let i = 0; i <= MAX_PLAYERS; i++) {
          const cn = m.getInt()
          if (cn < 0) break
          const p = this.clients[cn]
          if (!p) continue
          p.inRound = true
          curRoundPlayers.push(p)
        }

        this.roundPlayers = curRoundPlayers
        this.roundPlayerQueue = []
        this.roundStart(this.mode.optTurnTime)

        const playerInfo: PresidentPlayerInfo[] = []
        for (let i = 0; i <= this.clients.length; i++) {
          const owner = m.getInt()
          if (owner < 0) break

          const p = new PresidentPlayerInfo()
          p.owner = owner
          playerInfo.push(p)
        }
        this.playerInfo = playerInfo
        this.playerDiscInfo = []

        this.processRoundStartInfo(m)
        break
      }
      case S2C.READY: {
        const cn = m.getInt()
        const ready = m.getBool()
        const p = this.clients[cn]
        if (p) {
          p.ready = ready
        }
        break
      }
      case S2C.MOVE_CONFIRM:
        this.pendingMove = m.getInt()
        this.pendingMoveCount = m.getInt()
        break
      case S2C.END_TURN:
        this.processEndTurn(m)
        this.setTimer(this.mode.optTurnTime)

        if (this.playerInfo.length) {
          this.playerInfo.push(this.playerInfo.shift()!)
        }
        break
      case S2C.END_ROUND:
        this.processEndRound(m)
        break
      case S2C.PLAYER_ELIMINATE: {
        // can't imply hand from unspectate/leave/endTurn, as
        // private info of leaving players might need to be revealed
        const pNum = m.getInt()
        const playerInfo = this.playerInfo[pNum]
        if (!playerInfo) {
          // should not happen
          this.room?.disconnect()
          break
        }

        const newDiscInfo = new PresidentDiscInfo()
        const c = this.clients[playerInfo.owner]
        newDiscInfo.ownerName = formatClientName(c, playerInfo.owner)

        const isFirst = m.getBool()

        newDiscInfo.discarded = playerInfo.discarded
        newDiscInfo.hand = readCardCount(m)

        if (c) {
          // const rank = this.playerInfo.length
          // updateScore(c, rank, rank + this.playerDiscInfo.length)
        }

        this.playerInfo.splice(pNum, 1)
        if (isFirst) {
          // TODO
        } else {
          this.playerDiscInfo.push(newDiscInfo)
        }
        break
      }
      case S2C.PLAYER_PRIVATE_INFO:
        this.processPrivateInfo(m)
        break
      default:
        throw new Error('tag type')
    }
  }

  private processPlayerInfos (m: ByteReader): void {
    const playerInfo: PresidentPlayerInfo[] = []
    for (let i = 0; i <= this.clients.length; i++) {
      const owner = m.getInt()
      if (owner < 0) break

      const p = new PresidentPlayerInfo()
      p.owner = owner

      p.handSize = m.getInt()
      p.discarded = readCardCount(m)

      playerInfo.push(p)
    }
    this.playerInfo = playerInfo
  }

  private processDiscInfos (m: ByteReader): void {
    const discInfo: PresidentDiscInfo[] = []
    for (let i = 0; i <= this.clients.length; i++) {
      const ownerName = m.getString(32)
      if (!ownerName) break

      const p = new PresidentDiscInfo()
      p.ownerName = ownerName

      p.discarded = readCardCount(m)
      p.hand = readCardCount(m)

      discInfo.push(p)
    }
    this.playerDiscInfo = discInfo
  }

  private processRoundStartInfo (m: ByteReader): void {
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

  private processRoundInfo (m: ByteReader): void {
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

  protected processEndTurn (m: ByteReader): void {
    // TODO
    // const card = m.getInt()
    // const cardCount = m.getFloat64()
  }

  private processEndRound (m: ByteReader): void {
    // TODO
    // const playerInfos = this.playerInfo

    // for (const p of playerInfos) {
    //   p.hand = readCardCount(m)
    // }

    // calculate ranks
    // this.addHistory(gameHistoryEntry)
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

  private updatePlayers (): void {
    this.leaderboard = sortAndRankPlayers(this.clients, [
      (p) => p.score,
      (p) => p.streak,
      (p) => p.rank2p,
      (p) => p.rank1p,
      (p) => p.rank0,
    ])
  }

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
