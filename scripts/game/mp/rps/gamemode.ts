import { getDefaultOptions, type GamemodeFromOptions } from '@gmc/RoomOption'

export const roomCreateOptions = [
  ['optClassic', 'b', false, 'Classic', 'no streak bonuses'],
  ['optInverted', 'b', false, 'Inverted', 'switch default winning and losing direction'],
  ['optCount', 'b', false, 'Count', 'larger group never loses to smaller group, 2x size can reverse winning direction'],
  ['optRoundTime', 'i', 5000, 'Round Time / ms', 'duration of each round, in milliseconds', 3000, 30000],
  ['optBotBalance', 'I', 0, 'Bot Balance', 'if negative, balance total players to absolute value; otherwise, add this number of bots', -9007199254740992, 9007199254740992],
] as const

export type RPSMode = GamemodeFromOptions<typeof roomCreateOptions>

export function defaultMode (): RPSMode {
  return getDefaultOptions(roomCreateOptions)
}

export function getGameModeString (mode: RPSMode): string {
  const { optBotBalance: botBalance } = mode
  return (
    (mode.optInverted ? 'Inverted ' : '') +
    (mode.optCount ? 'Count ' : '') +
    (mode.optClassic ? 'Classic' : 'Regular') +
    ' (' + (botBalance > 0 ? botBalance + ' bots' : botBalance < 0 ? 'bots balance to ' + -botBalance : 'no bots') + ', ' + mode.optRoundTime + ' ms)'
  )
}
