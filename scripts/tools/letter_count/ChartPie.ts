import Highcharts from 'highcharts'

import { CHARS, type ChartBase } from './Chart'

const pieColors = [
  '#1f8fa1', // dark sea blue
  '#b1f100', // green-yellow
  '#ff9500', // dark orange
  '#620cac', // purple
  '#ff1800', // red
  '#848484', // dark grey
]

function makePieGradient (color: Highcharts.ColorType): Highcharts.GradientColorObject {
  return {
      radialGradient: { cx: 0.5, cy: 0.5, r: 0.5 },
      stops: [
        [0.39, new Highcharts.Color(color).get('rgb') as string],
        [1, new Highcharts.Color(color).setOpacity(0.5).get('rgba') as string],
      ],
  }
}

export const ChartPie: ChartBase = {
  type: 'pie',

  options: {
    chart: {
      backgroundColor: '#f8f7da',
    },
    colors: pieColors.map(makePieGradient),
    title: {
      text: 'Letter Count (Pie)',
      style: {
        fontSize: '20px',
        color: '#0b61a4',
        fontFamily: 'Verdana',
      },
    },
    tooltip: {
      formatter () {
        return (this as any).label
      },
      borderWidth: 3,
      borderRadius: 6,
      borderColor: '#6e604f',
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        startAngle: 125,
        dataLabels: {
          style: {
            opacity: 0.6,
            textOutline: 'none',
          },
        },
        opacity: 0.8,
      },
    },
    series: [{ type: 'pie' }],
  },

  update (chart, data) {
    const chartData: Highcharts.PointOptionsType[] = []

    for (let i = 0; i < data.chrCount.length; i++) {
      const count = data.chrCount[i]
      if (!count) continue

      const c = CHARS[i]

      const color = pieColors[chartData.length % pieColors.length]
      chartData.push({
        name: c === ' ' ? 'sp' : c,
        id: `c${c.charCodeAt(0)}`,
        label: `${c === ' ' ? 'SPACE' : c + ''} found ${count === 1 ? 'once' : `${count} times`} (${Math.round(count * 10000 / data.sumCount) / 100}%)`,
        y: count,
        borderColor: color,
        dataLabels: {
          style: {
            color,
            fontSize: Math.round(8 + (count * 12 / data.maxCount)) + '',
          },
        },
      })
    }

    chart.series[0].setData(chartData)
  },
}
