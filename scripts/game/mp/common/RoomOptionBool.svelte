<script lang="ts">
import type { OptionStoreBool } from './RoomOption.svelte'

export let option: OptionStoreBool[0]
export let store: OptionStoreBool[1]
</script>

<div>
  <label>
    <span>{option[3]}{#if $store !== option[2]}<small>*</small>{/if}</span>
    <span class="form-check form-switch">
      <input type="checkbox" class="form-check-input" bind:checked={$store}>
      <small class="form-check-label text-muted">{option[4]}</small>
    </span>
  </label>
</div>
