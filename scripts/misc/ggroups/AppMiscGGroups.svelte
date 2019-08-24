<script>
import ChatMessage from './ChatMessage'
import ChatMessageFromText from './ChatMessageFromText'

import { shuffle } from '../../util'

import { flip } from 'svelte/animate'

let allowSecretSystemMessages = true

const forumStringsOrig = window.textAsset
  .split(/[\r\n]+-+[\r\n]+/)
  .map(function (currentValue, index) {
    return {
      id: index,
      messages: currentValue.split(/[\r\n]+/).map(function (currentValue, index) {
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

function randomize(on) {
  forumStrings = forumStringsOrig
  if (on) {
    forumStrings = forumStrings.slice(0)
    shuffle(forumStrings)
  }
  window.console.log(forumStrings)
}

randomize(true)
</script>

<div class="btn-group d-flex" role="group">
  <button class={allowSecretSystemMessages ? 'btn btn-success active' : 'btn btn-warning'}
          on:click={() => allowSecretSystemMessages = !allowSecretSystemMessages}>
    Privileged Access
  </button>
  <button class="btn btn-secondary" on:click={() => randomize()}>Order</button>
  <button class="btn btn-primary" on:click={() => randomize(true)}>Randomize</button>
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
    <div animate:flip="{{duration: 500}}">
      <hr>
      {#each conversation.messages as rawText }
        <ChatMessageFromText {rawText} {allowSecretSystemMessages} />
      {/each}
    </div>
  {/each}

  <hr>

  <!-- "^m7^CzLEAVING #HACKING" -->
  <ChatMessage text="LEAVING #HACKING" msgClassNum={1} />

  <hr>
</div>
