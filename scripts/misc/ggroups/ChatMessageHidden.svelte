<script lang="ts">
import ChatMessageFromText from './ChatMessageFromText.svelte'

import type { Writable } from 'svelte/store'

interface Props {
  allowSecretSystemMessages: boolean
  rawTexts: string[]
  showStore: Writable<boolean>
}

const { allowSecretSystemMessages, rawTexts, showStore }: Props = $props()

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
    <button class="btn btn-dark px-5 py-4" onclick={reveal}>
      [click to show {rawTexts.length} hidden]
    </button>
  </div>
{/if}
