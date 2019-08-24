<script>
import { onMount } from 'svelte'
import { slide } from 'svelte/transition'

import { randomArrayItemZipf } from '../../util'

let rankedWords
let tweets = []

function getWord () {
  if (!rankedWords) return 'the'
  return randomArrayItemZipf(rankedWords)
}

function randomSentence (maxLen) {
  const result = []
  do {
    let newWord = getWord()
    if (maxLen && maxLen < newWord.length) {
      newWord = newWord.slice(0, maxLen - 1) + '&hellip;'
    }
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

function randomTweet (remain = 140) {
  const result = []
  while (remain > 1) {
    const newWords = randomSentence(remain)
    result.push(newWords)
    remain -= newWords.length + 1
  }

  return result.join('&mdash;')
}

function randomize () {
  const NUM_TWEETS = 32
  tweets = new Array(NUM_TWEETS).fill().map(randomTweet)
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
  <div class="btn-group d-flex mb-3" role="group">
    <button class="btn btn-primary" on:click={randomize}>Randomize</button>
  </div>
{:else}
  <div class="alert alert-danger" role="alert">This page is loading the word list&hellip;</div>
{/if}

<div>
  {#each tweets as tweet (tweet)}
    <p transition:slide|local>{@html tweet}</p>
  {/each}
</div>
