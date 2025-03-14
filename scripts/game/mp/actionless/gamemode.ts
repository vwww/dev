import { getDefaultOptions, type GamemodeFromOptions } from '@gmc/RoomOption'

export const roomCreateOptions = [
  ['optIndependent', 'b', false, 'Independent', 'players or teams win/lose independently of each other'],
  ['optTeams', 'i', 0, 'Teams', 'number of teams players are randomly assigned to every game', 0, 45],
] as const

export type ActionlessMode = GamemodeFromOptions<typeof roomCreateOptions>

export function defaultMode (): ActionlessMode {
  return getDefaultOptions(roomCreateOptions)
}

export function getGameModeString ({ optIndependent, optTeams }: ActionlessMode): string {
  return (optIndependent ? 'Independent ' : 'One-Winner ') + (optTeams ? optTeams + ' Teams' : 'FFA')
}
