<script lang="ts">
import { OptionStoreEnum } from './RoomOption.svelte'

export let option: OptionStoreEnum[0]
export let store: OptionStoreEnum[1]
</script>

<div>
  <span>{option[3]}</span>
  <div><small class="text-muted">{option[4]}</small></div>
  {#each option[5] as v, i}
    <label class="custom-control custom-control-inline custom-radio">
      <input type="radio" class="custom-control-input" bind:group={$store} value={i}>
      <span class="custom-control-label">{v}</span>
    </label>
  {/each}
</div>
