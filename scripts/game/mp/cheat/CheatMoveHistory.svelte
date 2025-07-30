<script lang="ts">
import type { CheatMoveInfo } from './CheatGame.svelte'
import { ranks } from './CheatPlay.svelte'

interface Props {
  moves: ArrayLike<CheatMoveInfo>
  isSkip: boolean
}

const { moves, isSkip }: Props = $props()
</script>

<b>Move History</b>
{#each moves as m}
  <br>
  {#if m.type == 'move'}
    {@const outline = m.playerIsMe ? '' : '-outline'}
    <span class="badge text-bg{outline}-primary">{m.playerName}</span> played <span class="badge text-bg-light">{ranks[m.rank]}</span>{#if m.count > 1}{' '}&times;{m.count}{/if}.
  {:else if m.type == 'pass'}
    {@const outline = m.playerIsMe ? '' : '-outline'}
    <span class="badge text-bg{outline}-primary">{m.playerName}</span> {isSkip ? 'skipp' : 'pass'}ed.
  {:else if m.type == 'callSuccess'}
    {@const outline = m.playerIsMe ? '' : '-outline'}
    {@const outlineV = m.victimIsMe ? '' : '-outline'}
    <span class="badge text-bg{outline}-success">{m.playerName}</span> called cheat successfully on <span class="badge text-bg{outlineV}-danger">{m.victimName}</span>.
  {:else if m.type == 'callFail'}
    {@const outline = m.playerIsMe ? '' : '-outline'}
    <span class="badge text-bg{outline}-danger">{m.playerName}</span> called cheat wrongfully.
  {:else if m.type == 'penalty' || m.type == 'reveal' || m.type == 'reveal2'}
    {({
      play: 'You played',
      penalty: 'You took',
      reveal: 'Previous move',
      reveal2: 'Cards under previous move',
    }[m.type])}:
    {#each m.cards as c, i}
      {#if c}
        {#if i + 1 == m.cards.length}
          {' '}{c} total.
        {:else}
          <span class="badge text-bg-light">{ranks[i]}</span>{#if c > 1}{' '}&times;{c}{/if},{' '}
        {/if}
      {/if}
    {/each}
  {:else if m.type == 'leave'}
    {@const outline = m.playerIsMe ? '' : '-outline'}
    <span class="badge text-bg{outline}-secondary">{m.playerName}</span> left, discarding &times;{m.handSize}.
  {:else}
    [unknown move {m}]
  {/if}
{:else}
  <br>
  No moves yet!
{/each}
