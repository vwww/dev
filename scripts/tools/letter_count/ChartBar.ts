import Highcharts from 'highcharts'
import { CHARS, type ChartBase, VOWELS } from './Chart'

function makeBarGlassEffect (color: Highcharts.ColorType): Highcharts.GradientColorObject {
  return {
    linearGradient: { x1: 0, y1: 0, x2: 1, y2: 0 },
    stops: [
      [0, new Highcharts.Color(color).brighten(0.7).get('rgb') as string],
      [0.5, new Highcharts.Color(color).brighten(0.25).get('rgb') as string],
      [0.5, new Highcharts.Color(color).brighten(0.125).get('rgb') as string],
      [1, new Highcharts.Color(color).brighten(-0.07).get('rgb') as string],
    ],
  }
}

const barColorVowel = '#06799f'
const barColorVowel2 = makeBarGlassEffect('#06799f')
const barColorC = '#ff9f00'
const barColorC2 = makeBarGlassEffect('#ff9f00')
const barColorSymbol = '#95f23c'
const barColorSymbol2 = makeBarGlassEffect('#95f23c')

export const ChartBar: ChartBase = {
  type: 'column',

  options: {
    chart: {
      backgroundColor: '#f8f7da',
    },
    title: {
      style: {
        fontSize: '20px',
        color: '#567300',
        fontFamily: 'Verdana',
      },
    },
    legend: { enabled: false },
    xAxis: {
      title: {
        text: 'Letter',
        style: {
          color: '#736aff',
        },
      },
      lineWidth: 3,
      lineColor: '#a66e00',
      tickColor: '#a66e00',
      tickWidth: 2,
      tickLength: 3,
      tickmarkPlacement: 'on',
      gridLineWidth: 1,
    },
    yAxis: {
      title: {
        text: 'Occurrences',
        style: {
          color: '#736aff',
        },
      },
      lineWidth: 3,
      lineColor: '#81ac00',
      tickColor: '#81ac00',
      tickWidth: 2,
      tickLength: 3,
    },
    tooltip: {
      formatter () {
        const c = this.name ?? this.x
        const count = this.y

        return c + ' found ' + (count === 1 ? 'once' : count + ' times')
      },
      borderWidth: 2,
      borderRadius: 6,
      borderColor: '#6e604f',
    },
    plotOptions: {
      column: {
        allowPointSelect: true,
        cursor: 'pointer',
        borderWidth: 2,
      },
    },
    series: [{ type: 'column' }],
  },

  update (chart, data) {
    const { chrCount } = data
    const categories: string[] = []
    const chartData: Highcharts.PointOptionsType[] = []

    for (let i = 0; i < chrCount.length; i++) {
      const count = chrCount[i]
      if (!count) continue

      const c = CHARS[i]

      const isVowel = VOWELS.includes(c)
      const isLetter = isVowel || /[A-Z]/.test(c)
      const borderColor = isVowel
        ? barColorVowel
        : isLetter
          ? barColorC
          : barColorSymbol
      const color = isVowel
        ? barColorVowel2
        : isLetter
          ? barColorC2
          : barColorSymbol2

      categories.push(c === ' ' ? 'sp' : c)
      chartData.push({
        name: c === ' ' ? 'SPACE' : c,
        id: `c${c.charCodeAt(0)}`,
        y: count,
        color,
        borderColor,
      })
    }

    chart.title.update({ text: `Letter Count (Bar, ${data.sumCount} total)` }, false)
    chart.xAxis[0].update({ categories }, false)
    chart.yAxis[0].update({ max: data.maxCount }, false)
    chart.series[0].setData(chartData)
  },
}
