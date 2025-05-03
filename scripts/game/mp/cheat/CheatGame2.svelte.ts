import { clamp } from '@/util'
import { MAX_PLAYERS, filterName, sortAndRankPlayers, formatClientName } from '@gmc/game/common'
import { ByteReader } from '@gmc/game/ByteReader'
import { ByteWriter } from '@gmc/game/ByteWriter'
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

class CheatClient extends RoundRobinClient {
  score = $state(0)

  wins = $state(0)
  streak = $state(0)

  rankLast = $state(0)
  rankBest = $state(0)
  rankWorst = $state(0)

  resetScore () {
    this.score = 0

    this.wins = 0
    this.streak = 0

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
  // hand?: CardCount // private
  handSize = $state(0)
}

export class CheatDiscInfo extends RRTurnDiscInfo {
  discardClaim: CardCountTotal = newZeroCardCount()
  // hand: CardCount // reveal? if not, how to handle claims?
  // handSize: number
}

export interface CheatGameHistory {
  // duration: number
  players: CheatGameHistoryPlayer[]
}

export interface CheatGameHistoryPlayer {
  name: string
  cn: number

  // TODO other info
}

const enum CheatModeTricks {
  SKIP,
  PASS,
  FORCE,
  NUM,
}

const MAX_NAME_LEN = 20
const MAX_CHAT_LEN = 100

const PROTOCOL_VERSION = 0

const INTERMISSION_TIME = 30000

// const CARDS_PER_DECK = 52
const MAX_DECKS = 166_799_986_198_907

export class CheatGame extends RoundRobinGame<CheatClient, CheatPlayerInfo, CheatDiscInfo, CheatGameHistory> {
  mode: CheatMode = $state(defaultMode())

  canCallCheat = $state(false)
  trickCount = $state(0)
  trickValue = $state(0)

  cardCountHandMine = $state(newZeroCardCount())
  cardCountAllMine = $state(newZeroCardCount())
  cardCountAllOthers = $state(newZeroCardCount())
  cardCountClaimMine = $state(newZeroCardCount())
  cardCountClaimOthers = $state(newZeroCardCount())
  cardCountClaimRemain = $state(newZeroCardCount())
  cardCountTotal = $state(newZeroCardCount())
  moveHistory = $state([] as CheatGameHistory[])

  pendingMove = $state(newZeroCardCount())
  pendingMoveClaim = $state(0)

  override newClient () { return new CheatClient }

  enterGame (room: BaseGameRoom, name: string): void {
    this.setupGame(room)
    this.sendf('is', PROTOCOL_VERSION, name)
  }

  sendReset (): void { this.sendf('i', C2S.RESET) }
  sendRename (newName: string): void { this.sendf('is', C2S.RENAME, newName) }
  sendActive (active: boolean): void { this.sendf('ib', C2S.ACTIVE, active) }
  sendChat (s: string, flags: number, target = -1): void { this.sendf('i3s', C2S.CHAT, flags, target, s.slice(0, MAX_CHAT_LEN)) }
  sendReady (ready: boolean): void { this.sendf('ib', C2S.READY, ready) }
  sendMove (n: number, c: number): void {
    // TODO send actual counts after claim
    this.room?.send(new ByteWriter()
      .putInt(C2S.MOVE)
      .putInt(0)
      .putInt(n) // omit, use actual for count
      .putInt(c)
      // TODO add actuals
      .toArray()
    )
  }
  sendMoveCallCheat (): void { this.sendf('i2', C2S.MOVE, 1) }
  sendMoveEnd (): void { this.sendf('i', C2S.MOVE_END) }

  formatPlayerName (player?: CheatPlayerInfo, pn?: number): string {
    if (!player) {
      return `<unknown${pn === undefined ? '' : (' pn#' + pn)}>`
    }
    return formatClientName(this.clients[player.owner], player.owner)
  }

