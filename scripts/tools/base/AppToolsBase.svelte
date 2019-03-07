<script lang="ts">
import { pState } from '@/util/svelte.svelte'

const inNumber = pState('tool/base/iN', 'v1337')
const inBase = pState('tool/base/iB', 36)
const outBase = pState('tool/base/oB', 32)
const outValue = $derived(parseInt(inNumber.value, inBase.value).toString(outBase.value ?? 2))
</script>

<div class="row">
  <div class="col-md-6">
    <div class="input-group">
      <span class="input-group-text">Input: </span>
      <input type="text" class="form-control" bind:value={inNumber.value}>
      <span class="input-group-text">(base</span>
      <input type="number" class="form-control" bind:value={inBase.value} min="2" max="36" style="max-width: 4em">
      <span class="input-group-text">)</span>
    </div>
  </div>
  <div class="col-md-6">
    <div class="input-group">
      <span class="input-group-text">Output: </span>
      <input type="text" class="form-control" readonly value={outValue}>
      <span class="input-group-text">(base</span>
      <input type="number" class="form-control" bind:value={outBase.value} min="2" max="36" style="max-width: 4em">
      <span class="input-group-text">)</span>
    </div>
  </div>
</div>
