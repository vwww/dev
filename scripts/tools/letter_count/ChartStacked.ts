import { CHARS, type ChartBase } from './Chart'

export const ChartStacked: ChartBase = {
  type: 'bar',

  options: {
    chart: {
      type: 'bar',
    },
    title: {
      text: 'Letter Count (Stacked Bar)',
    },
    legend: { enabled: false },
    xAxis: {
      categories: ['Count'],
      visible: false,
    },
    plotOptions: {
      bar: {
        allowPointSelect: true,
        cursor: 'pointer',
        stacking: 'normal',
        dataLabels: {
          enabled: true,
          format: '{series.name} {y} ({percentage:.1f}%)',
          rotation: -55,
        },
      },
    },
  },

  update (chart, data) {
    const series: Highcharts.SeriesOptionsType[] = []

    for (let i = 0; i < data.chrCount.length; i++) {
      const count = data.chrCount[i]
      if (!count) continue

      const c = CHARS[i]

      series.push({
        type: 'bar',
        name: c === ' ' ? 'SPACE' : c,
        data: [
          {
            id: `c${c.charCodeAt(0)}`,
            y: count,
          }
        ],
      })
    }

    chart.yAxis[0].update({ max: data.sumCount }, false)
    chart.update({ series }, true, true)
  },
}
