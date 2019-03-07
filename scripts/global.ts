import * as theme from './victorz/theme'

// "Uptime" Counter function
function uptick (): void {
  // 1106204400000 == new Date(2004, 12, 20).getTime()
  // 31556926000 == year / ms
  const timeValue = ((Date.now() - 1106204400000) / 31556926000)
  $('#uptime-years').text(timeValue.toFixed(8))
  const hexTime = timeValue.toString(16)
  $('#uptime-years-hex').text(hexTime.slice(0, 7 + hexTime.indexOf('.') + 1))
}

function init(): void {
  // Initialization scripts
  $(function () {
    // Theme Switcher
    theme.init()

    // Copyright year (update only once)
    $('#copyyear').text((new Date()).getFullYear())

    // "Uptime" counter
    // Interval for decimal = 315.36ms = 0.00000001 years
    // Interval for hexadecimal = 117.5 ms = 1 / 16 ^ 7 years to ms
    setInterval(uptick, 105)

    // TODO: move timeago to another file?
    // timeago
    $.timeago.settings.refreshMillis = 5000
    $.timeago.settings.strings = {
      prefixAgo: undefined,
      prefixFromNow: undefined,
      suffixAgo: 'ago',
      suffixFromNow: 'from now',
      seconds: '%d seconds',
      minute: 'a minute',
      minutes: '%d minutes',
      hour: 'an hour',
      hours: '%d hours',
      day: 'a day',
      days: '%d days',
      month: 'a month',
      months: '%d months',
      year: 'a year',
      years: '%d years',
      wordSeparator: ' ',
      numbers: []
    }
    $.timeago.settings.allowFuture = true
    // Invoke timeago
    $('.timeago').timeago()

    // console.log message
    console.log('%cOH HAI THERE!', 'font-size:50px; font-weight:bold; color:red; -webkit-text-stroke:1px black;')
    console.log("%cThere isn't much point to use this console on my site,", 'font-family:helvetica; font-size:20px')
    console.log("unless you're trying to debug something.")

    // trollDebuggers()
  })
}

/*
function trollDebuggers (): void {
  var ls = window.localStorage
  if (!ls) return

  if (ls.getItem('debuggerTestDone')) return

  ls.setItem('debuggerTest', '1337')
  if (ls.getItem('debuggerTest') !== '1337') return
  ls.removeItem('debuggerTest')

  var lastTime = 0
  var testInterval = setInterval(function () {
    var now = +new Date()
    if (lastTime && lastTime < now - 200) {
      ls.setItem('debuggerTestDone', '1')
      document.write('<h1>debugger detected</h1><h2>reload to remove</h2><iframe width="100%" height="100%" src="https://www.youtube-nocookie.com/embed/b1WWpKEPdT4?autoplay=1" frameborder="0" allowfullscreen></iframe>')
      window.clearInterval(testInterval)
    } else {
      debugger
      lastTime = now
    }
  }, 100)
}
*/

init()
