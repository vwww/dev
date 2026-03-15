<script lang="ts">
import Gen, { randomHex } from './Gen.svelte'
import Parse1 from './Parse1.svelte'
import Parse2 from './Parse2.svelte'
import { generate2_0 } from './Parse2_0.svelte'
import type { Tweet } from '../TweetList.svelte'

import { tick } from 'svelte'
import { pState } from '@/util/svelte.svelte'

const v = pState('bot/googuns/v', '')

async function validate (textbox: HTMLTextAreaElement) {
  const { selectionStart, selectionEnd } = textbox

  // Filter message characters and limit to length 280
  v.value = v.value.toLowerCase().replace(/[^0-9a-f]+/g, '')
  if (v.value.length >= 280) v.value = v.value.slice(0, 280)

  await tick()

  textbox.selectionStart = selectionStart
  textbox.selectionEnd = selectionEnd
}

function validateInput (this: HTMLTextAreaElement) {
  validate(this)
}


let tweets: Tweet[] = $state([])

function generateTweet (): Tweet {
  const now = new Date()
  const timeHex = Math.floor(+now / 1000).toString(16).padStart(16, '0')
  const rHex = randomHex(120)

  return [generate2_0(timeHex, rHex), now]
}

function generate (): void {
  const NUM_TWEETS = 16
  tweets = Array.from({ length: NUM_TWEETS }, generateTweet).reverse()
}

generate()
</script>

<style>
:global(td) {
  max-width: 100px;
  overflow-wrap: break-word;
}

.tweet {
  font-family: monospace;
  overflow-wrap: break-word;
}
</style>

<p>
  <a href="https://twitter.com/googuns_lulz">@googuns_lulz</a> was inspired by other <code>@googuns_</code> Twitter bots.

  Some parts of its messages are random, but some are defined.
</p>

<h2>Message Parser</h2>

<p>Copy and paste a tweet:</p>

<textarea class="form-control my-3" bind:value={v.value} oninput={validateInput} maxlength="280" placeholder={'0'.repeat(280)}></textarea>

<Parse2 value={v.value} />
<Parse1 value={v.value} />
<Gen onMsg={(val) => v.value = val} />

<h2>Notation</h2>
<pre class="card card-body text-bg-light">All fields are big endian.
&lt;&lt;&lt; = rol and &gt;&gt;&gt; = ror (bitwise rotations).
^ = bitwise XOR (exclusive OR).
~ = bitwise negation.
+ = concatenation.
data[a:b] = slice from data[a] to data[b-1], with a=0 and b=data.length by default; empty slice if a=b.
</pre>

<h2>Local Stream</h2>

<p>Here is a preview that generates random examples.</p>

<button class="btn btn-primary d-block w-100 mb-3" onclick={generate}>Generate</button>

<div class="list-group">
  {#each tweets as [tweet, date]}
    <button type="button" class="list-group-item list-group-item-action"
      class:active={v.value === tweet}
      onclick={() => v.value = tweet}>
      <span class="tweet">{tweet}</span>
      <div class="text-muted text-end">{date!.toISOString()}</div>
    </button>
  {/each}
</div>
