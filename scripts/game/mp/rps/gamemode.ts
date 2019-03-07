
export const roomCreateOptions = [
  ['optClassic', 'b', false, 'Classic', 'no streak bonuses'],
  ['optInverted', 'b', false, 'Inverted', 'switch default winning and losing direction'],
  ['optCount', 'b', false, 'Count', 'larger group never loses to smaller group, 2x size can reverse winning direction'],
  ['optRoundTime', 'i', 5000, 'Round Time / ms', 'duration of each round, in milliseconds', 3000, 30000],
  ['optBotBalance', 'i', 0, 'Bot Balance', 'if negative, balance total players to absolute value; otherwise, add this number of bots', -1000, 1000],
]

export function getGameModeString (
  classic: boolean, inverted: boolean, count: boolean,
  roundTime: number, botBalance: number
  ): string {
  return (
    (inverted ? 'Inverted ' : '') +
    (count ? 'Count ' : '') +
    (classic ? 'Classic' : 'Regular') +
    ' (' + (botBalance > 0 ? botBalance + ' bots' : botBalance < 0 ? 'bots balance to ' + -botBalance : 'no bots') + ', ' + roundTime + ' ms)'
  )
}
