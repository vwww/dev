import { clamp, sum, type Repeat } from '@/util'
import { filterCN, MAX_PLAYERS, filterName, sortAndRankPlayers, formatClientName } from '@gmc/game/common'
import { ByteReader } from '@gmc/game/ByteReader'
import { ByteWriter } from '@gmc/game/ByteWriter'
import { RoundRobinClient, RoundRobinGame } from '@gmc/game/RoundRobinGame.svelte'
import { GameState } from '@gmc/game/TurnBasedGame.svelte'
import type { BaseGameRoom } from '@gmc/remote/BaseGameRoom'

import { defaultMode, type DiscardMode } from './gamemode'

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

class DiscardClient extends RoundRobinClient {
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
}

export class DiscardPlayerInfo {
  owner = $state(-1)

  discarded: number[] = $state([])
  discardSum = $state(0)
  immune = $state(false)
  hand?: number = $state()
}

export class DiscardDiscInfo {
  ownerName = ''

  discarded: number[] = []
  discardSum = 0
}

export interface DiscardGameHistory {
  survived: {
    name: string
    rank: number
    hand: number
    discarded: number[]
    discardSum: number
  }[]

  eliminated: {
    name: string
    discarded: number[]
    discardSum: number
  }[]
}

export type DiscardMoveInfo =
  | DiscardMoveInfoMove
  | DiscardMoveInfoReveal
  | DiscardMoveInfoCompare
  | DiscardMoveInfoTrade

interface DiscardMoveInfoMove {
  type: 'move'
  playerName: string
  playerIsMe: boolean
  move: number
  targetName: string
  targetIsMe: boolean
  targetIsPlayer: boolean
  targetValid: boolean
  info: number
}

interface DiscardMoveInfoReveal {
  type: 'reveal'
  playerName: string
  hand: number
}

interface DiscardMoveInfoCompare {
  type: 'cmp'
  playerName: string
  ours: number
  theirs: number
}

interface DiscardMoveInfoTrade {
  type: 'trade'
  playerName: string
  oldHand: number
  newHand: number
}

const MAX_NAME_LEN = 20
const MAX_CHAT_LEN = 100

const MAX_HISTORY_LEN = 100

const PROTOCOL_VERSION = 0

const INTERMISSION_TIME = 30000

const CARDS_PER_DECK = 15
const MAX_DECKS = 3

export class DiscardGame extends RoundRobinGame<DiscardClient> {
  mode: DiscardMode = $state(defaultMode())

  myHand = $state(0)
  myAltMove = $state(0)
  deckSize = $state(0)
  cardCountDiscard = $state(newZeroCardCount())
  cardCountRemain = $state(newZeroCardCount())
  cardCountTotal = $state(newZeroCardCount())
  moveHistory = $state([] as DiscardMoveInfo[])

  pendingMoveUseHand = $state(false)
  pendingMoveTarget = $state(0)
  pendingMoveGuess = $state(0)

  playerInfo: DiscardPlayerInfo[] = $state([])
  playerDiscInfo: DiscardDiscInfo[] = $state([])

  pastGames: DiscardGameHistory[] = $state([])

  override newClient () { return new DiscardClient }

  enterGame (room: BaseGameRoom, name: string): void {
    this.setupGame(room)
    this.sendf('is', PROTOCOL_VERSION, name)
  }

