<script lang="ts">
import { OptionStoreEnum } from './RoomOption.svelte'

export let option: OptionStoreEnum[0]
export let store: OptionStoreEnum[1]
</script>

<div>
  <span>{option[3]}</span>
  <div><small class="text-muted">{option[4]}</small></div>
  {#each option[5] as v, i}
    <label class="form-check form-check-inline">
      <input type="radio" class="form-check-input" bind:group={$store} value={i}>
      <span class="form-check-label">{v}</span>
    </label>
  {/each}
</div>
