<script>
import gcd from './gcd'

let zeroThreshold = 0.000000001
let maxIterations = 100000
let nums = '0.1337, 0.42'

let gcdText = ''
let lcmText = ''
$: {
  const numArray = nums.split(',').map(n => +n.trim())
  const gcdResult = numArray.reduce((acc, curVal) => gcd(acc, curVal, zeroThreshold, maxIterations))
  const lcmResult = numArray.reduce((acc, curVal) => acc / gcd(acc, curVal, zeroThreshold, maxIterations) * curVal)

  const numString = numArray.join(', ')

  gcdText = `gcd(${numString}) = ${gcdResult}`
  lcmText = `lcm(${numString}) = ${lcmResult}`
}
</script>

<div class="row">
  <div class="col-md-6">
    <div class="input-group">
      <div class="input-group-prepend">
        <span class="input-group-text">Zero Threshold: </span>
      </div>
      <input type="number" class="form-control" bind:value={zeroThreshold}>
    </div>
  </div>
  <div class="col-md-6">
    <div class="input-group">
      <div class="input-group-prepend">
        <span class="input-group-text">Iteration Limit: </span>
      </div>
      <input type="number" class="form-control" bind:value={maxIterations
    }>
    </div>
  </div>
  <div class="col-12">
    <div class="input-group">
      <div class="input-group-prepend">
        <span class="input-group-text">Numbers: </span>
      </div>
      <input type="text" class="form-control" bind:value={nums}>
      <div class="input-group-append">
        <span class="input-group-text">(comma-separated)</span>
      </div>
    </div>
  </div>
</div>

<p>{gcdText}</p>
<p>{lcmText}</p>
