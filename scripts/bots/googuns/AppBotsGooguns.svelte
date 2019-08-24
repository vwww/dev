<script>
import Parse1 from './Parse1'
import Parse2 from './Parse2'

import { tick } from 'svelte'

let value = ''

async function validate () {
  const { selectionStart, selectionEnd } = this

  // Filter message characters and limit to length 280
  value = value.toLowerCase().replace(/[^0-9a-f]+/g, '')
  if (value.length >= 280) value = value.slice(0, 280)

  await tick()

  this.selectionStart = selectionStart
	this.selectionEnd = selectionEnd
}
</script>

<style>
:global(td) {
  max-width: 100px;
  overflow-wrap: break-word;
}
</style>

<div class="row mb-3">
  <div class="col-sm-6 col-md-3 col-lg-2">
    <p>@googuns_lulz was inspired by other <code>@googuns_</code> Twitter bots.</p>

    <p>Some parts of its messages are random, but some are defined.</p>
  </div>
  <div class="col-sm-6 col-md-4 col-lg-4">
    <a class="twitter-timeline" data-height="300" data-chrome="nofooter" data-dnt="true" href="https://twitter.com/googuns_lulz">Tweets by @googuns_lulz</a>
    <script src="//platform.twitter.com/widgets.js" charset="utf-8"></script>
  </div>
  <div class="col-md-5 col-lg-6">
    <h2>Message Parser</h2>

    <p>Copy and paste a tweet:</p>

    <textarea class="form-control" bind:value on:input={validate} maxlength="280" placeholder={'0'.repeat(280)} />
  </div>
</div>

<Parse2 {value} />
<Parse1 {value} />

<h2>Notation</h2>
<pre class="card card-body bg-light">
All fields are big endian.
&lt;&lt;&lt; = rol and &gt;&gt;&gt; = ror (bitwise rotations).
^ = bitwise XOR (exclusive OR).
~ = bitwise negation.
+ = concatenation.
data[a:b] = slice from data[a] to data[b-1], with a=0 and b=data.length by default; empty slice if a=b.
</pre>
