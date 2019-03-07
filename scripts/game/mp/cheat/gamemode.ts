import { getDefaultOptions, type GamemodeFromOptions } from '@gmc/RoomOption'

export const roomCreateOptions = [
  ['optTurnTime', 'i', 20000, 'Turn Time / ms', 'duration of each turn, in milliseconds', 5000, 60000],
  ['optCallTime', 'i', 3000, 'Call Time / ms', 'guaranteed time to call cheat, in milliseconds', 2000, 10000],
  ['optDecks', 'I', 1, 'Decks', 'number of decks', 1, 2251799813685248],
  ['optCheck', 'e', 2, 'Check', 'how to resolve challenges', [
    'arbiter',
    'caller',
    'public',
    'public+',
  ]],
  ['optTricks', 'e', 0, 'Tricks', 'passing in tricks', [
    'forced (no passing)',
    'pass turn',
    'pass trick',
    'single turn',
  ]],
  ['optCountSame', 'b', true, 'Count (same)', 'can play same count as previous move'],
  ['optCountMore', 'b', true, 'Count (more)', 'can play more cards than previous move'],
  ['optCountLess', 'b', true, 'Count (less)', 'can play fewer cards than previous move, but not zero'],
  ['optCountZero', 'b', true, 'Count (zero)', 'can play zero cards'],
  ['optRankStartA', 'b', true, 'Trick Rank Start (Ace)', 'can start with Ace'],
  ['optRankStartO', 'b', true, '(others)', 'can start with rank other than Ace or King'],
  ['optRankStartK', 'b', true, '(King)', 'can start with King'],
  ['optRank0', 'b', true, 'Trick Rank Subsequent (same)', 'can play same rank as previous move'],
  ['optRank1u', 'b', true, '(up 1)', 'previous plus one, when not wrapping'],
  ['optRank1uw', 'b', true, '(up 1 wrap)', 'previous plus one, when wrapping'],
  ['optRank1d', 'b', true, '(down 1)', 'previous minus one, when not wrapping'],
  ['optRank1dw', 'b', true, '(down 1 wrap)', 'previous minus one, when wrapping'],
  ['optRank2u', 'b', false, '(up 2)', 'previous plus two, when not wrapping'],
  ['optRank2uw', 'b', false, '(up 2 wrap)', 'previous plus two, when wrapping'],
  ['optRank2d', 'b', false, '(down 2)', 'previous minus two, when not wrapping'],
  ['optRank2dw', 'b', false, '(down 2 wrap)', 'previous minus two, when wrapping'],
  ['optRankother', 'b', false, '(others)', 'other ranks not covered above'],
] as const

export type CheatMode = GamemodeFromOptions<typeof roomCreateOptions>

export function defaultMode (): CheatMode {
  return getDefaultOptions(roomCreateOptions)
}

export function getGameModeString (mode: CheatMode): string {
  const optCmp = mode.optCountLess
    ? mode.optCountSame
      ? mode.optCountMore
        ? '*'
        : '≤'
      : mode.optCountMore
        ? '≠'
        : '<'
    : mode.optCountSame
      ? mode.optCountMore
        ? '≥'
        : '='
      : '>'

  return (
    mode.optCallTime + '/' + mode.optTurnTime + '/' +
    mode.optDecks + '/' +
    mode.optCheck + '/' +
    optCmp +
    mode.optTricks +
    (mode.optRank1uw ? 'U' : 'u') +
    (mode.optRank2uw ? 'U' : 'u') +
    (mode.optRank2d ? 'D' : 'd') +
    (mode.optRank1d ? 'D' : 'd') +
    (mode.optRank0 ? 'S' : 's') +
    (mode.optRank1u ? 'U' : 'u') +
    (mode.optRank2u ? 'U' : 'u') +
    (mode.optRank2dw ? 'D' : 'd') +
    (mode.optRank1dw ? 'D' : 'd') +
    (mode.optRankother ? 'O' : 'o')
  )
}
