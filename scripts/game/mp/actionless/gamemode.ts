export const roomCreateOptions = [
  ['optIndependent', 'b', false, 'Independent', 'players or teams win/lose independently of each other'],
  ['optTeams', 'i', 0, 'Teams', 'number of teams players are randomly assigned to every game', 0, 45],
] as const

export function getGameModeString (independent: boolean, team: number): string {
  return (independent ? 'Independent ' : 'One-Winner ') + (team ? team + ' Teams' : 'FFA')
}
