<script lang="ts">
import { OptionStoreBool } from './RoomOption.svelte'

export let option: OptionStoreBool[0]
export let store: OptionStoreBool[1]
</script>

<div>
  <span>{option[3]}</span>
  <label class="custom-control custom-switch">
    <input type="checkbox" class="custom-control-input" bind:checked={$store}>
    <small class="custom-control-label text-muted">{option[4]}</small>
  </label>
</div>
