<script lang="ts">
import type { OptionStoreEnum } from './RoomOption'

interface Props {
  option: OptionStoreEnum[0]
  store: OptionStoreEnum[1]
}

const { option, store }: Props = $props()
const [_id, _type, defaultValue, name, description, options] = $derived(option)
</script>

<div>
  <span>{name}{#if store.value !== defaultValue}<small>*</small>{/if}</span>
  <div><small class="text-muted">{description}</small></div>
  {#each options as optionLabel, value}
    <label class="form-check form-check-inline">
      <input type="radio" class="form-check-input" bind:group={store.value} {value}>
      <span class="form-check-label">{optionLabel}</span>
    </label>
  {/each}
</div>
