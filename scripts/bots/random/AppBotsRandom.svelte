<script lang="ts">
import { onMount } from 'svelte'
import { slide } from 'svelte/transition'

import { randomArrayItemZipf } from '@/util'

const TWEET_LEN = 280

type Tweet = [short: string, long?: string]

let rankedWords: string[] | undefined = $state()
let tweets: Tweet[] = $state([])

function getWord (): string {
  if (!rankedWords) return 'the'
  return randomArrayItemZipf(rankedWords)
}

function randomSentence (maxLen: number): string {
  const result = []
  do {
    let newWord = getWord()
    result.push(newWord)
    if (maxLen) {
      maxLen -= newWord.length + 1
      if (maxLen <= 1) {
        break
      }
    }
  } while (Math.random() < 0.8)
  return result.join(' ')
}

function randomTweet (maxLen = TWEET_LEN): Tweet {
  const result = []
  let remain = maxLen
  while (remain > 1) {
    const newWords = randomSentence(remain)
    result.push(newWords)
    remain -= newWords.length + 1
  }

  const tweet = result.join('\u2014') // '&mdash;'
  if (tweet.length > maxLen) {
    const tweetShort = tweet.slice(0, maxLen - 1) + '\u2026' // '&hellip;'
    return [tweetShort, tweet]
  }
  return [tweet]
}

function randomize (): void {
  const NUM_TWEETS = 16
  tweets = Array.from({ length: NUM_TWEETS }, randomTweet)
}

onMount(async () => {
  const res = await fetch('random_rankedWords.json')
  rankedWords = await res.json()
  randomize()
})
</script>

<style>
p {
	border: 1px dashed;
	display: inline-block;
	font-size: 1.6em;
	position: relative;
}
</style>

{#if rankedWords}
  <button class="btn btn-primary d-block w-100 mb-3" onclick={randomize}>Randomize</button>
{:else}
  <div class="alert alert-danger" role="alert">This page is loading the word list&hellip;</div>
{/if}

<div>
  {#each tweets as [tweetShort, tweetFull] (tweetShort)}
    <p transition:slide title={tweetFull}>
      {#if tweetFull}
        <span class="badge text-bg-danger">{tweetFull.length}</span>
      {:else}
        <span class="badge text-bg-{tweetShort.length === TWEET_LEN ? 'success' : 'warning'}">{tweetShort.length}</span>
      {/if}
      {tweetShort}
    </p>
  {/each}
</div>
