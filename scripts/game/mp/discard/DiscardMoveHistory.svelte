<script lang="ts">
import type { DiscardMoveInfo } from './DiscardGame.svelte'

import { getCardName } from './DiscardPlay.svelte'

import { playerColor } from './gamemode'

interface Props {
  moves: ArrayLike<DiscardMoveInfo>
  ll: boolean
}

const { moves, ll }: Props = $props()
</script>

<b>Move History</b>
<ol class="list-unstyled overflow-auto" style="max-height: 20rem">
  {#each moves as m}
    <li>
      {#if m.type === 'move'}
        {@const outline = m.playerIsMe ? '' : '-outline'}
        {@const outlineT = m.targetIsMe ? '' : '-outline'}
        <span class="badge text-bg{outline}-{playerColor(m.playerIsMe)}">{m.playerName}</span> uses <span class="badge text-bg-light">{getCardName(m.move, ll)}</span>
        {#if m.move !== 4 && m.move < 7}
          on
          {#if m.targetIsPlayer}
            <span class="badge text-bg{outline}-dark">self</span>
          {:else}
            <span class="badge text-bg{outlineT}-{playerColor(m.targetIsMe)}">{m.targetName}</span>
          {/if}
        {/if}
        {#if m.move === 1 && m.targetValid}
          who has {m.info < 0 ? '' : 'no'} <span class="badge text-bg-{m.info < 0 ? 'danger' : 'warning'}">{getCardName(Math.abs(m.info), ll)}</span>{m.info < 0 ? '!' : '.'}
        {:else if m.move === 2 && m.targetValid}
          to see the hand.
        {:else if m.move === 3 && m.targetValid}
          {#if m.info}
            and {m.info < 0 ? 'loses with' : 'beats'} <span class="badge text-bg-light">{getCardName(Math.abs(m.info), ll)}</span>.
          {:else}
            and matches hands!
          {/if}
        {:else if m.move === 4}
          to become <span class="badge text-bg{outline}-info">IMMUNE</span>!
        {:else if m.move === 5}
          who destroys <span class="badge text-bg-{m.info === 8 ? 'danger' : 'light'}">{getCardName(m.info, ll)}</span>{m.info === 8 ? '!' : ' and draws.'}
        {:else if m.move === 6 && m.targetValid}
          to trade hands.
        {:else if m.move === 7}
          for no effect.
        {:else if m.move === 8}
          and lost&#8253;
        {/if}
      {:else if m.type === 'reveal'}
        <span class="badge text-bg-outline-secondary">{m.playerName}</span> has <span class="badge text-bg-light">{getCardName(m.hand, ll)}</span>!
      {:else if m.type === 'cmp'}
        You have <span class="badge text-bg-dark">{getCardName(m.ours, ll)}</span>;
        <span class="badge text-bg-outline-secondary">{m.playerName}</span> has <span class="badge text-bg-light">{getCardName(m.theirs, ll)}</span>.
      {:else if m.type === 'trade'}
        <span class="badge text-bg-outline-secondary">{m.playerName}</span>
        gives you <span class="badge text-bg-dark">{m.newHand}</span>
        for your <span class="badge text-bg-light">{m.oldHand}</span>.
      {:else if m.type == 'leave'}
        {@const outline = m.playerIsMe ? '' : '-outline'}
        <span class="badge text-bg{outline}-{playerColor(m.playerIsMe)}">{m.playerName}</span> left, discarding
        <span class="badge text-bg-light">{getCardName(m.hand, ll)}</span>
        {#if m.alt != undefined}and <span class="badge text-bg-light">{getCardName(m.alt, ll)}</span>{/if}.
      {:else}
        [unknown move {m}]
      {/if}
    </li>
  {:else}
    <li>No moves yet!</li>
  {/each}
</ol>