  sendReset (): void { this.sendf('i', C2S.RESET) }
  sendRename (newName: string): void { this.sendf('is', C2S.RENAME, newName) }
  sendActive (active: boolean): void { this.sendf('ib', C2S.ACTIVE, active) }
  sendChat (s: string, flags: number, target = -1): void { this.sendf('i3s', C2S.CHAT, flags, target, s.slice(0, MAX_CHAT_LEN)) }
  sendReady (ready: boolean): void { this.sendf('ib', C2S.READY, ready) }
  sendMove (useHand: boolean, target: number, guess: number): void { this.sendf('ibi2', C2S.MOVE, useHand, target, guess) }
  sendMoveUseHand (uh: boolean): void { this.sendMove(uh, this.pendingMoveTarget, this.pendingMoveGuess) }
  sendMoveTarget (target: number): void { this.sendMove(this.pendingMoveUseHand, target, this.pendingMoveGuess) }
  sendMoveGuess (guess: number): void { this.sendMove(this.pendingMoveUseHand, this.pendingMoveTarget, guess) }
  sendMoveEnd (): void { this.sendf('i', C2S.MOVE_END) }

  addHistory (history: DiscardGameHistory): void {
    if (this.pastGames.length >= MAX_HISTORY_LEN)
      this.pastGames.pop()
    this.pastGames.unshift(history)
  }

  clearHistory (): void {
    this.pastGames = []
  }

  formatPlayerName (player?: DiscardPlayerInfo, pn?: number): string {
    if (!player) {
      return `<unknown${pn === undefined ? '' : (' pn#' + pn)}>`
    }
    return formatClientName(this.clients[player.owner], player.owner)
  }

