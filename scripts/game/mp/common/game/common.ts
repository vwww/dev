import { ByteReader } from './ByteReader'

export const MAX_PLAYERS = 64
export function filterCN(cn: number): number {
  return cn & 63
}
export function filterName(name: string): string {
  name = name.replace(/[^a-zA-Z_ ]/, '').replace(/ {2,}/, ' ').trim().slice(0, 20)
  return name || 'unnamed'
}

export function logBugReportInstructions() {
  const sampleMsg = new ByteReader(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]))

  console.log('%cMultiplayer Game Bug Report Guide', 'font-family:helvetica; font-size:20px')
  console.log("You're probably trying to debug a network error or file a bug report for it.")
  console.log('If you see an error like this, your report must contain the packet values:')
  console.log('example', sampleMsg.debugBuf, sampleMsg)
  console.log('In the example above, you would have to submit at least [0, 1, 2, 3, 4, 5, 6, 7] (expand stuff as needed)')
}

export function sortAndRankPlayers<P extends { cn: number; active: boolean; rank: number }>(players: P[], playerSortProps: ((p: P) => (number | string))[]): P[] {
  const cmpPlayers = (a: P, b: P): number => {
    for (const prop of [(p: P) => p.active, ...playerSortProps]) {
      const aV = prop(a)
      const bV = prop(b)
      if (aV < bV) {
        return 1
      } else if (aV > bV) {
        return -1
      }
    }
    return a.cn - b.cn
  }

  const sortedPlayers = players.filter(Boolean).sort(cmpPlayers)

  // Update ranks
  let rank = 1
  sortedPlayers.forEach((p, i) => {
    if (i) {
      // standard competition ranking (1224)
      const prevPlayer = sortedPlayers[i - 1]
      if (playerSortProps.some((prop) => prop(p) !== prop(prevPlayer))) {
        rank = i + 1
      }
    }
    sortedPlayers[i].rank = rank
  })

  return sortedPlayers
}

interface GameClient {
  name: string
  cn: number
}

export function formatPlayerName (client?: GameClient, cn?: number) {
  return client ? `${client.name} (${client.cn})` : ('<unknown>' + (cn === undefined ? '' : ` (${cn})`))
}
