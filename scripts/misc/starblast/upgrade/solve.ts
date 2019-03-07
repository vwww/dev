type UpgradeCell = [factor: number, time: number, timeNext: number, timeMax: number, predecessor: number, regen: number, damage: number]
type UpgradeInfo = {
  bestTimeMax: number
  bestNextTierPaths: string[]
  bestMaxPaths: string[]
  table: UpgradeCell[][]
}

export function solve (lvl: number, regen0: number, regen1: number, damage0: number, damage1: number): UpgradeInfo {
  const origFactor = Math.min(regen0, damage0)
  const table: UpgradeCell[][] = []

  function lerp (a: number, b: number, t: number): number { return a + (b - a) * t }

  for (let d = 0; d <= lvl; d++) {
    const damage = lerp(damage0, damage1, d / lvl)
    const resultRow: UpgradeCell[] = []

    for (let r = 0; r <= lvl; r++) {
      const regen = lerp(regen0, regen1, r / lvl)
      const f = Math.min(regen, damage) / origFactor

      let time = 0
      let predecessor = 0

      if (d) {
        const prevCell = table[d - 1][r]
        time = prevCell[2]
        predecessor = 2
      }

      if (r) {
        const prevCell = resultRow[r - 1]
        const t = prevCell[2]
        if (!predecessor || t < time) {
          time = t
          predecessor = 1
        } else if (t === time) {
          predecessor = 3
        }
      }

      const timeNext = time + 1 / f
      const timeMax = time + 4 * lvl / f // 20LL / 5L = 4L
      resultRow.push([f, time, timeNext, timeMax, predecessor, regen, damage])
    }

    table.push(resultRow)
  }

  const bestTimeMax = Math.min(...table.map((row) => Math.min(...row.map((cell) => cell[3]))))
  const bestNextTierPaths: string[] = []
  const bestMaxPaths: string[] = []

  function addAllPaths (target: string[], d: number, r: number, suffix: string): void {
    if (!d && !r) {
      target.push(suffix || '[no upgrade]')
      return
    }

    if (table[d][r][4] & 1) addAllPaths(target, d, r - 1, '4' + suffix)
    if (table[d][r][4] & 2) addAllPaths(target, d - 1, r, '5' + suffix)
  }

  addAllPaths(bestMaxPaths, lvl, lvl, '')

  for (let d = 0; d <= lvl; d++) {
    const row = table[d]
    for (let r = 0; r <= lvl; r++) {
      if (Math.abs(row[r][3] - bestTimeMax) < 0.001) {
        addAllPaths(bestNextTierPaths, d, r, '')
      }
    }
  }

  return {
    bestTimeMax,
    bestNextTierPaths,
    bestMaxPaths,
    table,
  }
}
