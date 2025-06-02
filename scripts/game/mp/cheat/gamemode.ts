import { getDefaultOptions, type GamemodeFromOptions } from '@gmc/RoomOption'

export const roomCreateOptions = [
  ['optTurnTime', 'i', 20000, 'Turn Time / ms', 'duration of each turn, in milliseconds', 5000, 60000],
  ['optCallTime', 'i', 5000, 'Call Time / ms', 'guaranteed time to call cheat, in milliseconds', 2000, 10000],
  ['optDecks', 'I', 1, 'Decks', 'number of decks', 1, 166799986198907],
  ['optCheck', 'e', 0, 'Check', 'how to resolve challenges', [
    'arbiter',
    'caller',
    'public',
    'public+',
  ]],
  ['optCountSame', 'b', true, 'Count (same)', 'can play same count as previous move'],
  ['optCountMore', 'b', true, 'Count (more)', 'can play more cards than previous move'],
  ['optCountLess', 'b', true, 'Count (less)', 'can play fewer cards than previous move'],
  ['optRank0', 'b', true, 'Trick Rank (same)', 'can play same rank as previous move'],
  ['optRank1u', 'b', true, 'Trick Rank (up 1)', 'previous plus one, when not wrapping'],
  ['optRank1uw', 'b', true, 'Trick Rank (up 1 wrap)', 'previous plus one, when wrapping'],
  ['optRank1d', 'b', true, 'Trick Rank (down 1)', 'previous minus one, when not wrapping'],
  ['optRank1dw', 'b', true, 'Trick Rank (down 1 wrap)', 'previous minus one, when wrapping'],
  ['optRank2u', 'b', false, 'Trick Rank (up 2)', 'previous plus two, when not wrapping'],
  ['optRank2uw', 'b', false, 'Trick Rank (up 2 wrap)', 'previous plus two, when wrapping'],
  ['optRank2d', 'b', false, 'Trick Rank (down 2)', 'previous minus two, when not wrapping'],
  ['optRank2dw', 'b', false, 'Trick Rank (down 2 wrap)', 'previous minus two, when wrapping'],
  ['optRankother', 'b', false, 'Trick Rank (others)', 'other ranks not covered above'],
  ['optTricks', 'e', 0, 'Tricks', 'type of tricks', [
    'skip',
    'pass',
    'forced',
  ]],
] as const

export type CheatMode = GamemodeFromOptions<typeof roomCreateOptions>

export function defaultMode (): CheatMode {
  return getDefaultOptions(roomCreateOptions)
}

export function getGameModeString (mode: CheatMode): string {
  return (mode.optDecks +
    (mode.optCountLess ? 'L' : 'l') +
    (mode.optCountSame ? 'S' : 's') +
    (mode.optCountMore ? 'M' : 'm') +
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
