import { CHARS, type ChartBase } from './Chart'

export const ChartDonutSemi: ChartBase = {
  type: 'pie',

  options: {
    title: {
      text: 'Letter Count (Semi Donut)',
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        startAngle: -90,
        endAngle: 90,
        center: ['50%', '100%'],
        size: '150%',
        innerSize: '50%',
        dataLabels: {
          distance: -40,
          style: {
            fontWeight: 'bold',
            color: 'white',
          },
        },
      },
    },
    series: [{ type: 'pie', name: 'Count' }],
  },

  update (chart, data) {
    const chartData: Highcharts.PointOptionsType[] = []

    // Calculate data
    for (let i = 0; i < data.chrCount.length; i++) {
      const count = data.chrCount[i]
      if (!count) continue

      const c = CHARS[i]

      chartData.push({
        name: c === ' ' ? 'SPACE' : c,
        id: `c${c.charCodeAt(0)}`,
        y: count,
      })
    }

    chart.series[0].setData(chartData)
  },
}
