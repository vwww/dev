<script lang="ts">
import { OptionStoreBool } from './RoomOption.svelte'

export let option: OptionStoreBool[0]
export let store: OptionStoreBool[1]
</script>

<div>
  <span>{option[3]}</span>
  <label class="form-check form-switch">
    <input type="checkbox" class="form-check-input" bind:checked={$store}>
    <small class="form-check-label text-muted">{option[4]}</small>
  </label>
</div>
