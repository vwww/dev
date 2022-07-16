export const roomCreateOptions = [
  ['optTurnTime', 'i', 20000, 'Turn Time / ms', 'duration of each turn, in milliseconds', 5000, 60000],
  ['optDecks', 'i', 1, 'Decks', 'number of decks to use', 1, 3],
]

export function getGameModeString (optDecks: number): string {
  return optDecks === 1 ? '1 deck' : optDecks + ' decks'
}

export function playerColor (isMe: boolean): string {
  return isMe ? 'primary' : 'secondary'
}
