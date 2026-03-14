<script lang="ts">
import { slide } from 'svelte/transition'

const TWEET_LEN = 280

interface Props {
  tweets: [short: string, long?: string][]
}

const { tweets }: Props = $props()
</script>

<div>
  {#each tweets as [tweetShort, tweetFull], i (i + tweetShort)}
    <div class="t my-2 px-3 py-2" transition:slide title={tweetFull}>
      {#if tweetFull}
        <span class="badge text-bg-danger">{tweetFull.length}</span>
      {:else}
        <span class="badge text-bg-{tweetShort.length === TWEET_LEN ? 'success' : 'warning'}">{tweetShort.length}</span>
      {/if}
      {tweetShort}
    </div>
  {/each}
</div>

<style>
.t {
  border: 1px dashed;
  font-size: 1.6em;
}
</style>
