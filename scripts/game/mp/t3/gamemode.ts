import { getDefaultOptions, type GamemodeFromOptions } from '@gmc/RoomOption'

export const roomCreateOptions = [
  ['optTurnTime', 'i', 10000, 'Turn Time / ms', 'duration of each turn, in milliseconds', 1500, 20000],
  ['optInverted', 'b', false, 'Inverted', 'switch winning and losing'],
  ['optChecked', 'b', false, 'Checked', 'disallow obviously bad moves'],
  ['optQuick', 'b', false, 'Quick', 'end early for guaranteed outcomes'],
] as const

export type T3Mode = GamemodeFromOptions<typeof roomCreateOptions>

export function defaultMode (): T3Mode {
  return getDefaultOptions(roomCreateOptions)
}

export function getGameModeString (mode: T3Mode): string {
  const adjectives = [
    mode.optInverted && 'inverted',
    mode.optChecked && 'checked',
    mode.optQuick && 'quick',
  ].filter((x) => x)

  return `${adjectives.length ? adjectives.join(' ') : 'standard'} ${mode.optTurnTime}ms`
}
