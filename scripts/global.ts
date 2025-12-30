// import jQuery before bootstrap
import $ from 'jquery'

import 'bootstrap'
import 'timeago'

import { $idA } from './util'
import * as theme from './victorz/theme'

// "Uptime" Counter function
function uptick (): void {
  // 1103526000000 === Date.parse('2004-12-20T00:00-0700')
  // 31556926000 === year / ms
  const timeValue = ((Date.now() - 1103526000000) / 31556926000)
  $('#uptime-years').text(timeValue.toFixed(8))
  const hexTime = timeValue.toString(16)
  $('#uptime-years-hex').text(hexTime.slice(0, 7 + hexTime.indexOf('.') + 1))
}

function init (): void {
  // Initialization scripts
  $(function () {
    const now = new Date()

    // Keep dropdowns open on CTRL-click
    document.addEventListener('click', (e) => {
      if (e.target && $(e.target).parents('.dropdown-menu').length && (!$(e.target).is('.dropdown-item') || (e.ctrlKey && !e.shiftKey))) {
        e.stopPropagation()
      }
    }, true)

    // Theme Switcher
    theme.init()

    // Mirror Selector
    $('#mirror-list a').filter(function () { return $(this).text() === location.hostname }).addClass('active')

    // Copyright year (update only once)
    $('#copyyear').text(now.getFullYear())

    // "Uptime" counter
    // Interval for decimal = 315.36ms = 0.00000001 years
    // Interval for hexadecimal = 117.5 ms = 1 / 16 ^ 7 years to ms
    setInterval(uptick, 105)

    // TODO: move timeago to another file?
    // timeago
    $.timeago.settings.refreshMillis = 5000
    $.timeago.settings.strings = {
      prefixAgo: null,
      prefixFromNow: null,
      suffixAgo: 'ago',
      suffixFromNow: 'from now',
      inPast: 'any moment now',
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
    console.log("%cVictor's Site", 'font-size:50px; font-weight:bold; color:red; -webkit-text-stroke:1px black; background:linear-gradient(45deg,#09009f,#00ff95 80%)')
    console.log("%cThere isn't much point to use this console on my site,", 'font-family:helvetica; font-size:20px')
    console.log("unless you're trying to debug something.")

    // April Fools
    const month = now.getMonth() + 1
    const day = now.getDate()
    if ((month === 3 && day === 31) || (month === 4 && day <= 2)) {
      $idA('april-fools-joke-menu').classList.remove('d-none')
    }

    // trollDebuggers()
  })
}

/*
function trollDebuggers (): void {
  const ls = window.localStorage
  if (!ls) return

  if (ls.getItem('debuggerTestDone')) return

  ls.setItem('debuggerTest', '1337')
  if (ls.getItem('debuggerTest') !== '1337') return
  ls.removeItem('debuggerTest')

  let lastTime = 0
  const testInterval = setInterval(function () {
    const now = Date.now()
    if (lastTime && lastTime < now - 200) {
      ls.setItem('debuggerTestDone', '1')
      document.write('<h1>debugger detected</h1><h2>reload to remove</h2><iframe width="100%" height="100%" '+
        'src="https://www.youtube-nocookie.com/embed/b1WWpKEPdT4?autoplay=1" frameborder="0" allowfullscreen></iframe>')
      window.clearInterval(testInterval)
    } else {
      debugger
      lastTime = now
    }
  }, 100)
}
*/

init()
