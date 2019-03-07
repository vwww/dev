export const roomCreateOptions = [
  ['optCount', 'e', 0, 'Count', 'how many cards can be played after the first turn in a trick?', [
    'any',
    'same',
    'nondecreasing',
    'increasing',
    'nonincreasing',
    'decreasing',
    'change',
    'single',
  ]],
  ['optRank', 'e', 0, 'Trick Rank', 'what ranks can be played after the first turn in a trick? (TODO split into more options?)', [
    'within 1',
    'within 2',
    'same',
    'change 1',
    'up 1',
    'up 2',
    'up 1 (strict)',
    'any',
  ]],
  ['optRounds', 'e', 0, 'Rounds', 'type of rounds', [
    'skip',
    'pass',
    'pass (clear)',
    'forced',
  ]],
  ['optPenalty', 'e', 0, 'Count', 'what cards go to a penalized player after a challenge?', [
    'all cards',
    'newest 3 cards',
    'oldest 3 cards',
    'random 3 cards',
  ]],
]

export function getGameModeString (count: any, rank: any, rounds: any, penalty: any): string {
  return 'TODO'
}
