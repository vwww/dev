<script lang="ts">
import jQuery from 'jquery'
import 'timeago'

import { onDestroy, onMount } from 'svelte'
import { EntryInfo, TieType } from './EntryInfo'

export let entry: EntryInfo
export let tie: TieType
export let rankIndex: number, rankIndexOther: number

// Format rank as HTML
function rankSuffix (rank: number): string {
  if (rank === (rank | 0)) { // 1.5th
    let x = rank % 100
    // ignore suffix for 11th, 12th, 13th
    if (!(x > 3 && x < 21)) {
      x %= 10
      if (x === 1) return 'st'
      if (x === 2) return 'nd'
      if (x === 3) return 'rd'
    }
  }
  return 'th'
}

$: rank = entry.rank[rankIndex]
$: rankOther = entry.rank[rankIndexOther]
$: time = new Date(entry.time * 1000)

let timeAgoElement: HTMLSpanElement

function timeAgoStart () {
  jQuery(timeAgoElement).timeago()
}

function timeAgoStop () {
  jQuery(timeAgoElement).timeago()
}

onMount(timeAgoStart)
onDestroy(timeAgoStop)
$: entry.time, timeAgoStop(), timeAgoStart()
</script>

<li class:indent={tie > 1}>
  <h1 data-rank={rank} class:tie>{rank}<sup>{rankSuffix(rank)}</sup></h1>
  <h1 class="ranko" data-rank={rankOther}>{rankOther}<sup>{rankSuffix(rankOther)}</sup></h1>
  <img src={`https://graph.facebook.com/${entry.uid}/picture?width=80&height=80`} alt="">
  <h2><a href={'https://www.facebook.com/' + entry.uid}>{entry.name}</a></h2>
  <h3>{entry.num.toLocaleString()}</h3>
  <span title={time.toISOString()} bind:this={timeAgoElement}>{time.toString()}</span>
</li>

<style>
li {
  position: relative;
  height: 80px;
  box-shadow: 0px 0px 5px 1px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

li.indent { margin-left: 1em; }

h1 {
  position: absolute;
  left: 0;
  margin: 0;
  background: #333;
  color: white;
  text-align: center;
  padding: 0 0.5em;
  min-width: 61px;
  height: 38px;
  line-height: 38px;
  font-size: 1.5em;
}

h1.ranko {
  left: inherit;
  right: 80px;
  background-color: #444;
  min-width: 30px;
  height: 19px;
  line-height: 19px;
  font-size: 1em;
}
h1.tie { background-color: #ee5500; }
h1[data-rank="1"] { background-color: #0080b0; }
h1[data-rank="2"] { background-color: #7ac9de; }
h1[data-rank="3"] { background-color: #6aad2d; }
h1[data-rank="4"] { background-color: #cc8300; }
h1[data-rank="5"] { background-color: #cc1100; }

img {
  position: absolute;
  right: 0;
  width: 80px;
  height: 80px;
}
h2 {
  margin: 0 100px 0 61px;
  padding-top: 2px;
  font-size: 2.2em;
  text-align: center;
}
h3 {
  margin: 0;
  position: absolute;
  left: 12px;
  bottom: 8px;
  font-size: 1.8em;
}
h3::before {
  content: url('../../assets/victorz/poke.png');
  padding-right: 0.25em;
}

span {
  position: absolute;
  right: 96px;
  bottom: 8px;
  font-size: 1.1em;
}
</style>
