export const roomCreateOptions = [
  ['optDecks', 'i', 1, 'Decks', 'number of decks', 1, 166799986198907],
  ['optCountSame', 'b', true, 'Count (same)', 'can play same count as previous move'],
  ['optCountMore', 'b', true, 'Count (more)', 'can play more cards than previous move'],
  ['optCountLess', 'b', true, 'Count (less)', 'can play fewer cards than previous move'],
  ['optTricks', 'e', 0, 'Tricks', 'type of tricks', [
    'skip',
    'pass',
    'forced',
  ]],
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
] as const

export interface CheatOptions {
  decks: number
  countSame: boolean
  countMore: boolean
  countLess: boolean
  tricks: number // OptRound
  rank0: boolean
  rank1u: boolean
  rank1uw: boolean
  rank1d: boolean
  rank1dw: boolean
  rank2u: boolean
  rank2uw: boolean
  rank2d: boolean
  rank2dw: boolean
  rankother: boolean
}

export function getGameModeString (options: CheatOptions): string {
  return (options.decks +
    (options.countLess ? 'L' : 'l') +
    (options.countSame ? 'S' : 's') +
    (options.countMore ? 'M' : 'm') +
    options.tricks +
    (options.rank1uw ? 'U' : 'u') +
    (options.rank2uw ? 'U' : 'u') +
    (options.rank2d ? 'D' : 'd') +
    (options.rank1d ? 'D' : 'd') +
    (options.rank0 ? 'S' : 's') +
    (options.rank1u ? 'U' : 'u') +
    (options.rank2u ? 'U' : 'u') +
    (options.rank2dw ? 'D' : 'd') +
    (options.rank1dw ? 'D' : 'd') +
    (options.rankother ? 'O' : 'o')
  )
}
