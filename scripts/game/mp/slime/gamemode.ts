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
  ['optSizePlayer', 'i', 100, 'Player Size / %', 'player size multiplier', 10, 400],
  ['optSizeBall', 'i', 100, 'Ball Size / %', 'ball size multiplier', 10, 1600],
  ['optSizeNet', 'i', 100, 'Net Size / %', 'net size multiplier', 0, 200],
  ['optSpeedGame', 'i', 100, 'Game Speed / %', 'game speed multiplier', 25, 800],
  ['optSpeedPlayer', 'i', 100, 'Player Speed / %', 'player speed multiplier', 25, 800],
  ['optSpeedBall', 'i', 100, 'Ball Speed / %', 'ball speed multiplier', 10, 800],
  ['optGravity', 'i', 100, 'Gravity / %', 'gravity multiplier', 10, 800],
] as const

export type SlimeMode = GamemodeFromOptions<typeof roomCreateOptions>

export function defaultMode (): SlimeMode {
  return getDefaultOptions(roomCreateOptions)
}

export function getGameModeString (mode: SlimeMode): string {
  return `${['alternate', 'winner', 'loser', 'random'][mode.optServe]} serve`
    + `, ${mode.optIntermission / 1000}s intermission`
    + `, (${mode.optSizePlayer / 100}x player`
    + `, ${mode.optSizeBall / 100}x ball`
    + `, ${mode.optSizeNet / 100}x net) size`
    + `, (${mode.optSpeedGame / 100}x game`
    + `, ${mode.optSpeedPlayer / 100}x player`
    + `, ${mode.optSpeedBall / 100}x ball) speed`
    + `, ${mode.optGravity / 100}x gravity`
}
