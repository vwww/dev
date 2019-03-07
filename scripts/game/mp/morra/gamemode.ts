export const roomCreateOptions = [
  ['optInverted', 'b', false, 'Inverted', 'switch winning and losing'],
  ['optAddRandom', 'b', false, 'Random', 'add a random number to the result'],
  ['optTeams', 'i', 0, 'Teams', 'number of teams', 0, 45],
] as const

export function getGameModeString (inverted: boolean, addRandom: boolean, team: number): string {
  return (inverted ? 'Inverted ' : '') + (addRandom ? 'Randomized ' : '') + (team ? team + ' Teams' : 'FFA')
}
