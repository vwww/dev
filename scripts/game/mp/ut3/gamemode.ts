import { getDefaultOptions, type GamemodeFromOptions } from '@gmc/RoomOption'

export const roomCreateOptions = [
  ['optTurnTime', 'i', 15000, 'Turn Time / ms', 'duration of each turn, in milliseconds', 5000, 60000],
  ['optInverted', 'b', false, 'Inverted', 'switch winning and losing'],
  ['optChecked', 'b', false, 'Checked', 'disallow obviously bad moves'],
  ['optQuick', 'b', false, 'Quick', 'capture one small board to win'],
  ['optAnyBoard', 'b', false, 'Open', 'move in any board'],
] as const

export type UT3Mode = GamemodeFromOptions<typeof roomCreateOptions>

export function defaultMode (): UT3Mode {
  return getDefaultOptions(roomCreateOptions)
}

export function getGameModeString (mode: UT3Mode): string {
  const adjectives = [
    mode.optInverted && 'inverted',
    mode.optChecked && 'checked',
    mode.optQuick && 'quick',
    mode.optAnyBoard && 'open',
  ].filter((x) => x)

  return `${adjectives.length ? adjectives.join(' ') : 'standard'} ${mode.optTurnTime}ms`
}
