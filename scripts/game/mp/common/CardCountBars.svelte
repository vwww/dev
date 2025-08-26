<script lang="ts">
interface Props {
  ranks: string[]
  cards: (number | bigint)[]
}

const { ranks, cards }: Props = $props()
</script>

{#if cards.at(-1)}
  {@const min = BigInt(cards.filter((x) => x).reduce((v, cur) => (v < cur ? v : cur)))}
  {@const range = BigInt(cards.slice(0, -1).reduce((v, cur) => (v > cur ? v : cur))) - min}
  <table class="table table-sm">
    <tbody>
      {#each cards as c, i}
        {#if c && i + 1 < cards.length}
          <tr>
            <td>{ranks[i]}</td>
            <td class="w-100">
              {#if range}
                <div class="progress-stacked my-1">
                  <div class="progress" style="width: 3.125%">
                    <div class="progress-bar bg-info"></div>
                  </div>
                  {#if c > min}
                    <div class="progress" style="width:{Number((BigInt(c) - min) * 96875n / range) / 1000}%">
                      <div class="progress-bar"></div>
                    </div>
                  {/if}
                </div>
              {:else}
                <div class="progress bg-primary"></div>
              {/if}
            </td>
            <td>{c}</td>
          </tr>
        {/if}
      {/each}
    </tbody>
  </table>
{/if}
