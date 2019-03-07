export const enum Player {
  None,
  P1,
  P2,
}

export const enum Winner {
  None,
  P1,
  P2,
  Tie,
}

export function occupied (state: number, spot: number): number {
  const spaceWeWant = 3 << (spot << 1)
  return state & spaceWeWant
}

export function checkWin (state: number, depth: number): Winner {
  if (isWin(state, !(depth & 1))) {
    return (depth & 1) ? Winner.P1 : Winner.P2
  }
  return depth === 9 ? Winner.Tie : Winner.None
}

export function isWin (state: number, p2: boolean): boolean {
  return checkPatterns(state, p2 ? patternWin2 : patternWin1)
}

export function isNearWin (state: number, p2: boolean): boolean {
  return checkPatterns(state, p2 ? patternNearWin2 : patternNearWin1, patternNearWinMask)
}

export function isFull (state: number): boolean {
  for (let i = 0; i < 9 * 2; i += 2) {
    if (!(state & (3 << i))) {
      return false
    }
  }
  return true
}

export type WinnerMap = [Winner, Winner, Winner]
export const WINNER_MAP_MAX = 27

export function remapWin (winner: Winner, winnerMap: WinnerMap): Winner {
  return winner ? winnerMap[winner - 1] : winner
}

export function numToWinnerMap (gameType: number): WinnerMap {
  return [
    1 + (gameType % 3),
    1 + (((gameType / 3) | 0) % 3),
    1 + (((gameType / 9) | 0) % 3),
  ]
}

export function winnerMapToNum (winnerMap: WinnerMap): number {
  return winnerMap.reduceRight((accum, cur) => (cur - 1) + 3 * accum, 0)
}

export function winnerMapInvert (winnerMap: WinnerMap): WinnerMap {
  return winnerMap.map((w) => w < Winner.Tie ? w ^ 3 : w) as WinnerMap
}

function checkPatterns (board: number, patterns: number[], masks: number[] = patterns): boolean {
  // assert(masks.length === patterns.length)
  return patterns.some((pattern, index) => pattern === (board & masks[index]))
}

// Player 1 wins
const patternWin1 = [
  // horizontal
  0b010101_000000_000000,
  0b000000_010101_000000,
  0b000000_000000_010101,
  // vertical
  0b010000_010000_010000,
  0b000100_000100_000100,
  0b000001_000001_000001,
  // diagonals
  0b010000_000100_000001,
  0b000001_000100_010000
]
// Player 2 wins
const patternWin2 = [
  // horizontal
  0b101010_000000_000000,
  0b000000_101010_000000,
  0b000000_000000_101010,
  // vertical
  0b100000_100000_100000,
  0b001000_001000_001000,
  0b000010_000010_000010,
  // diagonals
  0b100000_001000_000010,
  0b000010_001000_100000
]

const patternNearWinMask = [ // Which squares will be checked?
  // horizontal
  0b111111_000000_000000,
  0b111111_000000_000000,
  0b111111_000000_000000,
  0b000000_111111_000000,
  0b000000_111111_000000,
  0b000000_111111_000000,
  0b000000_000000_111111,
  0b000000_000000_111111,
  0b000000_000000_111111,
  // vertical
  0b110000_110000_110000,
  0b110000_110000_110000,
  0b110000_110000_110000,
  0b001100_001100_001100,
  0b001100_001100_001100,
  0b001100_001100_001100,
  0b000011_000011_000011,
  0b000011_000011_000011,
  0b000011_000011_000011,
  // diagonals
  0b110000_001100_000011,
  0b110000_001100_000011,
  0b110000_001100_000011,
  0b000011_001100_110000,
  0b000011_001100_110000,
  0b000011_001100_110000,
]

const patternNearWin1 = [ // Player 1 can win on the next move
  // horizontal
  0b000101_000000_000000,
  0b010001_000000_000000,
  0b010100_000000_000000,
  0b000000_000101_000000,
  0b000000_010001_000000,
  0b000000_010100_000000,
  0b000000_000000_000101,
  0b000000_000000_010001,
  0b000000_000000_010100,
  // vertical
  0b000000_010000_010000,
  0b010000_000000_010000,
  0b010000_010000_000000,
  0b000000_000100_000100,
  0b000100_000000_000100,
  0b000100_000100_000000,
  0b000000_000001_000001,
  0b000001_000000_000001,
  0b000001_000001_000000,
  // diagonals
  0b000000_000100_000001,
  0b010000_000000_000001,
  0b010000_000100_000000,
  0b000000_000100_010000,
  0b000001_000000_010000,
  0b000001_000100_000000,
]

const patternNearWin2 = [ // Player 2 can win on the next move
  // horizontal
  0b001010_000000_000000,
  0b100010_000000_000000,
  0b101000_000000_000000,
  0b000000_001010_000000,
  0b000000_100010_000000,
  0b000000_101000_000000,
  0b000000_000000_001010,
  0b000000_000000_100010,
  0b000000_000000_101000,
  // vertical
  0b000000_100000_100000,
  0b100000_000000_100000,
  0b100000_100000_000000,
  0b000000_001000_001000,
  0b001000_000000_001000,
  0b001000_001000_000000,
  0b000000_000010_000010,
  0b000010_000000_000010,
  0b000010_000010_000000,
  // diagonals
  0b000000_001000_000010,
  0b100000_000000_000010,
  0b100000_001000_000000,
  0b000000_001000_100000,
  0b000010_000000_100000,
  0b000010_001000_000000,
]
