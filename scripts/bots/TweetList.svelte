<script lang="ts">
import { pState } from '@/util/svelte.svelte'
import { slide } from 'svelte/transition'

export type Tweet = [tweet: string, time?: Date]

interface Props {
  tweets: Tweet[]
  alwaysShowFull?: boolean
}

const { tweets, alwaysShowFull = false }: Props = $props()

let showFullTweet = pState('game/mp/_shared/showFullTweet', false)
</script>

<script module>
export const TWEET_LEN = 280
</script>

{#if !alwaysShowFull}
  <div class="input-group mb-3">
    <span class="input-group-text flex-grow-1">
      <label class="form-check mx-auto">
        <input type="checkbox" class="form-check-input" bind:checked={showFullTweet.value}>
        Show full tweet text
      </label>
    </span>
  </div>
{/if}

<div>
  {#each tweets as [tweet, date], i (i + tweet)}
    {@const exceed = tweet.length > TWEET_LEN}
    <div class="tweet my-2 px-3 py-2" class:showFull={alwaysShowFull || showFullTweet.value} transition:slide>
      <span class="badge text-bg-{exceed ? 'danger' : tweet.length === TWEET_LEN ? 'success' : 'warning'}">{tweet.length}</span>
      <span style="overflow-wrap: anywhere">{exceed ? tweet.slice(0, TWEET_LEN - 1) : tweet}</span>{#if exceed}
        <span class="text-muted">&hellip;</span><span class="text-danger">{tweet.slice(TWEET_LEN - 1)}</span>
      {/if}
      {#if date}
        <div class="text-muted text-end">{date.toISOString()}</div>
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
    span.text-muted {
      display: none;
    }
    .text-danger {
      display: initial;
    }
  }
}
</style>
