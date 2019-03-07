<script lang="ts">
interface Props {
  showLo?: number
  showBehind?: number
  showAhead?: number
  showHi?: number
  pageCur: number
  pageMax: number
  onSetPage: (page: number) => void
}

const {
  showLo = 3,
  showBehind = 3,
  showAhead = 3,
  showHi = 3,
  pageCur,
  pageMax,
  onSetPage,
}: Props = $props()

const pageNumbers = $derived(Array.from(generatePageNumbers(pageCur, pageMax, showLo, showBehind, showAhead, showHi)))

function* generatePageNumbers (pageCur: number, pageMax: number, showLo: number, showBehind: number, showAhead: number, showHi: number) {
  let cur = 1

  const lo0 = Math.min(showLo, pageMax)
  while (cur <= lo0) {
    yield cur++
  }

  const lo1 = pageCur - showBehind
  if (cur + 1 < lo1) {
    yield 0
    cur = lo1
  }

  const hi1 = Math.min(pageCur + showAhead, pageMax)
  while (cur <= hi1) {
    yield cur++
  }

  const hi2 = pageMax - showHi + 1
  if (cur + 1 < hi2) {
    yield 0
    cur = hi2
  }

  while (cur <= pageMax) {
    yield cur++
  }
}
</script>

<nav>
  <ul class="pagination justify-content-center">
    <li class="page-item" class:disabled={pageCur === 1}>
      <button class="page-link" onclick={() => onSetPage(pageCur - 1)} aria-label="Previous">
        &lsaquo;
      </button>
    </li>
    {#each pageNumbers as page}
      {#if page < 1}
        <li class="page-item disabled">
          <button class="page-link" aria-hidden="true">&hellip;</button>
        </li>
      {:else if page === pageCur}
        <li class="page-item active">
          <input type="number" class="page-link" onblur={function () { onSetPage(Math.min(Math.max(Math.floor(this.value), 1), pageMax)) }} min=1 max={pageMax} step=1 value={pageCur} />
        </li>
      {:else}
        <li class="page-item">
          <button class="page-link" onclick={() => onSetPage(page)}>{page}</button>
        </li>
      {/if}
    {/each}
    <li class="page-item" class:disabled={pageCur === pageMax}>
      <button class="page-link" onclick={() => onSetPage(pageCur + 1)} aria-label="Next">
        &rsaquo;
      </button>
    </li>
  </ul>
</nav>
