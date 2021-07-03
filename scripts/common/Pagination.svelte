<script lang="ts">
export let showLo = 3
export let showBehind = 3
export let showAhead = 3
export let showHi = 3
export let pageCur: number
export let pageMax: number

$: pageNumbers = Array.from(generatePageNumbers(pageCur, pageMax, showLo, showBehind, showAhead, showHi))

function* generatePageNumbers (pageCur: number, pageMax: number, showLo: number, showBehind: number, showAhead: number, showHi: number) {
  const lo = Math.max(pageCur - showBehind, 1)
  const hi = Math.min(pageCur + showAhead, pageMax)

  let cur = 1
  while (cur <= showLo) {
    yield cur++
  }

  if (cur + 1 < lo) {
    yield 0
    cur = lo
  }

  while (cur <= hi) {
    yield cur++
  }

  const hiStart = pageMax - showHi
  if (cur + 1 < hiStart) {
    yield 0
    cur = hiStart
  }

  while (cur <= pageMax) {
    yield cur++
  }
}
</script>

{#each pageNumbers as pageNumber}
  <slot page={pageNumber} />
{/each}
