<script>
export let moves
export let ll

import { getCardName } from './DiscardPlay'

import { playerColor } from './common'
</script>

<b>Move History</b>
{#each moves as m}
  <br>
  {#if m.type === 'move'}
    <span class="badge badge-{playerColor(m.playerIsMe)}">{m.playerName}</span> uses <span class="badge badge-light">{getCardName(m.move, ll)}</span>
    {#if m.move !== 4 && m.move < 7}
      on
      {#if m.targetIsPlayer}
        <span class="badge badge-dark">self</span>
      {:else}
        <span class="badge badge-{playerColor(m.targetIsMe)}">{m.targetName}</span>
      {/if}
    {/if}
    {#if m.move === 1 && m.targetValid}
      who has {m.info < 0 ? '' : 'no'} <span class="badge badge-{m.info < 0 ? 'danger' : 'warning'}">{getCardName(Math.abs(m.info), ll)}</span>{m.info < 0 ? '!' : '.'}
    {:else if m.move === 2 && m.targetValid}
      to see the hand.
    {:else if m.move === 3 && m.targetValid}
      {#if m.info}
        and {m.info < 0 ? 'loses with' : 'beats'} <span class="badge badge-light">{getCardName(Math.abs(m.info), ll)}</span>.
      {:else}
        and matches hands!
      {/if}
    {:else if m.move === 4}
      to become <span class="badge badge-info">IMMUNE</span>!
    {:else if m.move === 5}
      who destroys <span class="badge badge-{m.info === 8 ? 'danger' : 'warning'}">{getCardName(m.info, ll)}</span>{m.info === 8 ? '!' : ' and draws.'}
    {:else if m.move === 6 && m.targetValid}
      to trade hands.
    {:else if m.move === 7}
      for no effect.
    {:else if m.move === 8}
      and lost&#8253;
    {/if}
  {:else if m.type === 'reveal'}
    <span class="badge badge-secondary">{m.name}</span> has <span class="badge badge-light">{getCardName(m.hand, ll)}</span>!
  {:else if m.type === 'cmp'}
    You have <span class="badge badge-dark">{getCardName(m.ours, ll)}</span>;
    <span class="badge badge-secondary">{m.name}</span> has <span class="badge badge-light">{getCardName(m.theirs, ll)}</span>.
  {:else if m.type === 'trade'}
    <span class="badge badge-secondary">{m.name}</span>
    gives you <span class="badge badge-dark">{m.newHand}</span>
    for your <span class="badge badge-light">{m.oldHand}</span>.
  {:else}
    [unknown move {m}]
  {/if}
{/each}
