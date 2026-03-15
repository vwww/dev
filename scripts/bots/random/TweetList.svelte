<script lang="ts">
import { pState } from '@/util/svelte.svelte'
import { slide } from 'svelte/transition'

const TWEET_LEN = 280

interface Props {
  tweets: [short: string, long?: string][]
}

const { tweets }: Props = $props()

let showFullTweet = pState('game/mp/_shared/showFullTweet', false)
</script>

<div class="input-group mb-3">
  <span class="input-group-text flex-grow-1">
    <label class="form-check mx-auto">
      <input type="checkbox" class="form-check-input" bind:checked={showFullTweet.value}>
      Show full tweet text
    </label>
  </span>
</div>

<div>
  {#each tweets as [tweetShort, tweetFull], i (i + tweetShort)}
    <div class="tweet my-2 px-3 py-2" class:showFull={showFullTweet.value} transition:slide title={tweetFull}>
      {#if tweetFull}
        <span class="badge text-bg-danger">{tweetFull.length}</span>
      {:else}
        <span class="badge text-bg-{tweetShort.length === TWEET_LEN ? 'success' : 'warning'}">{tweetShort.length}</span>
      {/if}
      <span class="body" data-short={tweetShort} data-full={tweetFull || tweetShort}></span>
    </div>
  {/each}
</div>

<style>
.tweet {
  border: 1px dashed;
  font-size: 1.6em;

  .body::after {
    content: attr(data-short);
  }

  &:hover, &:active, &:focus {
    border: 1px solid;
  }

  &.showFull, &:hover, &:active, &:focus {
    .body::after {
      content: attr(data-full);
    }
  }
}
</style>
