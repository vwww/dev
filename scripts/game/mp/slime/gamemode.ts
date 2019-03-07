import { getDefaultOptions, type GamemodeFromOptions } from '@gmc/RoomOption'

export const roomCreateOptions = [
  ['optServe', 'e', 0, 'Serve',
    'who serves?', [
    'alternate',
    'winner',
    'loser',
    'random'
  ]],
  ['optIntermission', 'i', 1000, 'Intermission Time / ms', 'time after round ends, in milliseconds', 0, 3000],
] as const

export type SlimeMode = GamemodeFromOptions<typeof roomCreateOptions>

export function defaultMode (): SlimeMode {
  return getDefaultOptions(roomCreateOptions)
}

export function getGameModeString (mode: SlimeMode): string {
  return `${['alternate', 'winner', 'loser', 'random'][mode.optServe]} serve, ${mode.optIntermission / 1000}s intermission`
}
