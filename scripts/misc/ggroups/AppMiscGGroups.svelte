<script lang="ts">
import ChatMessage from './ChatMessage.svelte'
import ChatMessageHidden from './ChatMessages.svelte'

import { shuffle } from '@/util'
import { pState } from '@/util/svelte.svelte'

import { flip } from 'svelte/animate'

const allowSecrets = pState('misc/ggroups/allowSecretSystemMessages', true)
const searchQuery = pState('misc/ggroups/autoHistory', '')

const allowSecretSystemMessages = $derived(allowSecrets.value)

const forumStringsOrig = ((window as any).textAsset as string)
  .split(/[\r\n]+-+[\r\n]+/)
  .map(function (currentValue, index) {
    return {
      id: index,
      messages: currentValue.split(/[\r\n]+/).map(function (currentValue) {
        // (USED) O thisConsoleCallback && thisConsoleCallback()
        // C color = GetNextChar()
        // I ignoreDefaultPunctuationWaits ^= true
        // w waitMulti = GetNextChar() * 1
        // (USED) W waitMulti = GetNextChar() * 10
        // (USED) M waitMultiPersistent = GetNextChar() * 1
        // H waitMultiPersistent = 0.0001
        // Z waitMultiPersistent = 1.25
        // D baseSpeed++
        // > writingSpeed++
        // < writingSpeed--, writingSpeed < 1 && writingSpeed = 1
        // E waitsForEnter = true
        // m waitMultiPersistent = (float)(1 / int.Parse(GetNextChar().ToString()) * 1)
        // F parent && (parent is SHGUIguruchatwindow) && (parent as SHGUIguruchatwindow).SetFrameColor(GetNextChar())
        return currentValue.replace(/\^(O|[MW].)/g, '')
      })
    }
  })

let forumStrings = $state(forumStringsOrig)

type FilteredMessages = [rawTexts: string[], hide: boolean]
function* filterMessages (query: string, strings: string[]): Generator<FilteredMessages, void, void> {
  if (!query) return yield [strings, false]

  query = query.toLowerCase()

  let i = 0
  while (i < strings.length) {
    const start = i
    const hide = !strings[i].toLowerCase().includes(query)

    while (++i < strings.length && strings[i].toLowerCase().includes(query) !== hide);

    yield [strings.slice(start, i), hide]
  }
}

function randomize (on = false): void {
  forumStrings = forumStringsOrig
  if (on) {
    forumStrings = forumStrings.slice(0)
    shuffle(forumStrings)
  }
}

randomize(true)
</script>

<input class="form-control my-2" placeholder="Search" bind:value={searchQuery.value}>

<div class="btn-group d-flex my-2" role="group">
  <button class={allowSecretSystemMessages ? 'btn btn-success active' : 'btn btn-warning'}
      onclick={() => allowSecrets.value = !allowSecrets.value}>
    Privileged Access
  </button>
  <button class="btn btn-secondary" onclick={() => randomize()}>Order</button>
  <button class="btn btn-primary" onclick={() => randomize(true)}>Randomize</button>
</div>

<hr>

<h2>guruGROUPS</h2>

<div class="container">
  {#if allowSecretSystemMessages}
    <!-- "^Fr^Cr^m7^OLISTENING TO #HACKING. PRIVILEGED ACCESS." -->
    <ChatMessage text='LISTENING TO #HACKING. PRIVILEGED ACCESS.' msgClassNum={2} />
  {:else}
    <!-- "^m7^Cz^OLISTENING TO #HACKING." -->
    <ChatMessage text="LISTENING TO #HACKING." msgClassNum={1} />
  {/if}

  {#each forumStrings as conversation (conversation.id) }
    <div animate:flip="{{ duration: 500 }}">
      <hr>
      {#each filterMessages(searchQuery.value, conversation.messages) as rawText}
        {@const [rawTexts, hide] = rawText}
        <ChatMessageHidden {rawTexts} {hide} {allowSecretSystemMessages} />
      {/each}
    </div>
  {/each}

  <hr>

  <!-- "^m7^CzLEAVING #HACKING" -->
  <ChatMessage text="LEAVING #HACKING" msgClassNum={1} />

  <hr>
</div>
