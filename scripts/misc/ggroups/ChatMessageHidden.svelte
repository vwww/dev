<script lang="ts">
import ChatMessageFromText from './ChatMessageFromText.svelte'

interface Props {
  allowSecretSystemMessages: boolean
  rawTexts: string[]
  show: boolean
}

let { allowSecretSystemMessages, rawTexts, show = $bindable() }: Props = $props()

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
    <button class="btn btn-dark px-5 py-4" onclick={reveal}>
      [click to show {rawTexts.length} hidden]
    </button>
  </div>
{/if}
