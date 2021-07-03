<script lang="ts">
import Pagination from './Pagination.svelte'

export let showLo: number | undefined = undefined
export let showBehind: number | undefined = undefined
export let showAhead: number | undefined = undefined
export let showHi: number | undefined = undefined
export let pageCur: number
export let pageMax: number
export let onSetPage: (page: number) => void
</script>

<nav>
  <ul class="pagination justify-content-center">
    <li class="page-item" class:disabled={pageCur === 1}>
      <button class="page-link" on:click={() => onSetPage(pageCur - 1)} aria-label="Previous">
        &lsaquo;
      </button>
    </li>
    <Pagination
      {showLo}
      {showBehind}
      {showAhead}
      {showHi}
      {pageCur}
      {pageMax}
      let:page>
      {#if page < 1}
        <li class="page-item disabled">
          <button class="page-link" aria-hidden="true">&hellip;</button>
        </li>
      {:else if page === pageCur}
        <li class="page-item active">
          <input type="number" class="page-link" on:blur={function () { onSetPage(Math.min(Math.max(this.value | 0, 1), pageMax)) }} min=1 max={pageMax} step=1 value={pageCur} />
        </li>
      {:else}
        <li class="page-item">
          <button class="page-link" on:click={() => onSetPage(page)}>{page}</button>
        </li>
      {/if}
    </Pagination>
    <li class="page-item" class:disabled={pageCur === pageMax}>
      <button class="page-link" on:click={() => onSetPage(pageCur + 1)} aria-label="Next">
        &rsaquo;
      </button>
    </li>
  </ul>
</nav>
