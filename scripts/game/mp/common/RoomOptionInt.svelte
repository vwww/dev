<script lang="ts">
import type { OptionStoreInt, OptionStoreBigInt } from './RoomOption'

interface Props {
  option: OptionStoreInt[0] | OptionStoreBigInt[0]
  store: OptionStoreInt[1] | OptionStoreBigInt[1]
}

const { option, store }: Props = $props()
const [_id, _type, defaultValue, name, description, min, max, extraProps] = $derived(option)
const changed = $derived(store.value !== defaultValue)
</script>

<div>
  <label class="w-100">
    <span>{name} <small class="text-muted">[{min} to {max}{#if changed}, default {defaultValue}{/if}]</small>{#if changed}<small>*</small>{/if}</span>
    <small class="text-muted d-block">{description}</small>
    <input type="number" class="form-control" bind:value={store.value} {min} {max} {...extraProps}>
    <input type="range" class="form-range" bind:value={store.value} {min} {max} {...extraProps}>
  </label>
</div>
