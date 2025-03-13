<script lang="ts">
import type { OptionStoreBool } from './RoomOption'

interface Props {
  option: OptionStoreBool[0]
  store: OptionStoreBool[1]
}

const { option, store }: Props = $props()
const [_id, _type, defaultValue, name, description] = $derived(option)
</script>

<div>
  <label>
    <span>{name}{#if store.value !== defaultValue}<small>*</small>{/if}</span>
    <span class="form-check form-switch">
      <input type="checkbox" class="form-check-input" bind:checked={store.value}>
      <small class="form-check-label text-muted">{description}</small>
    </span>
  </label>
</div>
