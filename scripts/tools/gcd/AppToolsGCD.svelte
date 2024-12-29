<script lang="ts">
import { gcd } from '@/util'
import { pStore } from '@/util/svelte'

const zeroThreshold = pStore('tool/gcd/zero', 0.000000001)
const maxIterations = pStore('tool/gcd/maxIter', 100000)
const nums = pStore('tool/gcd/nums', '0.1337, 0.42')

const [gcdText, lcmText] = $derived.by(() => {
  const numArray = $nums.split(',').map(n => +n.trim())
  const gcdResult = numArray.reduce((acc, curVal) => gcd(acc, curVal, $zeroThreshold, $maxIterations))
  const lcmResult = numArray.reduce((acc, curVal) => acc / gcd(acc, curVal, $zeroThreshold, $maxIterations) * curVal)

  const numString = numArray.join(', ')

  return [
    `gcd(${numString}) = ${gcdResult}`,
    `lcm(${numString}) = ${lcmResult}`,
  ]
})
</script>

<div class="row">
  <div class="col-md-6 mb-2">
    <div class="input-group">
      <span class="input-group-text">Zero Threshold: </span>
      <input type="number" class="form-control" bind:value={$zeroThreshold}>
    </div>
  </div>
  <div class="col-md-6 mb-2">
    <div class="input-group">
      <span class="input-group-text">Iteration Limit: </span>
      <input type="number" class="form-control" bind:value={$maxIterations
    }>
    </div>
  </div>
  <div class="col-12 mb-3">
    <div class="input-group">
      <span class="input-group-text">Numbers: </span>
      <input type="text" class="form-control" bind:value={$nums}>
      <span class="input-group-text">(comma-separated)</span>
    </div>
  </div>
</div>

<p>{gcdText}</p>
<p>{lcmText}</p>
