<script lang="ts">
export let canClear: boolean
export let onClear: () => void
</script>

<div class="card mb-3">
  <div class="card-header">
    <h4 class="float-start">Past Games</h4>
    <button class="btn btn-sm btn-danger float-end"
      class:d-none={canClear}
      on:click={onClear}>Clear</button>
  </div>
  <slot />
</div>
