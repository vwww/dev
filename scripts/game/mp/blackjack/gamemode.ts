export const roomCreateOptions = [
  ['optInverted', 'b', false, 'Inverted', 'negate balance changes'],
  ['opt21', 'b', false, 'Simple', 'only hit and stand'],
  ['optDecks', 'i', 1, 'Decks', 'number of decks, 9 is treated as infinity (increases house edge)', 1, 9],
  ['optDealerHitSoft', 'b', true, 'Dealer Hits on Soft 17', '(increases house edge)'],
  ['optDealerPeek', 'b', true, 'Dealer Peek', 'dealer peeks and, after early surrender, ends the game immediately if there is a blackjack (decreases house edge)'],
  ['optDouble', 'e', 0, 'Double', 'doubling is allowed for hand values of (later options increase house edge)', [
    'any',
    '9 to 11',
    '10 or 11',
  ]],
  ['optDoubleAfterSplit', 'b', true, 'Double After Split', '(decreases house edge)'],
  ['optSurrender', 'e', 1, 'Surrender', 'when is surrendering allowed?', [
    'off',
    'late (no blackjack)',
    'early non-ace (not showing ace)',
    'early (always)',
  ]],
  ['optSplitNonAce', 'i', 3, 'Split Non-Ace', 'pairs of 2 to 10 can be split N times to make N+1 hands (decreases house edge)', 0, 3],
  ['optSplitAce', 'i', 1, 'Split Ace', 'pairs of aces can be split N times to make N+1 hands (decreases house edge)', 0, 3],
  ['optHitSplitAce', 'b', true, 'Hit Split Ace', 'if hit with a 10, the blackjack is not a "natural" blackjack (decreases house edge)'],
] as const

export function getGameModeString (): string {
  return 'TODO'
}
