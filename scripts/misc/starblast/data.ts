import { schemeCategory10 as colorScale } from 'd3'

import { sum } from '@/util'

import { ModEvent, ModHistory } from './history'
import { ModDataKeys } from './modinfo'

export interface Data {
  x: number
  y: number
  width: number
  height: number
  color: string
  label: string
  tooltip: string
}

function formatTimeLocal (t: number): string {
  return new Date(t).toLocaleString()
}

export function generateData (xScale: d3.ScaleTime<number, number>, modHistory: ModHistory): Data[] {
  const data: Data[] = []

  const [dStart, dEnd] = xScale.domain().map(Number)
  const width = xScale.range()[1]

  const showBars = dEnd - dStart <= 7200000 * width
  if (!showBars) {
    return [{
      x: 0,
      y: 0,
      width,
      height: 70,
      color: colorScale[1],
      label: '[zoom in to see details]',
      tooltip: '',
    }]
  }

  traverseHistory(dStart, dEnd, modHistory,
    (event) => event.add
      ? event.mod?.active
      : event.prop === 'active' /* || event.mod?.mod_id == lastModId */ || (event.mod?.active && (event.prop === 'active_duration' || event.prop === 'featured')),
    (tStart, tEnd, curHistory) => {
      const HOUR = 3600000

      const modData = curHistory.info
      const modDataRotation = modData.filter((d) => d.active && !d.featured)
      const modDataFeatured = modData.some((d) => d.active && d.featured)

      const modDataTotal = sum(modDataRotation.map((m) => m.active_duration)) * HOUR
      const firstLastColor = (modDataRotation.length % colorScale.length) === 1

      let tModStart = tStart - tStart % modDataTotal - (tStart < 0 ? modDataTotal : 0)
      let j = 0
      while (tModStart < tEnd) {
        const mod = modDataRotation[j]
        const duration = mod.active_duration * HOUR
        let tModEnd = tModStart + duration

        if (tModEnd > tStart) {
          if (tModStart < tStart && tStart > dStart) tModStart = tStart
          if (tModEnd > tEnd && tEnd < dEnd) tModEnd = tEnd

          const xStart = xScale(tModStart)
          const xEnd = xScale(tModEnd)
          const width = xEnd - xStart

          const tooltipLines = [
            mod.title,
            formatTimeLocal(tModStart),
            formatTimeLocal(tModEnd),
            ''
          ]

          for (const k of ModDataKeys) {
            if (mod[k] !== undefined) {
              tooltipLines.push(`${k}: ${k === 'date_created' ? formatTimeLocal(mod[k]) : mod[k] as string}`)
            }
          }

          const TEXT_WIDTH_ESTIMATE = 10
          data.push({
            x: xStart,
            y: 0,
            width,
            height: modDataFeatured ? 40 : 70,
            color: colorScale[j % colorScale.length + (firstLastColor && j + 1 === modDataRotation.length ? 1 : 0)],
            label:
              width >= TEXT_WIDTH_ESTIMATE * mod.title.length
                ? mod.title
                : width >= TEXT_WIDTH_ESTIMATE * mod.mod_id.length
                  ? mod.mod_id
                  : width >= 2 * TEXT_WIDTH_ESTIMATE
                    ? mod.mod_id.slice(0, width / TEXT_WIDTH_ESTIMATE - 1) + '\u2026'
                    : '',
            tooltip: tooltipLines.join('\n').trimEnd(),
          })
        }

        tModStart = tModEnd
        if (++j === modDataRotation.length) j = 0
      }
    }
  )

  // featured
  traverseHistory(dStart, dEnd, modHistory,
    (event) => event.add
      ? (event.mod?.active && event.mod.featured) ?? false
      : event.prop === 'featured' || (event.prop === 'active' && event.mod!.featured),
    (t, tEnd, curHistory) => {
      const x = xScale(t)
      const width = xScale(tEnd) - x

      const featured = curHistory.info.filter((d) => d.active && d.featured)
      if (featured.length) {
        data.push({
          x,
          y: 40,
          width,
          height: 30,
          color: '#555',
          label: featured.map((m) => m.title).join(', '),
          tooltip: '',
        })
      }
    }
  )

  return data
}

function traverseHistory (dStart: number, dEnd: number, modHistory: ModHistory,
  isEventRelevant: (e: ModEvent) => boolean | undefined,
  processRange: (a: number, b: number, cur: ModEvent, next: ModEvent) => void
): void {
  let t = dStart
  let i = modHistory.length - 2

  while (t < dEnd) {
    while (i >= 0) {
      const event = modHistory[i]

      if (event.time > t && isEventRelevant(event)) break

      i--
    }

    const tChange = i < 0 ? dEnd : modHistory[i].time

    if (tChange > t) {
      processRange(t, tChange, modHistory[i + 1], modHistory[i])
    }

    t = tChange
  }
}
