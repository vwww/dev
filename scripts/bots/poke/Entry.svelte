<script lang="ts">
import jQuery from 'jquery'
import 'timeago'

import JSSHA256 from 'jssha/dist/sha256'

import { onDestroy, onMount } from 'svelte'
import { type EntryInfo, TieType } from './EntryInfo'

interface Props {
  entry: EntryInfo
  tie: TieType
  rankIndex: number
  rankIndexOther: number
}

const {
  entry,
  tie,
  rankIndex,
  rankIndexOther,
}: Props = $props()

function getProfileImageURL (uid: string): string {
  const sha = new JSSHA256('SHA-256', 'TEXT')
    .update(uid)
    .getHash('HEX')

  return `https://gravatar.com/avatar/${sha}?s=80&d=identicon`
}

const rank = $derived(entry.rank[rankIndex])
const rankOther = $derived(entry.rank[rankIndexOther])
const time = $derived(new Date(entry.time * 1000))

let timeAgoElement: HTMLSpanElement | undefined = $state()

function timeAgoStart () {
  jQuery(timeAgoElement!).timeago()
}

function timeAgoStop () {
  jQuery(timeAgoElement!).timeago()
}

onMount(timeAgoStart)
onDestroy(timeAgoStop)
$effect(() => (entry.time, timeAgoStop(), timeAgoStart()))
</script>

<li class:indent={tie > 1}>
  <h1 data-rank={rank} class:tie><sup>#</sup>{rank}</h1>
  <h1 class="ranko" data-rank={rankOther}><sup>#</sup>{rankOther}</h1>
  <img src="{getProfileImageURL(entry.uid)}" alt="">
  <h2><a href="https://www.facebook.com/{entry.uid}">{entry.name}</a></h2>
  <h3>{entry.num.toLocaleString()}</h3>
  <span title={time.toISOString()} bind:this={timeAgoElement}>{time.toString()}</span>
</li>

<style>
li {
  position: relative;
  height: 80px;
  box-shadow: 0px 0px 5px 1px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;

  &.indent { margin-left: 1em; }
}

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

  &.ranko {
    left: inherit;
    right: 80px;
    background-color: #444;
    min-width: 30px;
    height: 19px;
    line-height: 19px;
    font-size: 1em;
  }
  &.tie { background-color: #ee5500; }
  &[data-rank="1"] { background-color: #0080b0; }
  &[data-rank="2"] { background-color: #7ac9de; }
  &[data-rank="3"] { background-color: #6aad2d; }
  &[data-rank="4"] { background-color: #cc8300; }
  &[data-rank="5"] { background-color: #cc1100; }
}

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
  &::before {
    content: url('../../assets/victorz/poke.png');
    padding-right: 0.25em;
  }
}

span {
  position: absolute;
  right: 96px;
  bottom: 8px;
  font-size: 1.1em;
}
</style>
