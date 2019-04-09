import { $idA, $ready } from './util'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-!;:"\'[] '
const VOWELS = 'AEIOUY'

const $txt = $idA<HTMLTextAreaElement>('txt')
const $chart0Parent = $idA('chart0Parent')
const $chart1Parent = $idA('chart1Parent')

let chart0 = {}
let chart1 = {}

function update (): void {
  // Count letters
  const txt = $txt.value.trim()
  const chrCount: number[] = new Array(CHARS.length).fill(0)
  let sum = 0
  let max = 0
  for (const c of txt) {
    const i = CHARS.indexOf(c.toUpperCase())
    if (i < 0) continue

    sum += 1
    if (max < ++chrCount[i]) max = chrCount[i]
  }

  // Update charts
  const labels = []
  const values = []
  for (const i in chrCount) {
    const count = chrCount[i]
    if (!count) continue
    const c = CHARS[i]
    labels.push(c === ' ' ? '_' : c)
    values.push({
      'top': count,
      'tip': c + ' found ' + (count === 1 ? 'once' : count + ' times'),
      'color': VOWELS.indexOf(c) >= 0 ? '#06799F' : c.match(/[A-Z]/) ? '#FF9F00' : undefined,
    })
  }
  chart0 = {
    'title': {
      'text': `Letter Count (${sum} total)`,
      'style': '{font-size: 20px; color:#567300; font-family: Verdana; text-align: center;}',
    },

    'x_legend': {
      'text': 'Letter',
      'style': '{color: #736AFF; font-size: 12px;}',
    },

    'y_legend': {
      'text': 'Occurrences',
      'style': '{color: #736AFF; font-size: 12px;}',
    },

    'tooltip': {
      'shadow': true,
      'stroke': 2,
      'colour': '#6E604F',
      'background': '#BDB396',
      'title': '{font-size: 14px; color: #CC2A43;}',
      'body': '{font-size: 10px; font-weight: bold; color: #000000;}',
    },

    'x_axis': {
      'stroke': 3,
      'colour': '#A66E00',
      'grid_colour': '#00ff00',
      'labels': { 'labels': labels },
    },

    'y_axis': {
      'stroke': 3,
      'colour': '#81AC00',
      'outline-colour': '#567300',
      'grid_colour': '#00ff00',
      'offset': 0,
      'max': max,
    },

    'elements': [{
      'type': 'bar_glass',
      'colour': '#95F23C',
      'outline-colour': '#577261',
      'alpha': 0.5,
      'text': 'Count',
      'font-size': 10,
      'tip': '#x_label# found #val# times',
      'values': values,
    }],
  }

  const excludeLine = Math.round(sum * 0.02) // (2% and below) minority is excluded
  const valuesFiltered = []
  for (const i in chrCount) {
    const count = chrCount[i]
    if (count <= excludeLine) continue
    const c = CHARS[i]
    let record: Record<string, string | number> = {
      'label': c === ' ' ? '_' : c,
      'value': count,
      'font-size': Math.round(8 + (count * 12 / max)),
    }
    if (count === 1) record['tip'] = c + ' found once (' + Math.round(10000 / sum) / 100 + ' %)'
    valuesFiltered.push(record)
  }
  chart1 = {
    'title': {
      'text': 'Letter Count' + (excludeLine > 0 ? `(${excludeLine} and below excluded)` : ''),
      'style': '{font-size: 20px; color:#0B61A4; font-family: Verdana; text-align: center;}',
    },
    'tooltip': {
      'shadow': true,
      'stroke': 3,
      'colour': '#6E604F',
      'background': '#BDB396',
      'title': '{font-size: 14px; color: #CC2A43;}',
      'body': '{font-size: 10px; font-weight: bold; color: #000000;}',
    },
    'elements': [{
      'type': 'pie',
      'colours': [
        '#1F8FA1', // dark sea blue
        '#B1F100', // green-yellow
        '#FF9500', // dark orange
        '#620CAC', // purple
        '#FF1800', // red
        '#848484', // dark grey
      ],
      'animate': [
        { 'type': 'fade' },
        { 'type': 'bounce', 'distance': 12 },
      ],
      'outline-colour': '#577261',
      'alpha': 0.6,
      'start-angle': 35,
      'gradient-fill': true,
      'tip': '#label# found #val# times (#percent#)',
      'values': valuesFiltered,
    }],
  }

  // Force reload
  $chart0Parent.innerHTML = $chart0Parent.innerHTML
  $chart1Parent.innerHTML = $chart1Parent.innerHTML
}

declare global {
  interface Window {
    getChart0: () => void
    getChart1: () => void
  }
}

window.getChart0 = () => JSON.stringify(chart0)
window.getChart1 = () => JSON.stringify(chart1)

$txt.addEventListener('change', update)
$ready(update)
