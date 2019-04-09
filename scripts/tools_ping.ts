import { $idA, $ready } from './util'
import RollingStats from './util/RollingStats'

const $pURL = $idA<HTMLInputElement>('pURL')
const $numInterval = $idA<HTMLInputElement>('numInterval')
const $maxPing = $idA<HTMLInputElement>('maxPing')
const $startStop = $idA('startStop')

const $pingStats0 = $idA('pingStats0')
const $pingStats1 = $idA('pingStats1')

let curInterval: number | undefined

function formatStatsHTML (stats: RollingStats): string {
  return `<p>Last: ${stats.getLast()}</p>
<p>Average: ${stats.getMean()}</p>
<p>Min: ${stats.getMin()}</p>
<p>Max: ${stats.getMax()}</p>
<p>PopStdDev: ${Math.sqrt(stats.getVariance())}</p>
<p>SampleStdDev: ${Math.sqrt(stats.getSampleVariance())}</p>
<p>Count: ${stats.getCount()}</p>`
}

function start () {
  // Update UI
  $startStop.className = 'btn btn-danger'
  $startStop.innerText = 'Stop'
  $pURL.readOnly = $numInterval.readOnly = $maxPing.readOnly = true

  // Start interval
  const url = $pURL.value
  let remain = +$maxPing.value | 0
  const rsPing = new RollingStats()
  const rsJitter = new RollingStats()

  $pingStats0.innerHTML = $pingStats1.innerHTML = ''
  function doPing () {
    const start = Date.now()
    function doneCallback () {
      const delay = Date.now() - start

      if (rsPing.getCount()) {
        rsJitter.addValue(Math.abs(delay - rsPing.getLast()))
        $pingStats1.innerHTML = formatStatsHTML(rsJitter)
      }
      rsPing.addValue(delay)
      $pingStats0.innerHTML = formatStatsHTML(rsPing)
    }
    $.ajax({
      url,
      method: 'HEAD',
      headers: { 'Cache-Control': 'no-cache' },
    })
      .done(doneCallback)
      .fail(doneCallback)

    if (remain && !--remain) {
      stop()
    }
  }

  curInterval = window.setInterval(doPing, +$numInterval.value)
  doPing()
}

function stop () {
  $startStop.className = 'btn btn-primary'
  $startStop.innerText = 'Start'
  $pURL.readOnly = $numInterval.readOnly = $maxPing.readOnly = false
  // Stop interval
  clearInterval(curInterval)
  curInterval = undefined
}

function startStop (): void {
  (curInterval === undefined ? start : stop)()
}

$ready(function () {
  $startStop.addEventListener('click', startStop)
})
