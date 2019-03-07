<script lang="ts">
import type { OptionStoreEnum } from './RoomOption'

interface Props {
  option: OptionStoreEnum[0]
  store: OptionStoreEnum[1]
}

const { option, store }: Props = $props()
const [_id, _type, defaultValue, name, description, options] = $derived(option)
const changed = $derived(store.value !== defaultValue)
</script>

<div>
  <span>{name}{#if changed}<small>*</small>{/if}</span>
  <div><small class="text-muted">{description}</small></div>
  {#each options as optionLabel, value}
    <label class="form-check form-check-inline">
      <input type="radio" class="form-check-input" class:bg-info={changed && value === defaultValue} bind:group={store.value} {value}>
      <span class="form-check-label">{optionLabel}</span>
    </label>
  {/each}
</div>
