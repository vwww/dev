<script lang="ts">
import type { OptionStoreInt } from './RoomOption.svelte'

interface Props {
  option: OptionStoreInt[0]
  store: OptionStoreInt[1]
}

const { option, store }: Props = $props()
</script>

<div>
  <label class="w-100">
    <span>{option[3]} <small class="text-muted">[{option[5]} to {option[6]}]</small>{#if store.value !== option[2]}<small>*</small>{/if}</span>
    <small class="text-muted d-block">{option[4]}</small>
    <input type="number" class="form-control" bind:value={store.value} min={option[5]} max={option[6]} {...option[7]}>
    <input type="range" class="form-range" bind:value={store.value} min={option[5]} max={option[6]} {...option[7]}>
  </label>
</div>
