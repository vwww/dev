<script lang="ts">
import ChatMessageFromText from './ChatMessageFromText.svelte'

import { Writable } from 'svelte/store'

export let allowSecretSystemMessages: boolean
export let rawTexts: string[]
export let showStore: Writable<boolean>

function reveal () {
  $showStore = true
}
</script>

{#if $showStore}
  {#each rawTexts as rawText}
    <ChatMessageFromText {rawText} {allowSecretSystemMessages} />
  {/each}
{:else}
  <div class="my-1 text-center">
    <button class="btn btn-dark px-5 py-4" on:click={reveal}>
      [click to show {rawTexts.length} hidden]
    </button>
  </div>
{/if}
