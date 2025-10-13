import { getDefaultOptions, type GamemodeFromOptions } from '@gmc/RoomOption'

export const roomCreateOptions = [
  ['optTurnTime', 'i', 20000, 'Turn Time / ms', 'duration of each turn, in milliseconds', 5000, 60000],
  ['optSpeed', 'b', true, 'Speed', 'all players move at once'],
  ['optInverted', 'b', false, 'Inverted', 'negate balance changes'],
  ['optDecks', 'i', 1, 'Decks', 'number of decks, 0 is treated as infinity (increases house edge)', 0, 255],
  ['optDealerHitSoft', 'b', true, 'Dealer Hits on Soft 17', '(increases house edge)'],
  ['optDealerPeek', 'b', true, 'Dealer Peek', 'dealer peeks and, after early surrender, ends the game immediately if there is a blackjack (decreases house edge)'],
  ['opt21', 'b', false, 'Simple', 'only hit and stand'],
  ['optDouble', 'e', 0, 'Double', 'doubling is allowed for hand values of (later options increase house edge)', [
    'any',
    '9 to 11',
    '10 or 11',
  ]],
  ['optSplitDouble', 'b', true, 'Double After Split', '(decreases house edge)'],
  ['optSplitSurrender', 'b', false, 'Surrender After Split', '(decreases house edge)'],
  ['optSurrender', 'e', 1, 'Surrender', 'when is surrendering allowed?', [
    'off',
    'late (no blackjack)',
    'early non-ace (not showing ace)',
    'early (always)',
  ]],
  ['optSplitNonAce', 'i', 3, 'Split Non-Ace', 'pairs of 2 to 10 can be split N times to make N+1 hands (decreases house edge)', 0, 255],
  ['optSplitAce', 'i', 1, 'Split Ace', 'pairs of aces can be split N times to make N+1 hands (decreases house edge)', 0, 255],
  ['optHitSplitAce', 'b', true, 'Hit Split Ace', 'allow hit after splitting ace (decreases house edge) if hit with a 10, the blackjack is not a "natural" blackjack'],
  ['optInsurePartial', 'b', true, 'Partial Insurance', 'Allow insuring up to rather than exactly (decreases house edge)'],
  ['optInsureLate', 'b', false, 'Late Insurance', 'Move Insurance to after all players have moved (decreases house edge)'],
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
    (mode.optDealerPeek ? 'P' : 'p') +
    (mode.opt21 ? '-' :
      mode.optDouble +
      (mode.optSplitDouble ? 'A' : 'a') +
      (mode.optSplitSurrender ? 'A' : 'a') +
      mode.optSurrender +
      '/' + mode.optSplitNonAce +
      '/' + mode.optSplitAce +
      (mode.optHitSplitAce ? 'H' : '') +
      '/' +
      (mode.optInsurePartial ? 'P' : 'p') +
      (mode.optInsureLate ? 'L' : '')
    )
}
