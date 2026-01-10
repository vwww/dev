import { getDefaultOptions, type GamemodeFromOptions } from '@gmc/RoomOption'

export const roomCreateOptions = [
  ['optTurnTime', 'i', 20000, 'Turn Time / ms', 'duration of each turn, in milliseconds', 5000, 60000],
  ['optScoreTarget', 'i', 121, 'Score Target', 'game ends when this score is reached', 1, 1000],
  ['optSkipEmpty', 'b', true, 'Skip Empty', 'automatically pass (no cards)'],
  ['optSkipPass', 'b', true, 'Skip Pass', 'automatically pass (with cards but cannot play any)'],
  ['optSkipOnlyMove', 'b', false, 'Skip Only Move', 'automatically move when only one move is possible'],
  ['optPre', 'b', false, 'Pre-Show Phase', 'pause before show'],
  ['optPost', 'b', true, 'Post-Show Phase', 'pause after show, before next hand'],
] as const

export type CribbageMode = GamemodeFromOptions<typeof roomCreateOptions>

export function defaultMode (): CribbageMode {
  return getDefaultOptions(roomCreateOptions)
}

export function getGameModeString (mode: CribbageMode): string {
  return `${mode.optTurnTime / 1000}s turn`
    + `, ${mode.optScoreTarget} score target`
    + `, ${mode.optSkipEmpty ? 'skip' : 'manual'} empty`
    + `, ${mode.optSkipPass ? 'skip' : 'manual'} pass`
    + `, ${mode.optSkipOnlyMove ? 'skip' : 'manual'} only move`
    + `, ${mode.optPre ? 'with' : 'no'} pre`
    + `, ${mode.optPost ? 'with' : 'no'} post`
}
