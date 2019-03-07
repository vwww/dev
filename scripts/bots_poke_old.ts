import { PokeInfo, TaggedPokeInfo } from './bots/poke/PokeInfo'

declare const firebase: typeof import('firebase')

// Handle updated poke data
function updateData (data: Record<string, PokeInfo>) {
  // Remove timeago
  // $('.poke-time').timeago('dispose')

  // Map pokes to array
  const pokes: TaggedPokeInfo[] = []
  for (const i in data) {
    if (!data[i]) continue
    pokes.push({
      ...data[i],
      uid: i
    })
  }

  let newHTML = ''
  pokes.sort(function (a, b) {
    // pokes descending
    if (a.num !== b.num) return b.num - a.num
    // time ascending
    if (a.time !== b.time) return a.time - b.time
    // no tiebreaker
    return 0
  }).map(function (currentValue, index) {
    // Add to leaderboard text
    const date = new Date(currentValue.time * 1000)
    newHTML +=
      '<tr>' +
      '<td>' + (index + 1) + '</td>' +
      '<td><img src="https://graph.facebook.com/' + currentValue.uid + '/picture" width="50" height="50"></td>' +
      '<td><a href="https://www.facebook.com/' + currentValue.uid + '">' + currentValue.name + '</a></td>' +
      '<td>' + currentValue.num.toLocaleString() + '</td>' +
      '<td class="poke-time" title="' + date.toISOString() + '">' + date.toString() + '</td>' +
      '</tr>'
  })
  // Update leaderboard text
  $('#leaderboard').html(newHTML)

  // Restore timeago
  $('.poke-time').timeago()
}

// Initialization scripts

/*
function initSimperium () {
  const simperium = new Simperium('brake-foods-bc7', { token: 'ce4832ce12e24ee6860886d9b4567b12' })

  const bucket = simperium.bucket('stats')
  bucket.on('notify', function (id, data) {
    //console.log(id + ' was updated to')
    //console.log(data)
    if (id === 'p') updateData(data)
  })
  bucket.start()
}
*/

function initFirebase () {
  const config = {
    apiKey: 'AIzaSyDzwR0qYbl6QzA4pgw-LF7M6yxG2bWC7xo',
    databaseURL: 'https://victor-poke.firebaseio.com'
  }
  firebase.initializeApp(config)

  firebase.database().ref('poke').on('value', function (snapshot) {
    if (!snapshot) return
    // console.log('/poke:value')
    // console.log(snapshot.val())
    updateData(snapshot.val())
  })
}

$(document).ready(initFirebase)
