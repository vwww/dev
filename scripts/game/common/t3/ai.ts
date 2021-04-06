import { checkWin, numToWinnerMap, occupied, remapWin, WinnerMap, winnerMapInvert, winnerMapToNum, WINNER_MAP_MAX } from './game'

type MemoEntryWin = [number, number]
type MemoEntryRegular = [number, number, number[]]
type MemoEntry = MemoEntryRegular | MemoEntryWin

type BotAction = [number[], string]
type Bot = (board: number, used: number, winnerMap: WinnerMap) => BotAction

type PlayerType = [string] | [string, Bot]

export const playerTypes: PlayerType[] = [
  ['Human'],
  ['First', botMoveFirst],
  ['Random', botMoveRandom],
  ['Nice', botMoveNice],
  ['Optimal', botMoveOptimal]
]

const aiMemo: Record<number, MemoEntry[]> = {}

export function initMemo (): void {
  buildTables(0, 1, 0)
}

export function getMemo (state: number): MemoEntry[] | undefined {
  return aiMemo[state]
}

function buildTables (state: number, mark: number, depth: number): MemoEntry[] {
  if (aiMemo[state]) return aiMemo[state]

  const winner = checkWin(state, depth)

  return (aiMemo[state] = [...Array(WINNER_MAP_MAX).keys()].map((gameType) => {
    if (winner) {
      // Terminal state
      const win = remapWin(
        winner,
        numToWinnerMap(gameType),
      )
      const value = win === 3
        ? 0
        : win === mark
          ? 10 - depth
          : depth - 10
      return [value, 1 << (win - 1)]
    }

    // Pick best move with negamax
    let bestVal = -2000000000
    let endFlags = 0
    let moves: number[] = []

    for (let i = 0; i < 9; ++i) {
      if (!occupied(state, i)) {
        const stateNext = state | (mark << (i << 1))
        const markNext = mark ^ 3
        const depthNext = depth + 1

        const opp = buildTables(stateNext, markNext, depthNext)[gameType]

        const val = -opp[0]
        endFlags |= opp[1]

        if (bestVal === val) {
          moves.push(i)
        } else if (bestVal < val) {
          bestVal = val
          moves = [i]
        }
      }
    }

    return [bestVal, endFlags, moves]
  }))
}

function botGenericMessage (moves: number, used: number): string {
  return 'The bot ' +
    (moves === 1
      ? 'really had no choice'
      : 'had ' + moves + ' choices') +
    ' for move #' + used + '.'
}

function botMoveGoal (state: number, used: number, winnerMap: WinnerMap, goal: string): BotAction {
  const entry = aiMemo[state][winnerMapToNum(winnerMap)]

  const pendingWin = entry[0] > 0 && ((10 - entry[0] - used) >> 1)
  const moves = entry[2]!

  return [moves,
    (pendingWin
      ? pendingWin < 2
        ? `The bot is <strong>about to ${goal}</strong>. `
        : `The bot <strong>will ${goal}</strong> within ${pendingWin} moves. `
      : ''
    ) + botGenericMessage(moves.length, used + 1)
  ]
}

function botMoveOptimal (state: number, used: number, winnerMap: WinnerMap): BotAction {
  return botMoveGoal(state, used, winnerMap, 'win')
}

function botMoveNice (state: number, used: number, winnerMap: WinnerMap): BotAction {
  return botMoveGoal(state, used, winnerMapInvert(winnerMap), 'lose')
}

function botMoveFirst (state: number): BotAction {
  for (let i = 0; i < 9; ++i) {
    if (!occupied(state, i)) {
      return [[i], 'First bot always chooses the first available slot.']
    }
  }
  throw new Error('No slots left for nice bot')
}

function botMoveRandom (state: number, used: number): BotAction {
  const moves = []

  for (let i = 0; i < 9; ++i) {
    if (!occupied(state, i)) {
      moves.push(i)
    }
  }

  return [moves, botGenericMessage(moves.length, used)]
}
