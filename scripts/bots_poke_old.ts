import $ from 'jquery'
import 'timeago'

import type { PokeInfo, TaggedPokeInfo } from './bots/poke/PokeInfo'
import type { PokeSource } from './bots/poke/PokeSource'
import PokeSourceFirebase from './bots/poke/PokeSourceFirebase'

// Handle updated poke data
function updateData (data: Record<string, PokeInfo>): void {
  // Remove timeago
  $('.poke-time').timeago('dispose')

  // Map pokes to array
  const pokes: TaggedPokeInfo[] = []
  for (const i in data) {
    if (!data[i]) continue
    pokes.push({
      ...data[i],
      uid: i
    })
  }

  const newHTML = pokes
    .sort((a, b) => (b.num - a.num) || (a.time - b.time)) // pokes descending, time ascending
    .map((currentValue, index) => {
      // Add to leaderboard text
      const date = new Date(currentValue.time * 1000)
      return '<tr>' +
        '<td>' + (index + 1) + '</td>' +
        '<td><img src="https://graph.facebook.com/' + currentValue.uid + '/picture" width="50" height="50"></td>' +
        '<td><a href="https://www.facebook.com/' + currentValue.uid + '">' + currentValue.name + '</a></td>' +
        '<td>' + currentValue.num.toLocaleString() + '</td>' +
        '<td class="poke-time" title="' + date.toISOString() + '">' + date.toString() + '</td>' +
        '</tr>'
    })
    .join('')

  // Update leaderboard text
  $('#leaderboard').html(newHTML)

  // Restore timeago
  $('.poke-time').timeago()
}

// Initialization script
$(() => {
  const pokeSource: PokeSource = new PokeSourceFirebase()
  pokeSource.onPokeUpdate(updateData)
})
