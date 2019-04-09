import { PokeInfo, TaggedPokeInfo } from './bots/poke/PokeInfo'
import { $idA } from './util'
import { supportsLocalStorage } from './victorz/storage'

declare const firebase: typeof import('firebase')
declare const Plotly: typeof import('plotly.js')

const enum TieType {
  NONE,
  FIRST,
  INDENTED,
}

interface EntryInfo extends TaggedPokeInfo {
  rank: [number, number, number, number, number, number],
  tie: TieType,
}

function init (): void {
  // Poke entries sorted by pokes then time
  let data1: EntryInfo[]

  // Poke entries sorted by time
  let data2: EntryInfo[]

  // Parse entry from DB
  function parseEntry (entry: PokeInfo, uid: string): EntryInfo {
    return {
      ...entry,
      rank: [0, 0, 0, 0, 0, 0],
      tie: TieType.NONE,
      uid: uid
    }
  }

  // Format rank as HTML
  function formatRank (rank: number): string {
    let suffix = 'th'
    if (rank === (rank | 0)) {
      let x = rank % 100
      // ignore suffix for 11th, 12th, 13th
      if (!(x > 3 && x < 21)) {
        x %= 10
        if (x === 1) suffix = 'st'
        if (x === 2) suffix = 'nd'
        if (x === 3) suffix = 'rd'
      }
    }
    return rank + '<sup>' + suffix + '</sup>'
  }

  function updateLeaderboard (): void {
    if (!data1 || !data2) return

    function entryHTML (entry: TaggedPokeInfo, tie: TieType, rank: number, rankOther: number): string {
      const t = new Date(entry.time * 1000)
      return '<li' + (tie > 1 ? ' class="indent">' : '>') +
        '<h1 data-rank="' + rank + (tie ? '" class="tie">' : '">') + formatRank(rank) + '</h1>' +
        '<h1 class="ranko" data-rank="' + rankOther + '">' + formatRank(rankOther) + '</h1>' +
        '<img src="https://graph.facebook.com/' + entry.uid + '/picture?width=80&amp;height=80">' +
        '<h2><a href="https://www.facebook.com/' + entry.uid + '">' + entry.name + '</a></h2>' +
        '<h3>' + entry.num.toLocaleString() + '</h3>' +
        '<span title="' + t.toISOString() + '" class="timeago_dynamic">' + t.toString() + '</span></li>'
    }

    $('.timeago_dynamic').timeago('dispose')

    const tieBreaker = +$('input[name=leaderboard-tie]:checked').val()!

    let limit = +$('input[name=leaderboard-limit]:checked').val()!
    if (!limit || limit > data1.length) limit = data1.length
    const minPokes = +$('#poke-limit-lower').val()! || 1

    let buffer = ''
    for (let i = 0; i < limit; ++i) {
      if (data1[i].num < minPokes) break
      buffer += entryHTML(
        data1[i],
        data1[i].tie,
        data1[i].rank[tieBreaker],
        data1[i].rank[0]
      )
    }
    $('#leaderboard1').html(buffer)

    let done = 0
    buffer = ''
    for (let i = 0; done < limit && i < data2.length; ++i) {
      if (data2[i].num < minPokes) continue
      buffer += entryHTML(data2[i], TieType.NONE, i + 1, data2[i].rank[tieBreaker])
      done++
    }
    // $('#leaderboard2').html(buffer)
    $idA('leaderboard2').innerHTML = buffer

    // Add/restore timeago
    $('.timeago_dynamic').timeago()
  }

  function computeRanks (): void {
    let rDense = 0
    let rCompetition = 0
    let rModified = 0
    let rFractional = 0
    for (let i = 0; i < data1.length; ++i) {
      const cur = data1[i]
      // check for continued tie
      let tie = 0
      if (i && cur.num === data1[i - 1].num) {
        tie = 2
      } else {
        // recompute ranks
        ++rDense
        rCompetition = rModified = i + 1
        while (rModified < data1.length && cur.num === data1[rModified].num) ++rModified
        rFractional = (rCompetition + rModified) / 2
        // check for first tie
        tie = rCompetition !== rModified ? 1 : 0
      }
      const rOrdinal = i + 1

      data1[i].tie = tie
      data1[i].rank[1] = rDense
      data1[i].rank[2] = rCompetition
      data1[i].rank[3] = rFractional
      data1[i].rank[4] = rModified
      data1[i].rank[5] = rOrdinal
    }
    // Rank by time
    for (let i = 0; i < data2.length; ++i) data2[i].rank[0] = i + 1
  }

  function updateRanks (): void {
    updateLeaderboard()
  }

  function updatePoke (data: Record<string, PokeInfo>): void {
    function cmpTime (a: EntryInfo, b: EntryInfo) {
      // later time first
      return b.time - a.time
    }
    function cmpPokes (a: EntryInfo, b: EntryInfo) {
      // higher number first
      if (a.num !== b.num) return b.num - a.num
      // earlier time first
      return a.time - b.time
    }
    // Convert object to array, and filter out empty elements
    data1 = Object.keys(data).map(k => parseEntry(data[k], k))
    data2 = data1.slice(0) // shallow copy
    // Sort
    data1.sort(cmpPokes)
    data2.sort(cmpTime)
    // Compute ranks
    computeRanks()
    // Update leaderboard
    updateLeaderboard()
    // Update plot
    const xVals = Array.apply(null, Array(data1.length)).map((_, index) => index + 1)
    const firstTime = data2[0].time
    Plotly.restyle('opponentPlot', {
      x: [xVals, xVals],
      y: [data1.map(x => x.num), data2.map(x => (firstTime - x.time) / 86400)]
    }).then().catch()
  }

  function updateInfo (pokes: number, ticks: number): void {
    $('#poke_r').text(pokes.toLocaleString())
    $('#poke_t').text(ticks.toLocaleString())
    $('#poke_c').text((pokes * 100 / ticks).toFixed(4) + '%')
  }

  // Initialization scripts
  function initFirebase (): void {
    const config = {
      apiKey: 'AIzaSyDzwR0qYbl6QzA4pgw-LF7M6yxG2bWC7xo',
      databaseURL: 'https://victor-poke.firebaseio.com'
    }
    firebase.initializeApp(config)
    const db = firebase.database()
    db.ref('info').on('value', function (snapshot) {
      if (!snapshot) return
      const val = snapshot.val()
      updateInfo(val.pokes, val.ticks)
    })
    const pokeRef = db.ref('poke')
    pokeRef // .orderByChild('time')
    .on('value', function (snapshot) {
      if (!snapshot) return
      updatePoke(snapshot.val())
    })

  /*
      add = function (childSnapshot, prevChildKey) {
        // insert to lists in place
        computeRanks()
        // add to DOM
        updateRanks()
      }

      del = function (oldChildSnapshot) {
        // delete from lists
        // delete DOM
        computeRanks()
        updateRanks()
      }

      change = function (childSnapshot, prevChildKey) {
        // update lists
        computeRanks()
      }

      move = function (childSnapshot, prevChildKey) {
        // update lists?
      }
  */
  }

  // Ready handler
  $(function () {
    initFirebase()

    $('input[name=leaderboard-limit]').change(function () {
      updateLeaderboard()
      if (supportsLocalStorage()) localStorage.leaderboardLimit = $(this).val()
    })
    $('input[name=leaderboard-tie]').change(function () {
      updateRanks()
      if (supportsLocalStorage()) localStorage.leaderboardTie = $(this).val()
    })
    $('#poke-limit-lower').change(function () {
      updateRanks()
      if (supportsLocalStorage()) localStorage.leaderboardMinPokes = $(this).val()
    })

    if (supportsLocalStorage()) {
      const limit = localStorage.leaderboardLimit
      const tie = localStorage.leaderboardTie
      const minPokes = localStorage.leaderboardMinPokes
      if (limit) $('input:radio[name=leaderboard-limit][value="' + limit + '"]').click()
      if (tie) $('input:radio[name=leaderboard-tie][value="' + tie + '"]').click()
      if (minPokes) $('#poke-limit-lower').val(minPokes)
    }

    // Set up plot
    const data: Partial<Plotly.PlotData>[] = [
      { name: 'highest first', type: 'scatter'/*, line: {shape: 'linear'}*/ },
      { name: 'recent first', type: 'scatter'/*, line: {shape: 'linear'}*/, yaxis: 'y2' }
    ]
    const layout: Partial<Plotly.Layout> = {
      xaxis: { title: 'rank', type: 'log' },
      yaxis: { title: 'number of pokes', type: 'log' },
      yaxis2: { title: 'days before most recent poke', type: 'log', overlaying: 'y', side: 'right' },
      showlegend: false
    }
    Plotly.newPlot('opponentPlot', data, layout).then().catch()
  })

  // Resize handler
  $(window).resize(function () {
    Plotly.Plots.resize(Plotly.d3.select('#opponentPlot').node() as Plotly.Root)
  })
}

init()
