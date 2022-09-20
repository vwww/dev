import { valueStore } from '../../../util/svelte'
import { ByteReader } from '../common/game/ByteReader'
import { ByteWriter } from '../common/game/ByteWriter'
import { OneTurnClient, OneTurnGame } from '../common/game/OneTurnGame'
import { TurnC2S } from '../common/game/TurnBasedGame'

interface RPSClient extends OneTurnClient {
  roundScore: number
  roundStreak: number

  roundWins: number
  roundLosses: number
  roundTies: number

  battleWins: number
  battleLosses: number
  battleTies: number
}

export interface RPSGameHistory {
  local?: RPSGameHistoryLocal
  outcomes: number3
  count: number3
  botCount: number3
  moves: RPSGameHistoryMove[]
  detRandBits: number
}

interface RPSGameHistoryLocal {
  move: number
  battleLTW: number3
  newStreak: number
}

interface RPSGameHistoryMove {
  ltw: number3
  players: RPSGameHistoryPlayer[]
}

interface RPSGameHistoryPlayer {
  name: string
  cn: number
}

export default class RPSGame extends OneTurnGame<RPSClient, RPSGameHistory> {
  public readonly modeClassic = valueStore(false)
  public readonly modeInverted = valueStore(false)
  public readonly modeCount = valueStore(false)
  public readonly modeRoundTime = valueStore(0)
  public readonly modeBotBalance = valueStore(0)

  public readonly pendingMove = valueStore(0)

  protected playersSortProps = [
    (p: RPSClient) => p.roundStreak,
    (p: RPSClient) => p.roundWins - p.roundLosses,
    (p: RPSClient) => p.roundWins,
    (p: RPSClient) => p.battleWins - p.battleLosses,
    (p: RPSClient) => p.battleWins,
  ]

  protected ROUND_TIME = 0 // set by mode

  sendMove (n: number): void {
    this.room?.send(new ByteWriter()
      .putInt(TurnC2S.MOVE)
      .putInt(n)
      .toArray()
    )
  }

  protected processMoveConfirm (m: ByteReader): void {
    this.pendingMove.set(m.getInt())
  }

  protected processEndRound (m: ByteReader): void {
    const detRandBits = m.getInt()
    const outcomes: number3 = [filterOutcome(m.getInt()), filterOutcome(m.getInt()), filterOutcome(m.getInt())]
    const count: number3 = [m.getFloat64(), m.getFloat64(), m.getFloat64()]
    const botCount = count.slice() as number3
    const modeClassic = this.modeClassic.get()
    const humanCount = Math.min(m.getInt(), this.clients.size)

    const ltw = calculateLTW(count, outcomes)

    const moves = ltw.map((x) => ({
      ltw: x,
      players: [] as RPSGameHistoryPlayer[],
    }))

    let localEntry: RPSGameHistoryLocal | undefined
    for (let i = 0; i < humanCount; i++) {
      const cn = m.getInt()
      const move = m.getInt()

      if (!(this.clients.has(cn) && (0 <= move && move < 3))) continue

      const p = this.clients.get(cn)
      if (!p) continue

      botCount[move]--
      moves[move].players.push({
        name: p.name,
        cn: p.cn,
      })

      const battleLTW = ltw[move]
      p.battleLosses += battleLTW[0]
      p.battleTies += battleLTW[1]
      p.battleWins += battleLTW[2]

      if (battleLTW[2] > battleLTW[0]) {
        p.roundWins++
        if (p.roundStreak < 0) p.roundStreak = 0
        p.roundStreak++
        p.roundScore += p.roundStreak > 2 && !modeClassic ? p.roundStreak - 1 : 1
      } else if (battleLTW[2] < battleLTW[0]) {
        p.roundLosses++
        if (p.roundStreak > 0) p.roundStreak = 0
        p.roundStreak--
        p.roundScore--
      } else {
        p.roundTies++
      }

      if (cn === this.myCn) {
        localEntry = {
          move,
          battleLTW,
          newStreak: p.roundStreak,
        }
      }
    }

    const gameHistoryEntry: RPSGameHistory = {
      local: localEntry,
      outcomes,
      count,
      botCount,
      moves,
      detRandBits,
    }
    this.updatePlayers()
    this.addHistory(gameHistoryEntry)
  }

  protected processWelcomeMode (m: ByteReader): void {
    this.modeClassic.set(m.getBool())
    this.modeInverted.set(m.getBool())
    this.modeCount.set(m.getBool())
    this.modeRoundTime.set(this.ROUND_TIME = m.getInt())
    this.modeBotBalance.set(m.getInt())
  }

  protected processWelcomePlayer (m: ByteReader, p: RPSClient): void {
    p.roundScore = m.getInt()
    p.roundStreak = m.getInt()
    p.roundWins = m.getInt()
    p.roundLosses = m.getInt()
    p.roundTies = m.getInt()
    p.battleWins = m.getFloat64()
    p.battleLosses = m.getFloat64()
    p.battleTies = m.getFloat64()
  }

  protected playerResetStats (p: RPSClient): void {
    p.roundScore = 0
    p.roundStreak = 0
    p.roundWins = 0
    p.roundLosses = 0
    p.roundTies = 0
    p.battleWins = 0
    p.battleLosses = 0
    p.battleTies = 0
  }

  protected makePlayer (): RPSClient {
    return {
      ...OneTurnGame.DEFAULT_PLAYER,
      roundScore: 0,
      roundStreak: 0,
      roundWins: 0,
      roundLosses: 0,
      roundTies: 0,
      battleWins: 0,
      battleLosses: 0,
      battleTies: 0,
    }
  }
}

function filterOutcome (o: number): number {
  return o < 0 ? -1 : o > 0 ? 1 : 0
}

type number3 = [number, number, number]

function calculateLTW (count: number3, battleResults: number3): [number3, number3, number3] {
  const ltw: [number3, number3, number3] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
  for (let i = 0; i < 3; i++) {
    if (count[i]) {
      ltw[i][1] += count[i] - 1
      ltw[i][1 + battleResults[i]] += count[(i + 1) % 3]
      ltw[i][1 - battleResults[(i + 2) % 3]] += count[(i + 2) % 3]
    }
  }
  return ltw
}
