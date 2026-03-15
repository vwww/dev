<script lang="ts">
import { onMount } from 'svelte'

import { englishJoin, firstCap, randomArrayItem } from '@/util'

import TweetList, { type Tweet } from '../TweetList.svelte'

let rules: [sayError: string, correction: string][] = $state([])
let loadError: unknown = $state()
let tweets: Tweet[] = $state([])

function parseCSV (csv: string): void {
  for (const line of csv.split(/[\r\n]+/)) {
    if (line.indexOf('"') !== -1) {
      // CSV escapes are not supported yet
      throw new Error(line)
    }

    const parts = line.split(',')
    if (parts.length >= 2) {
      const [sayError, ...corrections] = parts.map((s) => `'${s}'`)
      rules.push([sayError, englishJoin('or', corrections)])
    }
  }
}

function randomTweet (): Tweet {
  const rule = randomArrayItem(rules)

  let [sayError, correction] = rule
  const saidPast = randomArrayItem(['used', 'said', 'tweeted', 'posted']) // (simple(past)perfect)
  const saidInfinitive1 = randomArrayItem(['use', 'say', 'tweet', 'post']) // without 'to'
  const seems = randomArrayItem(['seems', 'looks', 'appears'])
  const strange = randomArrayItem(['awkward', 'strange', 'weird'])
  sayError = randomArrayItem([
    `why did you ${saidInfinitive1} ${sayError}? `,
    `I don't think ${sayError} is in the dictionary`,
    `I've never seen ${sayError} in the dictionary! `,
    `${sayError} ${seems} ${strange}`,
    `to me, ${sayError} ${seems} ${strange}`,
    `${sayError} ${seems} ${strange} to me`,
    `I think you ${saidPast} ${sayError} by mistake`,
  ])

  const modalChance = randomArrayItem(['could', 'might'])
  // const modalObligationPerfect = randomArrayItem('should have', 'ought to have')
  const saidInfinitive = randomArrayItem(['use', 'say', 'tweet', 'post']) // reroll the dice
  const tryInfinitive = randomArrayItem(['use', 'say', 'tweet', 'post', 'try', 'try', 'try', 'try', 'try'])
  correction = randomArrayItem([
    `I think you meant ${correction}.`,
    `I think you meant to ${saidInfinitive} ${correction}.`,
    `${correction} ${modalChance} be a better choice.`,
    `${correction} ${modalChance} have been a better choice.`,
    `${tryInfinitive} ${correction} instead.`,
    `${tryInfinitive} ${correction} next time.`,
    `didn't you mean ${correction}?`,
    `didn't you mean to ${saidInfinitive} ${correction}?`,
  ])

  let capNext = true
  if (sayError.at(-1) != ' ') {
    if (Math.random() < 0.5) {
      sayError += ', so '
      capNext = false
    } else {
      sayError += '. '
    }
  }

  if (capNext) {
    correction = firstCap(correction)
  }

  return [`@user, ${sayError}${correction}`, new Date()]
}

function randomize (): void {
  const NUM_TWEETS = 16
  tweets = Array.from({ length: NUM_TWEETS }, randomTweet).reverse()
}

onMount(async () => {
  try {
    const res = await fetch('spelling.csv')
    parseCSV(await res.text())
    randomize()
  } catch (e) {
    console.error(loadError = e)
  }
})
</script>

{#if rules.length}
  <button class="btn btn-primary d-block w-100 mb-3" onclick={randomize}>Randomize</button>
{:else if loadError}
  <div class="alert alert-danger" role="alert">
    <h4 class="alert-heading">Error</h4>
    <pre>{(loadError as Error).stack ?? loadError}</pre>
  </div>
{:else}
  <div class="alert alert-warning" role="alert">
    This page is loading the word list&hellip;
  </div>
{/if}

<TweetList {tweets} alwaysShowFull />
