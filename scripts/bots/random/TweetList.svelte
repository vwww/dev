<script lang="ts">
import { slide } from 'svelte/transition'

const TWEET_LEN = 280

interface Props {
  tweets: [short: string, long?: string][]
}

const { tweets }: Props = $props()
</script>

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

<style>
p {
  border: 1px dashed;
  display: inline-block;
  font-size: 1.6em;
  position: relative;
}
</style>
