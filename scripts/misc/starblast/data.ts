import { schemeCategory10 as colorScale } from 'd3'

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

export function formatTimeISO (t: number): string {
  return new Date(t).toISOString().replace('.000Z', 'Z').replace(':00Z', 'Z')
}

export function formatTimeLocal (t: number): string {
  return new Date(t).toLocaleString()
}

export function formatTime (t: number): string {
  return `${formatTimeISO(t)} (${formatTimeLocal(t)})`
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
      label: '[zoom in for details]',
      tooltip: '',
    }]
  }

  traverseHistory(dStart, dEnd, modHistory,
    (event, prevEvent) => !event.add || (event.mod?.active && !(event.mod.featured && prevEvent.infoFeatured.length)),
    (tStart, tEnd, curHistory, nextHistory) => {
      const active = curHistory.infoActive
      const total = curHistory.infoActiveHours * 3600000
      const firstLastColor = active.length > 1 && (active.length % colorScale.length) === 1

      if (!total) return

      let tModStart = tStart - tStart % total - (tStart < 0 ? total : 0)
      let j = 0
      while (tModStart < tEnd) {
        const mod = active[j]
        const duration = mod.active_duration * 3600000
        let tModEnd = tModStart + duration

        if (tModEnd > tStart) {
          if (tModStart < tStart && tStart > dStart) {
            tModStart = tStart
          }
          if (tModEnd > tEnd && tEnd < dEnd && !(nextHistory?.minor && nextHistory.mod?.mod_id !== mod.mod_id)) {
            tModEnd = tEnd
          }

          const maxX = xScale.range()[1]

          const xStart = Math.max(xScale(tModStart), 0)
          const xEnd = Math.min(xScale(tModEnd), maxX)
          const width = xEnd - xStart

          const tooltipLines = [
            mod.title,
            formatTime(tModStart),
            formatTime(tModEnd),
            ''
          ]

          for (const k of ModDataKeys) {
            if (mod[k] !== undefined) {
              tooltipLines.push(`${k}: ${k === 'date_created' ? formatTime(mod[k]) : mod[k] as string}`)
            }
          }

          const TEXT_WIDTH_ESTIMATE = 10
          data.push({
            x: xStart,
            y: 0,
            width,
            height: curHistory.infoFeatured.length ? 40 : 70,
            color: colorScale[firstLastColor && j + 1 === active.length ? 1 : j % colorScale.length],
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
        if (++j === active.length) j = 0
      }

      return tModStart
    }
  )

  // featured
  let featuredColor = 1
  traverseHistory(dStart, dEnd, modHistory,
    (event) => event.add
      ? event.mod?.active && event.mod.featured
      : event.prop === 'featured' || (event.prop === 'active' && event.mod!.featured),
    (tStart, tEnd, curHistory, nextHistory) => {
      const x = xScale(tStart)
      const width = xScale(tEnd) - x

      if (curHistory.infoFeatured.length) {
        const tooltipLines = []
        if (modHistory.length > 1) {
          tooltipLines.push(formatTime(curHistory.time))
          if (nextHistory) {
            tooltipLines.push(formatTime(nextHistory.time))
          }
          tooltipLines.push('')
        }
        tooltipLines.push(...curHistory.infoFeatured.map((m) => `${m.title} (${m.mod_id})`))

        data.push({
          x,
          y: 40,
          width,
          height: 30,
          color: ['#555', '#777'][featuredColor ^= 1],
          label: curHistory.infoFeatured.map((m) => m.title).join(', '),
          tooltip: tooltipLines.join('\n'),
        })
      }

      return undefined
    }
  )

  return data
}

function traverseHistory (dStart: number, dEnd: number, modHistory: ModHistory,
  isEventRelevant: (event: ModEvent, prevEvent: ModEvent) => boolean | undefined,
  processRange: (tStart: number, tEnd: number, curEvent: ModEvent, nextEvent?: ModEvent) => number | undefined
): void {
  let t = dStart
  let i = modHistory.length - 2

  while (t < dEnd) {
    while (i >= 0 && (modHistory[i].time <= t || !isEventRelevant(modHistory[i], modHistory[i + 1]))) {
      i--
    }

    const tStart = t
    t = i < 0 ? dEnd : modHistory[i].time
    if (t > tStart) {
      t = processRange(tStart, t, modHistory[i + 1], modHistory[i]) ?? t
    }
  }
}
