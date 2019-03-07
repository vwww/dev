<script lang="ts">
import type { Snippet } from 'svelte'

interface Props {
  canClear: unknown
  onClear: () => void
  children: Snippet
}

const { canClear, onClear, children }: Props = $props()
</script>

<div class="card mb-3">
  <div class="card-header">
    <h4 class="float-start">Past Games</h4>
    <button class="btn btn-sm btn-danger float-end"
      class:d-none={!canClear}
      onclick={onClear}>Clear</button>
  </div>
  {@render children()}
</div>
