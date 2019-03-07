<script>
import { pStore } from '../../util/svelte'

const inNumber = pStore('tool/base/iN', 'v1337')
const inBase = pStore('tool/base/iB', 36)
const outBase = pStore('tool/base/oB', 32)
$: outValue = parseInt($inNumber, $inBase).toString($outBase)
</script>

<div class="row">
  <div class="col-md-6">
    <div class="input-group">
      <div class="input-group-prepend">
        <span class="input-group-text">Input: </span>
      </div>
      <input type="text" class="form-control" bind:value={$inNumber}>
      <div class="input-group-prepend input-group-append">
        <span class="input-group-text">(base</span>
      </div>
      <input type="number" class="form-control" bind:value={$inBase} min="2" max="36" style="max-width: 4em">
      <div class="input-group-append">
        <span class="input-group-text">)</span>
      </div>
    </div>
  </div>
  <div class="col-md-6">
    <div class="input-group">
        <div class="input-group-prepend">
          <span class="input-group-text">Output: </span>
        </div>
      <input type="text" class="form-control" readonly value={outValue}>
      <div class="input-group-prepend input-group-append">
        <span class="input-group-text">(base</span>
      </div>
      <input type="number" class="form-control" bind:value={$outBase} min="2" max="36" style="max-width: 4em">
      <div class="input-group-append">
        <span class="input-group-text">)</span>
      </div>
    </div>
  </div>
</div>
