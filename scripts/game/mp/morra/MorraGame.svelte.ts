import ChatState from '@gmc/ChatState.svelte'
import { ByteReader } from '@gmc/game/ByteReader'
import { ByteWriter } from '@gmc/game/ByteWriter'
import { type OneTurnClient, OneTurnGame } from '@gmc/game/OneTurnGame'
import { TurnC2S } from '@/game/mp/common/game/TurnBasedGame.svelte'

interface MorraClient extends OneTurnClient {
  wins: number
  losses: number
  total: number
  streak: number
}

export interface MorraGameHistory {
  playerCount: number
  moveSum: number
  moveRnd: number
  winner: number
  inverted: boolean
  teams: MorraGameHistoryTeam[]
}

interface MorraGameHistoryTeam {
  winner: boolean
  moveSum: number
  players: MorraGameHistoryPlayer[]
}

interface MorraGameHistoryPlayer {
  name: string
  cn: number
  move: number
}

export default class MorraGame extends OneTurnGame<MorraClient, MorraGameHistory> {
  public modeInverted = $state(false)
  public modeAddRandom = $state(false)
  public modeTeams = $state(0)

  public pendingMove = $state(0)

  protected override readonly playersSortProps = [
    (p: MorraClient) => p.streak,
    (p: MorraClient) => p.wins - p.losses,
    (p: MorraClient) => p.wins,
  ]

  constructor (chat: ChatState, private readonly roundStartWithCurrentPlayer: () => void) {
    super(chat)
  }

  sendMove (n: number): void {
    this.room?.send(new ByteWriter()
      .putInt(TurnC2S.MOVE)
      .putFloat64(n)
      .toArray()
    )
  }

  protected override processMoveConfirm (m: ByteReader): void {
    this.pendingMove = m.getFloat64()
  }

  protected override processRoundStart (_: ByteReader): void {
    if (this.clients.get(this.myCn)?.inRound) {
      this.roundStartWithCurrentPlayer()
    }
  }

  protected processEndRound (m: ByteReader): void {
    const teamCount = Math.min(m.getInt(), this.clients.size)
    const moveSum = m.getFloat64()
    const moveRnd = m.getInt()
    const playerCount = Math.min(m.getInt(), this.clients.size)
    const inverted = this.modeInverted
    const winner = moveSum % teamCount

    const gameHistoryEntry: MorraGameHistory = {
      playerCount,
      moveSum,
      moveRnd,
      winner,
      inverted,
      teams: Array(teamCount).fill(false).map((_, id) => ({
        id,
        winner: (id === winner) !== inverted,
        moveSum: 0,
        players: [] as MorraGameHistoryPlayer[]
      })),
    }

    for (let i = 0; i < playerCount; i++) {
      const cn = m.getInt()
      if (cn < 0) break
      const move = m.getFloat64()

      const p = this.clients.get(cn)
      if (!p) continue

      const team = i % teamCount
      const teamObj = gameHistoryEntry.teams[team]

      if (teamObj.winner) {
        p.wins++
        if (p.streak < 0) p.streak = 0
        p.streak++
      } else {
        p.losses++
        if (p.streak > 0) p.streak = 0
        p.streak--
      }
      p.total++

      teamObj.moveSum += move
      teamObj.players.push({
        name: p.name,
        cn: p.cn,
        move
      })
    }
    this.updatePlayers()
    this.addHistory(gameHistoryEntry)
  }

  protected processWelcomeMode (m: ByteReader): void {
    this.modeInverted = m.getBool()
    this.modeAddRandom = m.getBool()
    this.modeTeams = m.getInt()
  }

  protected processWelcomePlayer (m: ByteReader, p: MorraClient): void {
    p.wins = m.getInt()
    p.losses = m.getInt()
    p.total = p.wins + p.losses
    p.streak = m.getInt()
  }

  protected playerResetStats (p: MorraClient): void {
    p.wins = 0
    p.losses = 0
    p.total = 0
    p.streak = 0
  }

  protected makePlayer (): MorraClient {
    return {
      ...OneTurnGame.DEFAULT_PLAYER,
      wins: 0,
      losses: 0,
      total: 0,
      streak: 0,
    }
  }
}
