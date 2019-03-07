<script>
export let canClear
export let onClear
</script>

<div class="card mb-3">
  <div class="card-header">
    <h4 class="float-left">Past Games</h4>
    <button class="btn btn-sm btn-danger float-right"
      class:d-none={canClear}
      on:click={onClear}>Clear</button>
  </div>
  <slot />
</div>
