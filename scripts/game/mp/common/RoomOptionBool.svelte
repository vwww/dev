<script lang="ts">
import type { OptionStoreBool } from './RoomOption'

interface Props {
  option: OptionStoreBool[0]
  store: OptionStoreBool[1]
}

const { option, store }: Props = $props()
const [_id, _type, defaultValue, name, description] = $derived(option)
const changed = $derived(store.value !== defaultValue)
</script>

<div>
  <label>
    <span>{name}{#if changed}<small>*</small>{/if}</span>
    <span class="form-check form-switch">
      <input type="checkbox" class="form-check-input" class:bg-info={changed} bind:checked={store.value}>
      <small class="form-check-label text-muted">{description}</small>
    </span>
  </label>
</div>