  playerIsMe (player?: CheatPlayerInfo): boolean {
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

        const myCn = m.getCN()

        this.mode.optTurnTime = m.getInt()
        this.mode.optDecks = clamp(m.getFloat64(), 1, MAX_DECKS)
        this.mode.optTricks = clamp(m.getInt(), 0, CheatModeTricks.NUM - 1)
        const modeFlags = m.getInt()
        this.mode.optCountSame = !!(modeFlags & (1 << 0))
        this.mode.optCountMore = !!(modeFlags & (1 << 1))
        this.mode.optCountLess = !!(modeFlags & (1 << 2))
        this.mode.optRank0 = !!(modeFlags & (1 << 3))
        this.mode.optRank1u = !!(modeFlags & (1 << 4))
        this.mode.optRank1uw = !!(modeFlags & (1 << 5))
        this.mode.optRank1d = !!(modeFlags & (1 << 6))
        this.mode.optRank1dw = !!(modeFlags & (1 << 7))
        this.mode.optRank2u = !!(modeFlags & (1 << 8))
        this.mode.optRank2uw = !!(modeFlags & (1 << 9))
        this.mode.optRank2d = !!(modeFlags & (1 << 10))
        this.mode.optRank2dw = !!(modeFlags & (1 << 11))
        this.mode.optRankother = !!(modeFlags & (1 << 12))

        for (let i = 0; i <= MAX_PLAYERS; i++) {
          const cn = m.getCN()
          if (cn < 0) break
          const p = cn == myCn ? this.localClient : new CheatClient()
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
            const cn = m.getCN()
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
          const cn = m.getCN()
          if (cn < 0) break
          const p = this.clients[cn]
          if (!p) continue
          p.inRound = true
          curRoundPlayers.push(p)
        }
        this.roundPlayers = curRoundPlayers

        const curRoundQueue = []
        for (let i = 0; i <= MAX_PLAYERS; i++) {
          const cn = m.getCN()
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
        const cn = m.getCN()
        const name = filterName(m.getString(MAX_NAME_LEN))
        if (this.clients[cn]) break

        const newPlayer = new CheatClient()
        newPlayer.cn = cn
        newPlayer.name = name

        this.clients[cn] = newPlayer

        this.chat.playerJoined(newPlayer.formatName())
        this.updatePlayers()
        break
      }
      case S2C.LEAVE: {
        const cn = m.getCN()
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
        const cn = m.getCN()
        const player = this.clients[cn]
        if (player) {
          player.resetScore()
          this.updatePlayers()
          this.chat.playerReset(player.formatName())
        }
        break
      }
      case S2C.RENAME: {
        const cn = m.getCN()
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
          const cn = m.getCN()
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
        const cn = m.getCN()
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
        const cn = m.getCN()
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
          const cn = m.getCN()
          if (cn < 0) break
          const p = this.clients[cn]
          if (!p) continue
          p.inRound = true
          curRoundPlayers.push(p)
        }

        this.roundPlayers = curRoundPlayers
        this.roundPlayerQueue = []
        this.roundStart(this.mode.optTurnTime)

        const playerInfo: CheatPlayerInfo[] = []
        for (let i = 0; i <= this.clients.length; i++) {
          const owner = m.getCN()
          if (owner < 0) break

          const p = new CheatPlayerInfo()
          p.owner = owner
          playerInfo.push(p)
        }
        this.playerInfo = playerInfo
        this.playerDiscInfo = []

        this.processRoundStartInfo(m)
        break
      }
      case S2C.READY: {
        const cn = m.getCN()
        const ready = m.getBool()
        const p = this.clients[cn]
        if (p) {
          p.ready = ready
        }
        break
      }
      case S2C.MOVE_CONFIRM:
        this.pendingMove = readCardCount(m)
        this.pendingMoveClaim = m.getInt()
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

        const newDiscInfo = new CheatDiscInfo()
        const c = this.clients[playerInfo.owner]
        newDiscInfo.ownerName = formatClientName(c, playerInfo.owner)

        // TODO

        this.playerInfo.splice(pNum, 1)
        this.playerDiscInfo.push(newDiscInfo)
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
    const playerInfo: CheatPlayerInfo[] = []
    for (let i = 0; i <= this.clients.length; i++) {
      const owner = m.getCN()
      if (owner < 0) break

      const p = new CheatPlayerInfo()
      p.owner = owner

      p.discardClaim = readCardCount(m)
      p.handSize = m.getInt()

      playerInfo.push(p)
    }
    this.playerInfo = playerInfo
  }

  private processDiscInfos (m: ByteReader): void {
    const discInfo: CheatDiscInfo[] = []
    for (let i = 0; i <= this.clients.length; i++) {
      const ownerName = m.getString(32)
      if (!ownerName) break

      const p = new CheatDiscInfo()
      p.ownerName = ownerName

      p.discardClaim = readCardCount(m)

      discInfo.push(p)
    }
    this.playerDiscInfo = discInfo
  }

  private processRoundStartInfo (m: ByteReader): void {
    // TODO
  }

  private processRoundInfo (m: ByteReader): void {
    const cardsRemain = readCardCount(m)
    const cardsClaim = readCardCount(m)
    const cardsTotal = newTotalCardCount(1) // TODO use mode count
    // const cardsClaimRemain = [] // calc from total

    this.cardCountAllOthers = cardsRemain
    this.cardCountClaimOthers = cardsClaim
    this.cardCountTotal = cardsTotal
    // this.cardCountClaimRemain = cardsClaimRemain
  }

  protected processEndTurn (m: ByteReader): void {
    // TODO
  }

  private processEndRound (m: ByteReader): void {
    // TODO
  }

  private processPrivateInfo (m: ByteReader): void {
    // TODO
    switch (m.getInt()) {
      case 0: // my cards
        this.cardCountHandMine = readCardCount(m)
        break
    }
  }

  private updatePlayers (): void {
    this.leaderboard = sortAndRankPlayers(this.clients, [
      (p) => p.score,
      (p) => p.wins,
      (p) => p.streak,
    ])
  }
}

type CardCount = [
  number, number, number, number, number,
  number, number, number, number, number,
  number, number, number,
  number,
]
type CardCountTotal = [...CardCount, number]

function newZeroCardCount (): CardCountTotal {
  return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
}

function newTotalCardCount (decks: number): CardCountTotal {
  const jokers = decks + decks
  const normal = jokers + jokers
  return [
    normal, normal, normal, normal, normal,
    normal, normal, normal, normal, normal,
    normal, normal, normal, jokers, 54 * decks
  ]
}

function readCardCount (m: ByteReader): CardCountTotal {
  const c0 = m.getInt()
  const c1 = m.getInt()
  const c2 = m.getInt()
  const c3 = m.getInt()
  const c4 = m.getInt()
  const c5 = m.getInt()
  const c6 = m.getInt()
  const c7 = m.getInt()
  const c8 = m.getInt()
  const c9 = m.getInt()
  const c10 = m.getInt()
  const c11 = m.getInt()
  const c12 = m.getInt()
  const c13 = m.getInt()
  return [
    c0, c1, c2, c3, c4,
    c5, c6, c7, c8, c9,
    c10, c11, c12, c13,
    c0 + c1 + c2 + c3 + c4 + c5 + c6 + c7 + c8 + c9 + c10 + c11 + c12 + c13,
  ]
}

/*
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
  _NUM,
}
*/
