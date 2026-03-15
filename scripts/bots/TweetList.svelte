<script lang="ts">
import { pState } from '@/util/svelte.svelte'
import { slide } from 'svelte/transition'

interface Props {
  tweets: string[]
}

const { tweets }: Props = $props()

let showFullTweet = pState('game/mp/_shared/showFullTweet', false)
</script>

<script module>
export const TWEET_LEN = 280
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
  {#each tweets as tweet, i (i + tweet)}
    {@const exceed = tweet.length > TWEET_LEN}
    <div class="tweet my-2 px-3 py-2" class:showFull={showFullTweet.value} transition:slide>
      <span class="badge text-bg-{exceed ? 'danger' : tweet.length === TWEET_LEN ? 'success' : 'warning'}">{tweet.length}</span>
      <span>{exceed ? tweet.slice(0, TWEET_LEN - 1) : tweet}</span>{#if exceed}
        <span class="text-muted">&hellip;</span><span class="text-danger">{tweet.slice(TWEET_LEN - 1)}</span>
      {/if}
    </div>
  {/each}
</div>

<style>
.tweet {
  border: 1px dashed;
  font-size: 1.6em;

  .text-danger {
    display: none;
  }

  &:hover, &:active, &:focus {
    border: 1px solid;
  }

  &.showFull, &:hover, &:active, &:focus {
    .text-muted {
      display: none;
    }
    .text-danger {
      display: initial;
    }
  }
}
</style>
