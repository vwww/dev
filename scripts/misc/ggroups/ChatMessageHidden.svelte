<script lang="ts">
import ChatMessageFromText from './ChatMessageFromText.svelte'

export let allowSecretSystemMessages: boolean
export let rawTexts: string[]

let show = false

function reveal () {
  show = true
}
</script>

{#if show}
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
