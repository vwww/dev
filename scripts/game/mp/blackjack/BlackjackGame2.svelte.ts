import { clamp } from '@/util'
import type ChatState from '@gmc/ChatState.svelte'
import { logBugReportInstructions, filterCN, MAX_PLAYERS, filterName, sortAndRankPlayers, formatClientName } from '@gmc/game/common'
import { ByteReader } from '@gmc/game/ByteReader'
import { ByteWriter } from '@gmc/game/ByteWriter'
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

export const enum GameState {
  WAITING,
  INTERMISSION,
  ACTIVE,
}

class BlackjackClient {
  cn = $state(-1)
  name = $state('unnamed')
  active = $state(false)
  rank = $state(0)
  ping = $state(-1)

  ready = $state(false)
  inRound = $state(false)

  score = $state(0)
  wins = $state(0)
  streak = $state(0)

  resetScore () {
    this.score = 0
    this.wins = 0
    this.streak = 0
  }

  formatName () {
    return `${this.name} (${this.cn})`
  }
}

export class BlackjackPlayerInfo {
  owner = $state(-1)

  hand: number[] = $state([])
  handVal = $state(0)
}

export class BlackjackDiscInfo {
  ownerName = ''

  hand: number[] = []
  handVal = 0
}

export interface BlackjackGameHistory {
  // duration: number
  players: BlackjackGameHistoryPlayer[]
}

export interface BlackjackGameHistoryPlayer {
  name: string
  cn: number

  score: number
  scoreChange: number
}

const enum BlackjackModeDouble {
  ANY,
  ON_9_10_11,
  ON_10_11,
  NUM,
}

const enum BlackjackModeSurrender {
  OFF,
  LATE,
  EARLY_NOT_ACE,
  EARLY,
  NUM,
}

const enum BlackjackMove {
  HIT,
  STAND,
  DOUBLE,
  SPLIT,
  SURRENDER,
  INSURANCE,
  NUM,
}

const MAX_NAME_LEN = 20
const MAX_CHAT_LEN = 100

const MAX_HISTORY_LEN = 100

const PROTOCOL_VERSION = 0

const INTERMISSION_TIME = 30000

const CARDS_PER_DECK = 52
const MAX_DECKS = 9

export class BlackjackGame {
  mode: BlackjackMode = $state(defaultMode())

  // TODO
  // myHand = $state(0)
  // deckSize = $state(0)
  // cardCountDiscard = $state(newZeroCardCount())
  // cardCountRemain = $state(newZeroCardCount())
  // cardCountTotal = $state(newZeroCardCount())
  // moveHistory = $state([] as BlackjackMoveInfo[])

  pendingMove = $state(0)

  localClient = new BlackjackClient()
  clients: BlackjackClient[] = []
  leaderboard: BlackjackClient[] = $state([])
  roundState = $state(GameState.WAITING)
  roundTimerStart = $state(0)
  roundTimerEnd = $state(0)

  roundPlayers: BlackjackClient[] = $state([])
  roundPlayerQueue: BlackjackClient[] = $state([])

  playerInfo: BlackjackPlayerInfo[] = $state([])
  playerDiscInfo: BlackjackDiscInfo[] = $state([])

  pastGames: BlackjackGameHistory[] = $state([])

  room?: BaseGameRoom = $state()

  constructor (public chat: ChatState) {
    setTimeout(logBugReportInstructions, 100)
  }

  enterGame (room: BaseGameRoom, name: string): void {
    this.room?.disconnect()
    this.room = room
    room.registerRecv((msg) => {
      if (this.room === room) {
        const m = new ByteReader(msg)
        try {
          while (m.remaining > 0) {
            this.processMessage(m)
          }
          if (m.overread) {
            throw new Error('overread')
          }
        } catch (error) {
          console.error('neterr', error)
          console.log(m.debugBuf, m)
          this.room.disconnect()
        }
      }
    })
    room.registerDisc(() => {
      if (this.room === room) {
        this.chat.addSysMessage('You disconnected.')
        this.room = undefined
      } else {
        this.chat.addSysMessage('You disconnected from the old room.')
      }
    })

    const welcomeBuf = new ByteWriter()
    welcomeBuf.putInt(PROTOCOL_VERSION)
    welcomeBuf.putString(name)
    room.send(welcomeBuf.toArray())

    this.chat.addSysMessage('You are joining the game.')
  }

