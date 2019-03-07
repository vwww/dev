<script lang="ts">
interface Props {
  ranks: string[]
  cards: (number | bigint)[]
}

const { ranks, cards }: Props = $props()

const total = $derived(cards.at(-1))
</script>

{#if total}
  {@const jokerIndex = cards.length - 2}
  {@const jokers = cards[jokerIndex]}
  {#if jokers}
    <span class="badge text-bg-light">{ranks[jokerIndex]}</span>{#if jokers > 1}{' '}&times;{jokers}{/if},
  {/if}
  {total} total.
  {@const cardsMain = cards.slice(0, -2)}
  {@const min = BigInt(cardsMain.filter((x) => x).reduce((v, cur) => (v < cur ? v : cur)))}
  {@const max = BigInt(cardsMain.reduce((v, cur) => (v > cur ? v : cur)))}
  {@const range = max - min}
  <table class="table table-sm">
    <tbody>
      {#each cardsMain as c, i}
        {#if c}
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
