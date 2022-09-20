export const roomCreateOptions = [
  ['optTurnTime', 'i', 15000, 'Turn Time / ms', 'duration of each turn, in milliseconds', 5000, 60000],
  ['optInverted', 'b', false, 'Inverted', 'switch winning and losing'],
  ['optChecked', 'b', false, 'Checked', 'disallow obviously bad moves'],
  ['optQuick', 'b', false, 'Quick', 'capture one small board to win'],
] as const

export function getGameModeString (inverted: boolean, checked: boolean, quick: boolean, turnTime: number): string {
  return `${inverted ? 'inverted ' : ''}${checked ? 'checked ' : ''}${quick ? 'quick ' : ''}${!(inverted || checked || quick) ? 'standard ' : ''}${turnTime}ms`
}
