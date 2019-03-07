import { getDefaultOptions, type GamemodeFromOptions } from '@gmc/RoomOption'

export const roomCreateOptions = [
  ['optInverted', 'b', false, 'Inverted', 'switch winning and losing'],
  ['optAddRandom', 'b', false, 'Random', 'add a random number to the result'],
  ['optTeams', 'i', 0, 'Teams', 'number of teams', 0, 45],
] as const

export type MorraMode = GamemodeFromOptions<typeof roomCreateOptions>

export function defaultMode (): MorraMode {
  return getDefaultOptions(roomCreateOptions)
}

export function getGameModeString ({ optInverted, optAddRandom, optTeams }: MorraMode): string {
  return (optInverted ? 'Inverted ' : '') + (optAddRandom ? 'Randomized ' : '') + (optTeams ? optTeams + '-team' : 'FFA')
}
