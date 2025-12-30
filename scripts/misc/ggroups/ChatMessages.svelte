<script lang="ts">
import ChatMessage from './ChatMessage.svelte'

interface Props {
  allowSecretSystemMessages: boolean
  rawTexts: string[]
  hide?: boolean
}

let { allowSecretSystemMessages, rawTexts, hide = $bindable(false) }: Props = $props()

function parseRawText (rawText: string, allowSecretSystemMessages: boolean): [msgClassNum: number, sender: string, text: string] {
  let msgClassNum = 0
  let sender = ''
  let text = ''

  if (rawText[0] === '#') {
    msgClassNum = 1 // '^m7^Cz'
    if (rawText[1] === 'T') text = rawText.slice(3)
    else if (rawText[1] === 'j') text = 'USER ' + rawText.slice(2) + ' JOINED'
    else if (rawText[1] === 'b') text = 'USER ' + rawText.slice(2) + ' BANNED'
    else if (rawText[1] === 'l') text = 'USER ' + rawText.slice(2) + ' LEFT'
    else if (rawText[1] === 'k') text = 'USER ' + rawText.slice(2) + ' KICKED'
    else {
      text = rawText
      msgClassNum = 3
    }
  } else if (rawText[0] === '!') {
    msgClassNum = 2 // '^Fr^M1^Cr'
    text = allowSecretSystemMessages ? rawText.slice(1).toUpperCase() : ''
  } else {
    let num = rawText.indexOf(':')
    if (num <= 0) num = 0

    sender = rawText.slice(0, num)
    text = rawText.slice(num + 1)
  }

  return [msgClassNum, sender, text]
}
</script>

{#if !hide}
  {#each rawTexts as rawText}
    {@const [msgClassNum, sender, text] = parseRawText(rawText, allowSecretSystemMessages)}
    {@const title = msgClassNum == 3 ? undefined : rawText}
    <ChatMessage {sender} {text} {msgClassNum} {title} />
  {/each}
{:else}
  <div class="my-1 text-center">
    <button class="btn btn-dark px-5 py-4" onclick={() => hide = false}>
      [click to show {rawTexts.length} hidden]
    </button>
  </div>
{/if}