  leaveGame (): void {
    this.room?.disconnect()
  }

  sendReset (): void {
    this.room?.send(new ByteWriter()
      .putInt(C2S.RESET)
      .toArray()
    )
  }

  sendRename (newName: string): void {
    this.room?.send(new ByteWriter()
      .putInt(C2S.RENAME)
      .putString(newName)
      .toArray()
    )
  }

  sendActive (active: boolean): void {
    this.room?.send(new ByteWriter()
      .putInt(C2S.ACTIVE)
      .putBool(active)
      .toArray()
    )
  }

  sendChat (s: string, flags: number, target = -1): void {
    if (!this.room) {
      this.chat.addSysMessage('cannot send chat message: not connected to game room')
      return
    }
    this.room.send(new ByteWriter()
      .putInt(C2S.CHAT)
      .putInt(flags)
      .putInt(target)
      .putString(s.slice(0, MAX_CHAT_LEN))
      .toArray()
    )
  }

  sendReady (ready: boolean): void {
    this.room?.send(new ByteWriter()
      .putInt(C2S.READY)
      .putBool(ready)
      .toArray()
    )
  }

  sendMove (move: BlackjackMove): void {
    this.room?.send(new ByteWriter()
      .putInt(C2S.MOVE)
      .putInt(move)
      .toArray()
    )
  }

  sendMoveEnd (): void {
    this.room?.send(new ByteWriter()
      .putInt(C2S.MOVE_END)
      .toArray()
    )
  }

  addHistory (history: BlackjackGameHistory): void {
    if (this.pastGames.length >= MAX_HISTORY_LEN)
      this.pastGames.pop()
    this.pastGames.unshift(history)
  }

  clearHistory (): void {
    this.pastGames = []
  }

  formatPlayerName (player?: BlackjackPlayerInfo, pn?: number): string {
    if (!player) {
      return `<unknown${pn === undefined ? '' : (' pn#' + pn)}>`
    }
    return formatClientName(this.clients[player.owner], player.owner)
  }

  playerIsMe (player?: BlackjackPlayerInfo): boolean {
    return player?.owner === this.localClient.cn
  }

