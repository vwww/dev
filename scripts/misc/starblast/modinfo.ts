import { sum } from '@/util'
import { schemeCategory10 as colorScale } from 'd3'

export interface ModData {
  _id: string
  mod_id: string
  author: string
  title: string
  timesplayed?: number
  max_enter_players: number
  max_enter_time: number
  version: string
  active: boolean
  new: boolean
  active_duration: number
  featured: boolean
  date_created: number
}

export const ModDataKeys = [
  '_id',
  'mod_id',
  'author',
  'title',
  'timesplayed',
  'max_enter_players',
  'max_enter_time',
  'version',
  'active',
  'new',
  'active_duration',
  'featured',
  'date_created',
] as const

export type ModInfo = readonly ModData[]

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

export function generateData (dStart: number, dEnd: number, width: number,
  modData: ModInfo, xScale: (v: number) => number): Data[] {
  const data: Data[] = []

  const modDataRotation = modData.filter((d) => d.active && !d.featured)
  const modDataFeatured = modData.filter((d) => d.active && d.featured)

  const showBars = dEnd - dStart <= 7200000 * width
  if (showBars) {
    const showText = dEnd - dStart <= 600000 * width
    const showTextFull = dEnd - dStart <= 150000 * width

    const HOUR = 3600000
    const modDataTotal = sum(modDataRotation.map((m) => m.active_duration)) * HOUR
    const firstLastColor = (modDataRotation.length % colorScale.length) === 1

    let t = dStart - dStart % modDataTotal - (dStart < 0 ? modDataTotal : 0)
    let i = 0
    while (t < dEnd) {
      const mod = modDataRotation[i]
      const duration = mod.active_duration * HOUR
      const tEnd = t + duration

      if (tEnd > dStart) {
        const xStart = xScale(t)
        const xEnd = xScale(tEnd)

        const tooltipLines = [
          mod.title,
          formatTimeLocal(t),
          formatTimeLocal(tEnd),
          ''
        ]

        for (const k of ModDataKeys) {
          if (mod[k] !== undefined) {
            tooltipLines.push(`${k}: ${k === 'date_created' ? formatTimeLocal(mod[k]) : mod[k] as string}`)
          }
        }

        data.push({
          x: xStart,
          y: 0,
          width: xEnd - xStart,
          height: modDataFeatured.length ? 40 : 70,
          color: colorScale[i % colorScale.length + (firstLastColor && i + 1 === modDataRotation.length ? 1 : 0)],
          label: showText ? showTextFull ? mod.title : mod.mod_id : '',
          tooltip: tooltipLines.join('\n').trimEnd(),
        })
      }

      t += duration
      if (++i === modDataRotation.length) i = 0
    }
  } else {
    data.push({
      x: 0,
      y: 0,
      width,
      height: modDataFeatured.length ? 40 : 70,
      color: colorScale[1],
      label: '[zoom in to see details]',
      tooltip: '',
    })
  }

  if (modDataFeatured.length) {
    data.push({
      x: 0,
      y: 40,
      width,
      height: 30,
      color: '#555',
      label: modDataFeatured.map((m) => m.title).join(', '),
      tooltip: '',
    })
  }

  return data
}
