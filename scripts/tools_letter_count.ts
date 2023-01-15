import { $idA } from '@/util'
import Highcharts from 'highcharts'
import Exporting from 'highcharts/modules/exporting'

Exporting(Highcharts)

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-!;:"\'[] '
const VOWELS = 'AEIOUY'
const CHARS_MAP = Object.fromEntries([...CHARS].map((v, i) => [v, i]))

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

function makePieGradient (color: Highcharts.ColorType): Highcharts.GradientColorObject {
  return {
      radialGradient: { cx: 0.5, cy: 0.5, r: 0.5 },
      stops: [
        [0.39, new Highcharts.Color(color).get('rgb') as string],
        [1, new Highcharts.Color(color).setOpacity(0.5).get('rgba') as string],
      ],
  }
}

const barColorVowel = '#06799f'
const barColorVowel2 = makeBarGlassEffect('#06799f')
const barColorC = '#ff9f00'
const barColorC2 = makeBarGlassEffect('#ff9f00')
const barColorSymbol = '#95f23c'
const barColorSymbol2 = makeBarGlassEffect('#95f23c')

const pieColors = [
  '#1f8fa1', // dark sea blue
  '#b1f100', // green-yellow
  '#ff9500', // dark orange
  '#620cac', // purple
  '#ff1800', // red
  '#848484', // dark grey
]

const defaultColors = Highcharts.getOptions().colors!

const chartOptions0: Highcharts.Options = {
  credits: {
    enabled: false,
  },
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
      const c = this.point.name ?? this.x
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
}
const chartOptions1: Highcharts.Options = {
  credits: {
    enabled: false,
  },
  chart: {
    backgroundColor: '#f8f7da',
  },
  colors: pieColors.map(makePieGradient),
  title: {
    style: {
      fontSize: '20px',
      color: '#0b61a4',
      fontFamily: 'Verdana',
    },
  },
  tooltip: {
    formatter () {
      return (this.point as any).label
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
}
const chartOptions2: Highcharts.Options = {
  credits: {
    enabled: false,
  },
  chart: {
    backgroundColor: '#fafafa',
  },
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
}
const chartOptions3: Highcharts.Options = {
  credits: {
    enabled: false,
  },
  chart: {
    backgroundColor: '#fafafa',
  },
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
}
const chartOptions4: Highcharts.Options = {
  credits: {
    enabled: false,
  },
  chart: {
    backgroundColor: '#fafafa',
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
}

const $txt = $idA<HTMLTextAreaElement>('txt')

$txt.addEventListener('change', update)

let remain = 5
function updateWhenReady (): void {
  (remain && --remain) || setTimeout(update)
}
const chart0 = Highcharts.chart('chart0', chartOptions0, updateWhenReady)
const chart1 = Highcharts.chart('chart1', chartOptions1, updateWhenReady)
const chart2 = Highcharts.chart('chart2', chartOptions2, updateWhenReady)
const chart3 = Highcharts.chart('chart3', chartOptions3, updateWhenReady)
const chart4 = Highcharts.chart('chart4', chartOptions4, updateWhenReady)

function update (): void {
  // Count letters
  const txt = $txt.value.trim()
  const chrCount: number[] = new Array(CHARS.length).fill(0)
  let sumCount = 0
  let maxCount = 0
  for (const c of txt) {
    const i = CHARS_MAP[c.toUpperCase()]
    if (i === undefined) continue

    sumCount++
    if (maxCount < ++chrCount[i]) maxCount = chrCount[i]
  }

  // Calculate data
  const c0cats: string[] = []
  const c0data: Highcharts.PointOptionsType[] = []
  const c1data: Highcharts.PointOptionsType[] = []
  const c2data = [
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
  const chart3data: Highcharts.PointOptionsType[] = []
  const chart4series: Highcharts.SeriesOptionsType[] = []

  const excludeLine = Math.round(sumCount * 0.02) // (2% and below) minority is excluded for chart1

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

    c0cats.push(c === ' ' ? 'sp' : c)
    c0data.push({
      name: c === ' ' ? 'SPACE' : c,
      y: count,
      color,
      borderColor,
    })
    chart3data.push({
      name: c === ' ' ? 'SPACE' : c,
      y: count,
    })
    chart4series.push({
      type: 'bar',
      name: c === ' ' ? 'SPACE' : c,
      data: [count],
    })

    const c2Index = isVowel ? 0 : isLetter ? 1 : 2
    c2data[c2Index].y += count
    c2data[c2Index].subpoints.push({
      name: c === ' ' ? 'SPACE' : c,
      y: count,
    })

    if (count <= excludeLine) continue

    const c1color = pieColors[c1data.length % pieColors.length]
    c1data.push({
      name: c === ' ' ? 'sp' : c,
      label: `${c === ' ' ? 'SPACE' : c + ''} found ${count === 1 ? 'once' : `${count} times`} (${Math.round(count * 10000 / sumCount) / 100}%)`,
      y: count,
      borderColor: c1color,
      dataLabels: {
        style: {
          color: c1color,
          fontSize: Math.round(8 + (count * 12 / maxCount)) + '',
        },
      },
    })
  }

  // Update column chart
  chart0.title.update({ text: `Letter Count (Bar, ${sumCount} total)` }, false)
  chart0.xAxis[0].update({ categories: c0cats }, false)
  chart0.yAxis[0].update({ max: maxCount }, false)
  chart0.series[0].setData(c0data)

  // Update pie chart
  chart1.title.update({ text: `Letter Count (Pie${excludeLine > 0 ? `, ${excludeLine} and below excluded` : ''})` }, false)
  chart1.series[0].setData(c1data)

  // Update donut chart
  chart2.series[1].setData(c2data.flatMap((v, i) => {
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
  chart2.series[0].setData(c2data)

  // Update semi donut chart
  chart3.series[0].setData(chart3data)

  // Update stacked bar chart
  chart4.yAxis[0].update({ max: sumCount }, false)
  chart4.update({ series: chart4series }, true, true)
}
