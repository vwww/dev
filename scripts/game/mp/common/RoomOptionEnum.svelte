<script lang="ts">
import type { OptionStoreEnum } from './RoomOption.svelte'

interface Props {
  option: OptionStoreEnum[0]
  store: OptionStoreEnum[1]
}

const { option, store }: Props = $props()
</script>

<div>
  <span>{option[3]}{#if $store !== option[2]}<small>*</small>{/if}</span>
  <div><small class="text-muted">{option[4]}</small></div>
  {#each option[5] as v, i}
    <label class="form-check form-check-inline">
      <input type="radio" class="form-check-input" bind:group={$store} value={i}>
      <span class="form-check-label">{v}</span>
    </label>
  {/each}
</div>
