<script lang="ts">
import { OptionStoreInt } from './RoomOption.svelte'

export let option: OptionStoreInt[0]
export let store: OptionStoreInt[1]
</script>

<div>
  <span>{option[3]} (min: {option[5]}, max: {option[6]})</span>
  <div><small class="text-muted">{option[4]}</small></div>
  <input type="number" class="form-control" bind:value={$store} min={option[5]} max={option[6]} {...option[7]}>
  <input type="range" class="custom-range" bind:value={$store} min={option[5]} max={option[6]} {...option[7]}>
</div>
