<script lang="ts">
interface Props {
  ranks: string[]
  cards: (number | bigint)[]
}

const { ranks, cards }: Props = $props()
</script>

{#each cards as c, i}
  {#if c}
    {#if i + 1 == cards.length}
      {' '}{c} total.
    {:else}
      <span class="badge text-bg-light">{ranks[i]}</span>{#if c > 1}{' '}&times;{c}{/if},{' '}
    {/if}
  {/if}
{/each}
