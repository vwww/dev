import { getDefaultOptions, type GamemodeFromOptions } from '@gmc/RoomOption'

export const roomCreateOptions = [
  ['optTurnTime', 'i', 20000, 'Turn Time / ms', 'duration of each turn, in milliseconds', 5000, 60000],
  ['optSpeed', 'b', true, 'Speed', 'all players move at once'],
  ['optInverted', 'b', false, 'Inverted', 'negate balance changes'],
  ['optDecks', 'I', 1, 'Decks', 'number of decks, 0 is treated as infinity (increases house edge)', 0, 2251799813685248],
  ['optDealerHitSoft', 'b', true, 'Dealer Hits on Soft 17', '(increases house edge)'],
  ['optDealer', 'e', 2, 'Dealer Hole Card and Peek', '(later options decrease house edge)', [
    'off',
    'on, no peek',
    'on, late surrender',
    'on, early surrender',
  ]],
  ['opt21', 'b', false, 'Simple', 'only hit and stand'],
  ['optDouble', 'e', 0, 'Double', 'doubling is allowed for hard hand values of (later options increase house edge)', [
    'any',
    '9 to 11',
    '10 or 11',
  ]],
  ['optSplitDouble', 'b', true, 'Double After Split', '(decreases house edge)'],
  ['optSplitSurrender', 'b', false, 'Surrender After Split', '(decreases house edge)'],
  ['optHitSurrender', 'b', false, 'Surrender After Hit', '(decreases house edge)'],
  ['optSurrender', 'e', 2, 'Surrender', 'when is surrendering allowed? (later options decrease house edge)', [
    'never',
    'dealer shows non-ace',
    'always',
  ]],
  ['optSplitNonAce', 'i', 3, 'Split Non-Ace', 'pairs of 2 to 10 can be split N times to make N+1 hands (decreases house edge)', 0, 254],
  ['optSplitAce', 'i', 1, 'Split Ace', 'pairs of aces can be split N times to make N+1 hands (decreases house edge) 10 with split ace is not a natural blackjack', 0, 254],
  ['optSplitAceAdd', 'b', true, 'Hit Split Ace', 'allow hit/double after splitting ace (decreases house edge)'],
  ['optInsurePartial', 'b', true, 'Partial Insurance', 'allow insuring up to rather than exactly'],
  ['optInsureLate', 'b', false, 'Late Insurance', 'offer Insurance after all players have moved'],
] as const

export type BlackjackMode = GamemodeFromOptions<typeof roomCreateOptions>

export function defaultMode (): BlackjackMode {
  return getDefaultOptions(roomCreateOptions)
}

export function getGameModeString (mode: BlackjackMode): string {
  return mode.optTurnTime + '/' +
    (mode.optSpeed ? 'S' : 's') +
    (mode.optInverted ? 'I' : 'i') +
    '/' + mode.optDecks + '/' +
    (mode.optDealerHitSoft ? 'H' : 'h') +
    mode.optDealer +
    (mode.opt21 ? '-' :
      mode.optDouble +
      (mode.optSplitDouble ? 'D' : 'd') +
      (mode.optSplitSurrender ? 'S' : 's') +
      (mode.optHitSurrender ? 'P' : 'p') +
      mode.optSurrender +
      '/' + mode.optSplitNonAce +
      '/' + mode.optSplitAce +
      (mode.optSplitAceAdd ? 'A' : '') +
      '/' +
      (mode.optInsurePartial ? 'P' : 'p') +
      (mode.optInsureLate ? 'L' : '')
    )
}
