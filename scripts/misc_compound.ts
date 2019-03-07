import { $idA, $ready } from '@/util'
import Highcharts from 'highcharts/highstock'
import 'highcharts/modules/exporting'
import 'highcharts/modules/offline-exporting'
import 'highcharts/modules/accessibility'

let series: Highcharts.Series | undefined

const $idI = $idA<HTMLInputElement>

function addData (): void {
  // Data info
  const startTime = Date.parse($idI('startDate').value + '')
  const maxTime = startTime + +($idI('terms').value ?? 0) * 3.156e+10
  const startValue = +($idI('principal').value ?? 0)
  const interest = 1 + +($idI('interest').value ?? 0) / 100
  const valueIncrement = 0.01
  const timeIncrement = 1800000 // 30 minutes // 1 * 8.64e+7 // 1 day
  // Generate
  let lastTime = startTime
  let lastValue = startValue
  const data = [[startTime, startValue]]
  while (lastTime < maxTime) {
    lastTime += Math.max(timeIncrement, Math.log(1 + valueIncrement / lastValue) * 3.156e+10 / Math.log(interest))
    if (lastTime > maxTime) lastTime = maxTime
    lastValue = startValue * Math.pow(interest, (lastTime - startTime) / 3.156e+10)
    data.push([lastTime, lastValue])
  }
  series!.setData(data)
}

$ready(function () {
  $idA('plotDataButton').onclick = addData

  const colors = Highcharts.getOptions().colors!

  // create the chart
  const options: Highcharts.Options = {
    credits: {
      enabled: false
    },

    title: {
      text: 'Compound Interest Graph'
    },

    yAxis: {
      type: 'logarithmic'
    },

    rangeSelector: {
      buttons: [{
        type: 'hour',
        count: 1,
        text: '1h'
      }, {
        type: 'day',
        count: 1,
        text: '1d'
      }, {
        type: 'week',
        count: 1,
        text: '1w'
      }, {
        type: 'week',
        count: 2,
        text: '2w'
      }, {
        type: 'month',
        count: 1,
        text: '1m'
      }, {
        type: 'month',
        count: 3,
        text: '3m'
      }, {
        type: 'month',
        count: 6,
        text: '6m'
      }, {
        type: 'ytd',
        text: 'YTD'
      }, {
        type: 'year',
        count: 1,
        text: '1y'
      }, {
        type: 'all',
        text: 'All'
      }],
      selected: 9,
      inputEnabled: false
    },

    series: [
      {
        name: 'Value',
        type: 'area',
        tooltip: {
          valueDecimals: 2
        },
        fillColor: {
          linearGradient: {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 1
          },
          stops: [
            [0, colors[0] as string],
            [1, new Highcharts.Color(colors[0]).setOpacity(0).get('rgba') as string]
          ]
        },
        threshold: null
      },
      {
        type: 'flags',
        onSeries: 'dataseries',
        shape: 'circlepin',
        width: 16,
        data: [{
          x: Date.now(),
          title: '!',
          text: 'Now'
        }]
      }
    ]
  }
  Highcharts.stockChart('container', options, (chart) => {
    series = chart.series[0]
    addData()
    window.setInterval(function () {
      chart.series[1].data[0].update({ x: Date.now() })
    }, 1000)
  })
})
