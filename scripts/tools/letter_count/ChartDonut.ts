import Highcharts from 'highcharts'
import { CHARS, type ChartBase, VOWELS } from './Chart'

const defaultColors = Highcharts.getOptions().colors!

export const ChartDonut: ChartBase = {
  type: 'pie',

  options: {
    title: {
      text: 'Letter Count (Donut)',
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
      },
    },
    series: [
      {
        type: 'pie',
        name: 'CharClass',
        size: '60%',
        innerSize: '30%',
        dataLabels: {
          distance: -45,
        },
      },
      {
        type: 'pie',
        name: 'Char',
        size: '80%',
        innerSize: '60%',
      },
    ],
  },

  update (chart, data) {
    const chartData = [
      {
        name: 'Vowel',
        y: 0,
        subpoints: [] as Highcharts.PointOptionsObject[],
      },
      {
        name: 'Consonant',
        y: 0,
        subpoints: [] as Highcharts.PointOptionsObject[],
      },
      {
        name: 'Symbol',
        y: 0,
        subpoints: [] as Highcharts.PointOptionsObject[],
      },
    ]

    for (let i = 0; i < data.chrCount.length; i++) {
      const count = data.chrCount[i]
      if (!count) continue

      const c = CHARS[i]

      const isVowel = VOWELS.includes(c)
      const isLetter = isVowel || /[A-Z]/.test(c)

      const j = isVowel ? 0 : isLetter ? 1 : 2
      chartData[j].y += count
      chartData[j].subpoints.push({
        name: c === ' ' ? 'SPACE' : c,
        id: `c${c.charCodeAt(0)}`,
        y: count,
      })
    }

    chart.series[1].setData(chartData.flatMap((v, i) => {
      let total = 0
      return v.subpoints.map((x) => {
        const thisTotal = total + x.y! / 2
        total += x.y!
        return {
          ...x,
          color: new Highcharts.Color(defaultColors[i]).brighten(0.2 * (1 - thisTotal / v.y)).get('rgb'),
        }
      })
    }), false)
    chart.series[0].setData(chartData)
  },
}
