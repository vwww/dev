export {}

declare const Highcharts: typeof import('highcharts')

let series: Highcharts.Series | undefined

function addData (): void {
  // Data info
  const startTime = Date.parse($('#startDate').val() + '')
  const maxTime = startTime + +($('#terms').val() ?? 0) * 3.156e+10
  const startValue = +($('#principal').val() ?? 0)
  const interest = 1 + +($('#interest').val() ?? 0) / 100
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

function plotData (): void {
  addData()
  // return false
}

$(function () {
  $('#plotDataButton').on('click', plotData)

  const colors = Highcharts.getOptions().colors!

  // create the chart
  const options: Highcharts.Options = {
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
            [0, colors[0]],
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
  $('#container').highcharts('StockChart', options, (chart) => {
    series = chart.series[0]
    addData()
    window.setInterval(function () {
      /*
      chart.series[1].addPoint({
        x : Date.now(),
        title : '!',
        text : 'Now'
      }, true, chart.series[1].data.length >= 1)
      */
      chart.series[1].data[0].update({ x: Date.now() })
    }, 1000)
  })
})