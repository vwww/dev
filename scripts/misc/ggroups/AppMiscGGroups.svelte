<script lang="ts">
import ChatMessage from './ChatMessage.svelte'
import ChatMessageFromText from './ChatMessageFromText.svelte'
import ChatMessageHidden from './ChatMessageHidden.svelte'

import { shuffle } from '@/util'
import { pStore } from '@/util/svelte'

import { flip } from 'svelte/animate'

const allowSecretSystemMessages = pStore('misc/ggroups/allowSecretSystemMessages', true)
const searchQuery = pStore('misc/ggroups/autoHistory', '')

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

let forumStrings = forumStringsOrig

function* filterMessages (query: string, strings: string[]) {
  if (!query) return yield* strings

  query = query.toLowerCase()

  let nextEmit = 0
  for (let i = 0; i < strings.length; i++) {
    const s = strings[i]

    if (!s.toLowerCase().includes(query)) {
      continue
    }

    if (nextEmit < i) {
      yield strings.slice(nextEmit, i)
    }

    yield s
    nextEmit = i + 1
  }

  if (nextEmit < strings.length) {
    yield strings.slice(nextEmit)
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

<input class="form-control my-2" placeholder="Search" bind:value={$searchQuery}>

<div class="btn-group d-flex my-2" role="group">
  <button class={$allowSecretSystemMessages ? 'btn btn-success active' : 'btn btn-warning'}
      on:click={() => { $allowSecretSystemMessages = !$allowSecretSystemMessages }}>
    Privileged Access
  </button>
  <button class="btn btn-secondary" on:click={() => randomize()}>Order</button>
  <button class="btn btn-primary" on:click={() => randomize(true)}>Randomize</button>
</div>

<hr>

<h2>guruGROUPS</h2>

<div class="container">
  {#if $allowSecretSystemMessages}
    <!-- "^Fr^Cr^m7^OLISTENING TO #HACKING. PRIVILEGED ACCESS." -->
    <ChatMessage text='LISTENING TO #HACKING. PRIVILEGED ACCESS.' msgClassNum={2} />
  {:else}
    <!-- "^m7^Cz^OLISTENING TO #HACKING." -->
    <ChatMessage text="LISTENING TO #HACKING." msgClassNum={1} />
  {/if}

  {#each forumStrings as conversation (conversation.id) }
    <div animate:flip="{{ duration: 500 }}">
      <hr>
      {#each Array.from(filterMessages($searchQuery, conversation.messages)) as rawText (rawText)}
        {#if typeof rawText == 'string'}
          <ChatMessageFromText {rawText} allowSecretSystemMessages={$allowSecretSystemMessages} />
        {:else}
          <ChatMessageHidden rawTexts={rawText} allowSecretSystemMessages={$allowSecretSystemMessages} />
        {/if}
      {/each}
    </div>
  {/each}

  <hr>

  <!-- "^m7^CzLEAVING #HACKING" -->
  <ChatMessage text="LEAVING #HACKING" msgClassNum={1} />

  <hr>
</div>
