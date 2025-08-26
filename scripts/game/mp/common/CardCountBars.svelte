<script lang="ts">
interface Props {
  ranks: string[]
  cards: (number | bigint)[]
}

const { ranks, cards }: Props = $props()
</script>

{#if cards.at(-1)}
  {@const max = BigInt(cards.slice(0, -1).reduce((v, cur) => (v > cur ? v : cur)))}
  <table class="table table-sm">
    <tbody>
      {#each cards as c, i}
        {#if c && i + 1 < cards.length}
          <tr>
            <td>{ranks[i]}</td>
            <td class="w-100">
              <div class="progress my-1">
                <div class="progress-bar" style="width: {Number(BigInt(c) * 100000n / max) / 1000}%"></div>
              </div>
            </td>
            <td>{c}</td>
          </tr>
        {/if}
      {/each}
    </tbody>
  </table>
{/if}
