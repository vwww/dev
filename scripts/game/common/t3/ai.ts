import { checkWin, numToWinnerMap, occupied, remapWin, WinnerMap, winnerMapInvert, winnerMapToNum, WINNER_MAP_MAX } from './game'

export type MemoEntryWin = [value: number]
export type MemoEntryRegular = [bestValue: number, moves: number[], countPathForced: number, countPathUntaken: number]
export type PathCount = [total: number, p1: number, p2: number, tie: number]
export type MemoEntry = [typeDep: MemoEntryRegular[] | MemoEntryWin[], countPaths: PathCount]

export type BotAction = [moves: number[], msg: string]
export type Bot = (board: number, used: number, winnerMap: WinnerMap) => BotAction

export type PlayerType = [nameHuman: string] | [nameBot: string, bot: Bot]

export const playerTypes: PlayerType[] = [
  ['Human'],
  ['First', botMoveFirst],
  ['Random', botMoveRandom],
  ['Nice', botMoveNice],
  ['Optimal', botMoveOptimal]
]

const aiMemo: Record<number, MemoEntry> = {}

export function initMemo (): void {
  buildTables(0, 1, 0)
}

export function getMemo (state: number): MemoEntry | undefined {
  return aiMemo[state]
}

function buildTables (state: number, mark: number, depth: number): MemoEntry {
  if (aiMemo[state]) return aiMemo[state]

  const winner = checkWin(state, depth)

  const countResult: PathCount = [0, 0, 0, 0]

  let typeDep: MemoEntryRegular[] | MemoEntryWin[]

  if (winner) {
    // Terminal state

    typeDep = [...Array(WINNER_MAP_MAX).keys()].map((gameType) => {
        const win = remapWin(
          winner,
          numToWinnerMap(gameType),
        )
        const value = win === 3
          ? 0
          : win === mark
            ? 10 - depth
            : depth - 10
        return [value]
      }
    )

    countResult[0]++
    countResult[winner]++
  } else {
    // Not terminal state
    for (let i = 0; i < 9; ++i) {
      if (!occupied(state, i)) {
        const stateNext = state | (mark << (i << 1))
        const markNext = mark ^ 3
        const depthNext = depth + 1

        const countResultNext = buildTables(stateNext, markNext, depthNext)[1]

        for (let j = 0; j < 4; ++j) {
          countResult[j] += countResultNext[j]
        }
      }
    }

    typeDep = [...Array(WINNER_MAP_MAX).keys()].map((gameType): MemoEntryRegular => {
      // Pick best move with negamax
      let bestVal = -2000000000
      let moves: number[] = []

      let bestValSign = -1
      let countPathForced = 0
      let countPathUntaken = 0

      for (let i = 0; i < 9; ++i) {
        if (!occupied(state, i)) {
          const stateNext = state | (mark << (i << 1))
          const markNext = mark ^ 3
          const depthNext = depth + 1

          const opp = buildTables(stateNext, markNext, depthNext)[0][gameType]

          const val = -opp[0]

          // Update best move
          if (bestVal === val) {
            moves.push(i)
          } else if (bestVal < val) {
            bestVal = val
            moves = [i]
          }

          // Update path count
          const valSign = Math.sign(val)
          if (bestValSign < valSign) {
            bestValSign = valSign
            countPathUntaken += countPathForced
            countPathForced = 0
          }

          if (bestValSign === valSign) {
            countPathForced += opp[2] ?? 1
          } else {
            countPathUntaken += opp[2] ?? 1
          }
          countPathUntaken += opp[3] ?? 0
        }
      }

      return [bestVal, moves, countPathForced, countPathUntaken]
    })
  }

  return (aiMemo[state] = [typeDep, countResult])
}

function botGenericMessage (moves: number, used: number): string {
  return 'The bot ' +
    (moves === 1
      ? 'really had no choice'
      : 'had ' + moves + ' choices') +
    ' for move #' + used + '.'
}

function botMoveGoal (state: number, used: number, winnerMap: WinnerMap, goal: string): BotAction {
  const entry = aiMemo[state][0][winnerMapToNum(winnerMap)]

  const pendingWin = entry[0] > 0 && ((10 - entry[0] - used) >> 1)
  const moves = entry[1]!

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
