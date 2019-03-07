export const roomCreateOptions = [
  ['optDecks', 'i', 1, 'Decks', 'number of decks', 1, 166799986198907],
  ['optJokers', 'i', 2, 'Jokers', 'number of jokers per deck', 0, 2],
  ['optRevolution', 'e', 0, 'Revolutions',
    'when 4 or more cards of the same value are played at once (and selected condition), rankings are reversed (except jokers) for the round', [
    'off',
    'on, strict (no jokers)',
    'on, relaxed (any 4 are non-joker)',
    'on, jokers (any)'
  ]],
  ['optRevEndTrick', 'b', false, 'Revolution ends trick', 'a revolution ends the current trick and starts a new one'],
  ['opt1Fewer2', 'b', true, 'One fewer 2', ''],
  ['optPlayAfterPass', 'b', false, 'Play after pass', 'skip instead of pass'],
  ['optEqualize', 'e', 1, 'Equalize', '', ['disallow', 'allow', 'equalize or skip', 'equalize or pass', 'force skip (next player skips)']],
  ['optEqualizeEndTrick', 'e', 0, 'Equalize End Trick', 'equalizing lets the next player start a new trick if current player is', ['off', 'scum', 'all']],
  ['optEqualizeOnlyScum', 'b', false, 'Equalize only by scum', 'only scum can equalize'],
  ['optFirstTrick', 'e', 0, 'First Trick', 'who starts it?', ['Scum', 'President', 'Random']],
  ['opt4inARow', 'b', false, '4-in-a-row', 'if 4 or more cards of the same rank are played (possibly by equalizing), next player starts a new trick'],
  ['opt8', 'b', false, '8-rule', 'if 8 is played, current player starts a new trick'],
  ['optSingleTurn', 'b', false, 'Single turn', 'treat as passed after playing, player before starter of current trick starts next trick'],
  ['optPenalizeFinal2', 'b', false, 'Penalize final 2', 'playing 2 as last card demotes to scum'],
  ['optPenalizeFinalJoker', 'b', false, 'Penalize final joker', 'playing joker as last card demotes to scum'],
] as const

export interface PresidentOptions {
  decks: number
}

export function getGameModeString (options: PresidentOptions): string {
  return 'TODO'
}