  private processMessage (m: ByteReader): void {
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
        this.mode.optDecks = clamp(m.getInt(), 1, MAX_DECKS)
        this.mode.optDouble = clamp(m.getInt(), 0, BlackjackModeDouble.NUM - 1)
        this.mode.optSurrender = clamp(m.getInt(), 0, BlackjackModeSurrender.NUM - 1)
        this.mode.optSplitNonAce = clamp(m.getInt(), 0, 3)
        this.mode.optSplitAce = clamp(m.getInt(), 0, 3)
        const modeFlags = m.get()
        this.mode.optInverted = !!(modeFlags & (1 << 0))
        this.mode.opt21 = !!(modeFlags & (1 << 1))
        this.mode.optDealerHitSoft = !!(modeFlags & (1 << 2))
        this.mode.optDealerPeek = !!(modeFlags & (1 << 3))
        this.mode.optDoubleAfterSplit = !!(modeFlags & (1 << 4))
        this.mode.optHitSplitAce = !!(modeFlags & (1 << 5))

        for (let i = 0; i <= MAX_PLAYERS; i++) {
          const cn = m.getInt()
          if (cn < 0) break
          const p = cn == myCn ? this.localClient : new BlackjackClient()
          p.cn = cn
          p.active = m.getBool()
          p.name = filterName(m.getString(MAX_NAME_LEN))
          p.ping = m.getInt()

          p.ready = false
          p.inRound = false

          p.score = m.getInt()
          p.wins = m.getInt()
          p.streak = m.getInt()
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

        const newPlayer = new BlackjackClient()
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

        const playerInfo: BlackjackPlayerInfo[] = []
        for (let i = 0; i <= this.clients.length; i++) {
          const owner = m.getInt()
          if (owner < 0) break

          const p = new BlackjackPlayerInfo()
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

        const newDiscInfo = new BlackjackDiscInfo()
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
    const playerInfo: BlackjackPlayerInfo[] = []
    for (let i = 0; i <= this.clients.length; i++) {
      const owner = m.getInt()
      if (owner < 0) break

      const p = new BlackjackPlayerInfo()
      p.owner = owner

      const handSize = Math.min(m.getInt(), CARDS_PER_DECK * MAX_DECKS)
      p.hand = Array(handSize).fill(undefined).map(() => m.getInt())
      p.handVal = getHandVal(p.hand)

      playerInfo.push(p)
    }
    this.playerInfo = playerInfo
  }

  private processDiscInfos (m: ByteReader): void {
    const discInfo: BlackjackDiscInfo[] = []
    for (let i = 0; i <= this.clients.length; i++) {
      const ownerName = m.getString(32)
      if (!ownerName) break

      const p = new BlackjackDiscInfo()
      p.ownerName = ownerName

      const handSize = Math.min(m.getInt(), CARDS_PER_DECK * MAX_DECKS)
      p.hand = Array(handSize).fill(undefined).map(() => m.getInt())
      p.handVal = getHandVal(p.hand)

      discInfo.push(p)
    }
    this.playerDiscInfo = discInfo
  }

  private processRoundStartInfo (m: ByteReader): void {
    // TODO
  }

  private processRoundInfo (m: ByteReader): void {
    // TODO
  }

  protected processEndTurn (m: ByteReader): void {
    // TODO
  }

  private processEndRound (m: ByteReader): void {
    // TODO
  }

  private processPrivateInfo (m: ByteReader): void {
    // TODO
  }

  private updatePlayers (): void {
    this.leaderboard = sortAndRankPlayers(this.clients, [
      (p) => p.score,
      (p) => p.wins,
      (p) => p.streak,
    ])
  }

  private playerActivated (player: BlackjackClient): void {
    this.roundPlayerQueue.push(player)
  }

  private playerDeactivated (player: BlackjackClient): void {
    this.roundPlayers = this.roundPlayers.filter((p) => p !== player)
    this.roundPlayerQueue = this.roundPlayerQueue.filter((p) => p !== player)
    player.inRound = false
  }

  private roundWait (): void {
    this.roundState = GameState.WAITING
    this.unsetReady()
  }

  private roundIntermission (remain: number): void {
    this.roundState = GameState.INTERMISSION
    this.setTimer(remain)
    this.unsetReady()
  }

  private roundStart (remain: number): void {
    this.roundState = GameState.ACTIVE
    this.setTimer(remain)
    this.unsetReady()
  }

  private setTimer (remain: number): void {
    this.roundTimerStart = Date.now()
    this.roundTimerEnd = Date.now() + remain
  }

  private unsetReady (): void {
    for (const c of this.clients) {
      if (c) c.ready = false
    }
  }

  private unsetInRound (): void {
    for (const c of this.clients) {
      if (c) c.inRound = false
    }
  }
}

const enum CardValues {
  Ten,
  Ace,
  N2,
  N3,
  N4,
  N5,
  N6,
  N7,
  N8,
  N9,
  NUM,
}

function getHandVal (hand: number[]): number {
  let total = 0
  let hasAce = false
  for (const card of hand) {
    total += card || 10
    if (card === CardValues.Ace) {
      hasAce = true
    }
  }

  if (hasAce && total <= 11) total += 10
  return total
}
