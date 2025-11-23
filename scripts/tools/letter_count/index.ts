import { $idA } from '@/util'
import Highcharts from 'highcharts'
import 'highcharts/modules/exporting'
import 'highcharts/modules/offline-exporting'
import 'highcharts/modules/accessibility'

import { CHARS } from './Chart'
import { ChartBar } from './ChartBar'
import { ChartDonut } from './ChartDonut'
import { ChartDonutSemi } from './ChartDonutSemi'
import { ChartPie } from './ChartPie'
import { ChartStacked } from './ChartStacked'

const STORAGE_KEY = 'tools/letter_count/text'

const CHARS_MAP = Object.fromEntries([...CHARS].map((v, i) => [v, i]))

const chartInfos = [
  ChartBar,
  ChartPie,
  ChartDonut,
  ChartDonutSemi,
  ChartStacked,
]

const $txt = $idA<HTMLTextAreaElement>('txt')

if (window.localStorage) {
  const v = localStorage.getItem(STORAGE_KEY)
  if (v != null) $txt.value = v
}

$txt.addEventListener('change', update)

let remain = chartInfos.length
function updateWhenReady (): void {
  (remain && --remain) || setTimeout(update)
}

let handlingOtherCharts = false

const charts = chartInfos.map((chartOptions, i) => {
  const events: Highcharts.PointEventsOptionsObject = {
    select (e) {
      if (handlingOtherCharts) return
      handlingOtherCharts = true

      getEventPointIDs(e).forEach((id) => {
        charts.forEach((chart, j) => {
          if (i === j) return
          (chart.get(id) as Highcharts.Point)?.select(true, e.accumulate)
        })
      })

      handlingOtherCharts = false
    },
    unselect (e) {
      if (handlingOtherCharts) return
      handlingOtherCharts = true

      getEventPointIDs(e).forEach((id) => {
        charts.forEach((chart, j) => {
          if (i === j) return
          const p = chart.get(id) as Highcharts.Point | undefined
          if (p?.selected) {
            p.select(false, e.accumulate)
          }
        })
      })

      handlingOtherCharts = false
    },
    mouseOver (e) {
      const pointIDs = getEventPointIDs(e)
      charts.forEach((chart, j) => {
        if (i === j) return
        const p = new Set(pointIDs.map((id) => chart.get(id) as Highcharts.Point).filter(Boolean))
        if (p.size) {
          chart.series.forEach((series) => series.points.forEach((point) => point.setState(p.has(point) ? 'hover' : 'inactive')))
          chart.tooltip.refresh([...p])
        }
      })
    },
    mouseOut (e) {
      getEventPointIDs(e).forEach((id) => {
        charts.forEach((chart, j) => {
          if (i === j) return
          const p = chart.get(id) as Highcharts.Point | undefined
          if (p) {
            chart.series.forEach((series) => series.points.forEach((point) => point.setState()))
            chart.tooltip.hide()
          }
        })
      })
    },
  }

  const defaultOptions: Highcharts.Options = {
    chart: {
      backgroundColor: '#fafafa',
    },
    credits: {
      enabled: false,
    },
    plotOptions: {
      [chartOptions.type]: {
        point: {
          events,
        },
      },
    },
    exporting: {
      fallbackToExportServer: false,
    },
  }

  return Highcharts.chart('chart' + i, Highcharts.merge(defaultOptions, chartOptions.options), updateWhenReady)
})

function getEventPointIDs (e: Event): string[] {
  const { options } = e.target as unknown as Highcharts.Point
  const id = options.id
  if (id) {
    return [id]
  }
  const { subpoints } = options as { subpoints: { id: string }[] }
  return subpoints ? subpoints.map(({id}) => id) : []
}

function update (): void {
  window.localStorage?.setItem(STORAGE_KEY, $txt.value)

  // Count letters
  const txt = $txt.value.trim()
  const chrCount: number[] = Array(CHARS.length).fill(0)
  let sumCount = 0
  let maxCount = 0
  for (const c of txt) {
    const i = CHARS_MAP[c.toUpperCase()]
    if (i === undefined) continue

    sumCount++
    if (maxCount < ++chrCount[i]) maxCount = chrCount[i]
  }

  // Update charts
  const data = {
    chrCount,
    sumCount,
    maxCount,
  }
  chartInfos.forEach((chartInfo, i) => chartInfo.update(charts[i], data))
}
