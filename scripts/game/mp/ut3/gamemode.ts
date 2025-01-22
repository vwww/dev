export const roomCreateOptions = [
  ['optTurnTime', 'i', 15000, 'Turn Time / ms', 'duration of each turn, in milliseconds', 5000, 60000],
  ['optInverted', 'b', false, 'Inverted', 'switch winning and losing'],
  ['optChecked', 'b', false, 'Checked', 'disallow obviously bad moves'],
  ['optQuick', 'b', false, 'Quick', 'capture one small board to win'],
  ['optAnyBoard', 'b', false, 'Open', 'move in any board'],
] as const

export function getGameModeString (inverted: boolean, checked: boolean, quick: boolean, anyBoard: boolean, turnTime: number): string {
  const adjectives = [
    inverted && 'inverted',
    checked && 'checked',
    quick && 'quick',
    anyBoard && 'open',
  ].filter((x) => x)

  return `${adjectives.length ? adjectives.join(' ') : 'standard'} ${turnTime}ms`
}
