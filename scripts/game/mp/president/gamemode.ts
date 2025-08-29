import { getDefaultOptions, type GamemodeFromOptions } from '@gmc/RoomOption'

export const roomCreateOptions = [
  ['optTurnTime', 'i', 20000, 'Turn Time / ms', 'duration of each turn, in milliseconds', 5000, 60000],
  ['optDecks', 'I', 1, 'Decks', 'number of decks', 1, 2251799813685248],
  ['optJokers', 'i', 2, 'Jokers', 'number of jokers per deck', 0, 2],
  ['optKeepJokers', 'b', false, 'Keep Jokers', 'Scum and HS keep jokers during card transfer'],
  ['optMustGiveLowest', 'b', false, 'Must give lowest', 'President and VP must give lowest cards during card transfer'],
  ['optRev', 'e', 0, 'Revolutions',
    'combo of 4 or more cards (and selected condition) reverses rankings', [
    'off',
    'on, strict (no jokers)',
    'on, relaxed (any 4 are non-joker)',
    'on, jokers (any)'
  ]],
  ['optRevEndTrick', 'b', false, 'Revolution ends trick', 'a revolution ends the current trick and starts a new one'],
  ['opt1Fewer2', 'b', true, 'One fewer 2', ''],
  ['optPass', 'e', 1, 'Pass', '', ['pass turn', 'pass trick', 'single turn']],
  ['optEqualize', 'e', 1, 'Equalize', '', ['disallow', 'allow', 'equalize or skip', 'equalize or pass', 'force skip (next player skips)']],
  ['optEqualizeEndTrickByScum', 'b', false, 'Equalize end trick by Scum', 'trick ends if Scum equalizes'],
  ['optEqualizeEndTrickByOthers', 'b', false, 'Equalize end trick by non-Scum', 'trick ends if others equalize'],
  ['optEqualizeOnlyScum', 'b', false, 'Equalize only by Scum', 'only Scum can equalize'],
  ['opt4inARow', 'b', false, '4-in-a-row', '4 or more cards of the same rank (including equalizing) ends trick'],
  ['opt8', 'b', false, '8-rule', 'rank 8 ends trick'],
  ['optPenalizeFinal2', 'b', false, 'Penalize final 2', 'playing 2 as last card incurs rank penalty'],
  ['optPenalizeFinalJoker', 'b', false, 'Penalize final joker', 'playing joker as last card incurs rank penalty'],
  ['optFirstTrick', 'e', 0, 'First Trick', 'who starts?', ['Scum', 'President', 'Random']],
] as const

export type PresidentMode = GamemodeFromOptions<typeof roomCreateOptions>

export function defaultMode (): PresidentMode {
  return getDefaultOptions(roomCreateOptions)
}

export function getGameModeString (mode: PresidentMode): string {
  return (
    mode.optTurnTime + '/' +
    mode.optDecks + '/' +
    mode.optJokers +
    (mode.optKeepJokers ? 'J' : 'j') +
    (mode.optMustGiveLowest ? 'G' : 'g') +
    mode.optRev +
    (mode.optRevEndTrick ? 'R' : 'r') +
    (mode.opt1Fewer2 ? 'T' : 't') +
    mode.optPass +
    mode.optEqualize +
    (mode.optEqualizeEndTrickByScum ? 'E' : 'e') +
    (mode.optEqualizeEndTrickByOthers ? 'E' : 'e') +
    (mode.optEqualizeOnlyScum ? 'E' : 'e') +
    (mode.opt4inARow ? 'F' : 'f') +
    (mode.opt8 ? 'B' : 'b') +
    (mode.optPenalizeFinal2 ? 'P' : 'p') +
    (mode.optPenalizeFinalJoker ? 'P' : 'p') +
    mode.optFirstTrick
  )
}
