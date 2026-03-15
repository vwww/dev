<script lang="ts">
import { onMount } from 'svelte'

import { randomArrayItemZipf } from '@/util'

import TweetList, { TWEET_LEN, type Tweet } from '../TweetList.svelte'

let rankedWords: string[] | undefined = $state()
let loadError: unknown = $state()
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

function randomTweet (): Tweet {
  const result = []
  let remain = TWEET_LEN
  while (remain > 1) {
    const newWords = randomSentence(remain)
    result.push(newWords)
    remain -= newWords.length + 1
  }

  return [result.join('\u2014'), new Date()] // '&mdash;'
}

function randomize (): void {
  const NUM_TWEETS = 16
  tweets = Array.from({ length: NUM_TWEETS }, randomTweet).reverse()
}

onMount(async () => {
  try {
    const res = await fetch('random_rankedWords.json')
    rankedWords = await res.json()
    randomize()
  } catch (e) {
    console.error(loadError = e)
  }
})
</script>

{#if rankedWords}
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

<TweetList {tweets} />