  playerIsMe (player?: DiscardPlayerInfo): boolean {
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
        this.mode.optDecks = clamp(m.getInt(), 1, MAX_DECKS)

        for (let i = 0; i <= MAX_PLAYERS; i++) {
          const cn = m.getInt()
          if (cn < 0) break
          const p = cn == myCn ? this.localClient : new DiscardClient()
          p.cn = cn
          p.active = m.getBool()
          p.name = filterName(m.getString(MAX_NAME_LEN))
          p.ping = m.getInt()

          p.ready = false
          p.inRound = false

          p.score = m.getInt()
          p.streak = m.getInt()
          p.wins = m.getInt()
          p.losses = m.getInt()
          p.rankLast = m.getInt()
          p.rankBest = m.getInt()
          p.rankWorst = m.getInt()
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

        const newPlayer = new DiscardClient()
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

        const playerInfo: DiscardPlayerInfo[] = []
        for (let i = 0; i <= this.clients.length; i++) {
          const owner = m.getInt()
          if (owner < 0) break

          const p = new DiscardPlayerInfo()
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
        this.pendingMoveUseHand = m.getBool()
        this.pendingMoveTarget = m.getInt()
        this.pendingMoveGuess = m.getInt()
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

        const newDiscInfo = new DiscardDiscInfo()
        const c = this.clients[playerInfo.owner]
        newDiscInfo.ownerName = formatClientName(c, playerInfo.owner)

        const hand = m.getInt()
        newDiscInfo.discarded = [...playerInfo.discarded, hand]
        newDiscInfo.discardSum = playerInfo.discardSum + hand
        this.updateDiscardCount(hand)

        if (c) {
          const rank = this.playerInfo.length
          updateScore(c, rank, rank + this.playerDiscInfo.length)
        }

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
    const playerInfo: DiscardPlayerInfo[] = []
    for (let i = 0; i <= this.clients.length; i++) {
      const owner = m.getInt()
      if (owner < 0) break

      const p = new DiscardPlayerInfo()
      p.owner = owner

      const discardSize = Math.min(m.getInt(), CARDS_PER_DECK * MAX_DECKS)
      p.discarded = Array(discardSize).fill(undefined).map(() => m.getInt())
      p.immune = m.getBool()
      p.discardSum = sum(p.discarded)

      playerInfo.push(p)
    }
    this.playerInfo = playerInfo
  }

  private processDiscInfos (m: ByteReader): void {
    const discInfo: DiscardDiscInfo[] = []
    for (let i = 0; i <= this.clients.length; i++) {
      const ownerName = m.getString(32)
      if (!ownerName) break

      const p = new DiscardDiscInfo()
      p.ownerName = ownerName

      const discardSize = Math.min(m.getInt(), CARDS_PER_DECK * MAX_DECKS)
      p.discarded = Array(discardSize).fill(undefined).map(() => m.getInt())
      p.discardSum = sum(p.discarded)

      discInfo.push(p)
    }
    this.playerDiscInfo = discInfo
  }

  private processRoundStartInfo (m: ByteReader): void {
    // infer deck size by dealing 1 card per player, then first player card
    // special case: (15 * decks) players => 0 turns
    this.deckSize = Math.max(0, this.mode.optDecks * CARDS_PER_DECK - this.playerInfo.length - 1)
    this.cardCountDiscard = newZeroCardCount()
    this.cardCountRemain = newTotalCardCount(this.mode.optDecks)
    this.cardCountTotal = newTotalCardCount(this.mode.optDecks)

    this.moveHistory = []
  }

  private processRoundInfo (m: ByteReader): void {
    this.deckSize = m.getInt()
    const discardCount: CardCountTotal = [
      m.getInt(), m.getInt(), m.getInt(), m.getInt(),
      m.getInt(), m.getInt(), m.getInt(), m.getInt(),
      0
    ]
    discardCount[8] = sum(discardCount.slice(0, 8))

    const totalCard = newTotalCardCount(this.mode.optDecks)
    this.cardCountDiscard = discardCount
    this.cardCountRemain = totalCard.map((v, i) => v - discardCount[i]) as CardCountTotal
    this.cardCountTotal = totalCard

    this.moveHistory = []
  }

  protected processEndTurn (m: ByteReader): void {
    const [p, nextPlayer] = this.playerInfo
    if (!p) return
    const move = m.getInt()
    const target = m.getInt()

    const c = this.clients[p.owner]
    const targetInfo = this.playerInfo[target]

    const playerIsMe = c === this.localClient

    const moveHistoryEntry: DiscardMoveInfoMove = {
      type: 'move',
      playerName: formatClientName(c, p.owner),
      playerIsMe,
      move,
      targetName: targetInfo ? formatClientName(this.clients[targetInfo.owner], targetInfo.owner) : 'nobody',
      targetIsMe: this.playerIsMe(targetInfo),
      targetIsPlayer: targetInfo === p,
      targetValid: !!targetInfo,
      info: 0,
    }

    if (playerIsMe && move === this.myHand) {
      this.myHand = this.myAltMove
    }
    if (p.hand === move) {
      // if other players' revealed card is used, it is now unknown
      p.hand = undefined
    }
    if (move !== 8) {
      // when voluntarily discarding 8, it will be discarded during elimination
      p.discarded.push(move)
      p.discardSum += move
      this.updateDiscardCount(move)
    }

    switch (move) {
      case 1: {
        // guess
        const guess = m.getInt()
        const elim = m.getBool()
        moveHistoryEntry.info = elim ? -guess : guess
        break
      }
      case 2: // reveal separately
        break
      case 3: { // also compare separately
        if (target > 0) {
          const result = m.getInt()
          moveHistoryEntry.info = result
          if (result) {
            // different cards: we can infer a range, or infer exact if the other is 7
            if (result === -7 && targetInfo) {
              targetInfo.hand = 8
            } else if (result === 7) {
              p.hand = 8
            }
          } else {
            // equal cards: copy hand value from other
            if (targetInfo && targetInfo.hand !== p.hand) {
              if (targetInfo.hand === undefined) {
                targetInfo.hand = p.hand
              } else if (p.hand === undefined) {
                p.hand = targetInfo.hand
              }
            }
          }
        }
        break
      }
      case 4:
        // immune until next turn
        p.immune = true
        break
      case 5: {
        // target draws (target receives new card separately)
        const discarded = m.getInt()
        moveHistoryEntry.info = discarded
        if (discarded !== 8) {
          p.discarded.push(discarded)
          p.discardSum += discarded
          this.updateDiscardCount(discarded)
          this.deckSize--
        } else {
          // other players' known hands can become unknown
          // when they are forced to draw
          p.hand = undefined
        }
        break
      }
      case 6:
        // trade
        // just swap hand knowledge
        if (targetInfo && !this.playerIsMe(p) && !this.playerIsMe(targetInfo)) {
          const tmp = targetInfo.hand
          targetInfo.hand = p.hand
          p.hand = tmp
        }
        break
      case 7:
      case 8:
        // do nothing
    }

    // pre-deal out next card (not if less than 2 left)
    if (this.deckSize > 1) this.deckSize--
    this.moveHistory.push(moveHistoryEntry)

    if (nextPlayer) {
      nextPlayer.immune = false
    }
  }

  private processEndRound (m: ByteReader): void {
    const playerInfos = this.playerInfo

    for (const p of playerInfos) {
      p.hand = m.getInt()
    }

    const eliminated = this.playerDiscInfo.map((d) => ({ ...d, name: d.ownerName }))
    eliminated.reverse()

    const gameHistoryEntry: DiscardGameHistory = {
      survived: [],
      eliminated,
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

      gameHistoryEntry.survived.push({
        name: formatClientName(c, p.owner),
        hand: p.hand ?? 0,
        rank,
        discarded: p.discarded,
        discardSum: p.discardSum,
      })

      if (!c) continue
      updateScore(c, rank, totalPlayers)
    }

    this.addHistory(gameHistoryEntry)
  }

  private processPrivateInfo (m: ByteReader): void {
    const x = m.getInt()
    switch (x) {
      case -1:
        this.myHand = m.getInt()
        break
      case 0:
        this.myAltMove = m.getInt()
        break
      case 2:
      case 3:
      case 6: {
        const pn = m.getInt()
        const hand = m.getInt()

        const player = this.playerInfo[pn]
        const playerName = this.formatPlayerName(player, pn)

        switch (x) {
          case 2:
            if (player) {
              player.hand = hand
            }
            this.moveHistory.push({ type: 'reveal', playerName, hand })
            break
          case 3: {
            const ours = this.myHand
            if (player) {
              player.hand = hand
            }
            this.moveHistory.push({ type: 'cmp', ours, theirs: hand, playerName })
            break
          }
          case 6: {
            const oldHand = this.myHand
            this.moveHistory.push({ type: 'trade', oldHand, newHand: hand, playerName })
            if (player) {
              player.hand = oldHand
            }
            this.myHand = hand
            break
          }
        }
        break
      }
    }
  }

  private updatePlayers (): void {
    this.leaderboard = sortAndRankPlayers(this.clients, [
      (p) => p.score,
      (p) => p.wins,
      (p) => p.streak,
    ])
  }

  private playerActivated (player: DiscardClient): void {
    this.roundPlayerQueue.push(player)
  }

  private playerDeactivated (player: DiscardClient): void {
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

  private updateDiscardCount (card: number): void {
    card-- // convert to 0-based index

    this.cardCountDiscard[card]++
    this.cardCountDiscard[8]++

    this.cardCountRemain[card]--
    this.cardCountRemain[8]--
  }
}

function comparePlayerInfo (a: DiscardPlayerInfo, b: DiscardPlayerInfo): number {
  const aH = a.hand ?? 0
  const bH = b.hand ?? 0
  return (bH - aH) || (b.discardSum - a.discardSum)
}

function updateScore (c: DiscardClient, rank: number, totalPlayers: number): void {
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

type CardCount = Repeat<number, 8>
type CardCountTotal = [...CardCount, number]

const baseCardCount: CardCountTotal = [5, 2, 2, 2, 2, 1, 1, 1, 15]

function newZeroCardCount (): CardCountTotal {
  return [0, 0, 0, 0, 0, 0, 0, 0, 0]
}

function newTotalCardCount (decks: number): CardCountTotal {
  return baseCardCount.map((v) => v * decks) as typeof baseCardCount
}
