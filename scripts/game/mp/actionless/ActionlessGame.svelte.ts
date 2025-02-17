import { ByteReader } from '@gmc/game/ByteReader'
import { type OneTurnClient, OneTurnGame } from '@gmc/game/OneTurnGame'

interface AClient extends OneTurnClient {
  wins: number
  losses: number
  total: number
  streak: number
}

export interface AGameHistory {
  playerCount: number
  wins: AGameHistoryWin[]
}

interface AGameHistoryWin {
  id: number
  win: boolean
  players: AGameHistoryWinPlayer[]
}

interface AGameHistoryWinPlayer {
  name: string
  cn: number
}

export default class AGame extends OneTurnGame<AClient, AGameHistory> {
  public modeIndependent = $state(false)
  public modeTeam = $state(0)

  protected override readonly playersSortProps = [
    (p: AClient) => p.streak,
    (p: AClient) => p.wins - p.losses,
    (p: AClient) => p.wins,
  ]

  protected processMoveConfirm (m: ByteReader): void { /* ignore */ }

  protected processEndRound (m: ByteReader): void {
    const winCount = m.getInt()
    const wins = Array(winCount).fill(false).map(() => m.getBool())
    const playerCount = Math.min(m.getInt(), this.clients.size)

    const gameHistoryEntry = {
      playerCount,
      wins: wins.map((w, i) => ({
        id: i,
        win: w,
        players: [] as AGameHistoryWinPlayer[]
      }))
    }

    for (let i = 0; i < playerCount; i++) {
      const cn = m.getInt()
      const p = this.clients.get(cn)
      if (!p) continue

      const win = i % winCount
      if (wins[win]) {
        p.wins++
        if (p.streak < 0) p.streak = 0
        p.streak++
      } else {
        p.losses++
        if (p.streak > 0) p.streak = 0
        p.streak--
      }
      p.total++

      gameHistoryEntry.wins[win].players.push({
        name: p.name,
        cn: p.cn
      })
    }
    this.updatePlayers()
    this.addHistory(gameHistoryEntry)
  }

  protected processWelcomeMode (m: ByteReader): void {
    this.modeIndependent = m.getBool()
    this.modeTeam = m.getInt()
  }

  protected processWelcomePlayer (m: ByteReader, p: AClient): void {
    p.wins = m.getInt()
    p.losses = m.getInt()
    p.total = p.wins + p.losses
    p.streak = m.getInt()
  }

  protected playerResetStats (p: AClient): void {
    p.wins = 0
    p.losses = 0
    p.total = 0
    p.streak = 0
  }

  protected makePlayer (): AClient {
    return {
      ...OneTurnGame.DEFAULT_PLAYER,
      wins: 0,
      losses: 0,
      total: 0,
      streak: 0
    }
  }
}
