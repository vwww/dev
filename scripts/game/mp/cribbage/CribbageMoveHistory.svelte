<script lang="ts">
import type { CribbageMoveInfo } from './CribbageGame.svelte'

import CribbageCard from './CribbageCard.svelte'
import CribbageScoreReasons from './CribbageScoreReasons.svelte'

interface Props {
  moves: ArrayLike<CribbageMoveInfo>
  colorScheme: number
}

const { moves, colorScheme }: Props = $props()

let compact = $state(true)
</script>

<b>Move History</b>
<label class="form-check d-inline-block">
  <input type="checkbox" class="form-check-input" bind:checked={compact}>
  <span class="form-check-label">compact</span>
</label>
<div class="overflow-auto" style="max-height: 20rem">
  {#each moves as m, i}
    {#if m.type === 'endHand'}
      <div class:d-inline-block={compact}>
        [Hand {m.hand} ended.]
      </div>
      {#if i !== moves.length - 1}
        <div>&nbsp;</div>
      {/if}
    {:else}
      {@const outline = m.playerIsMe ? '' : '-outline'}
      <div class:d-inline-block={compact}>
        <span class="badge text-bg{outline}-primary">{m.playerName}</span>
        {#if m.type === 'start'}
          {#if m.bonus}
            got +2 &rarr; {m.score} for revealing
          {:else}
            reveals
          {/if}
          the starter <CribbageCard card={m.starter} {colorScheme} />.
        {:else if m.type === 'final' || m.type === 'play' || m.type === 'show'}
          {#if m.scoreDelta}
            got +{m.scoreDelta} &rarr; {m.score}
          {/if}
          {#if m.type === 'final'}
            for the final card to {m.count} on turn {m.hand}:{m.trick}:{m.turn}.
          {:else}
            {#if m.type === 'show'}
              for {m.isCrib ? 'crib' : 'hand'}
              {#each m.cards as card}
                <CribbageCard {card} {colorScheme} />
              {/each}
            {:else}
              {m.scoreDelta ? 'by playing' : 'played'} <CribbageCard card={m.card} {colorScheme} />
            {/if}
            {#if m.scoreReasons.length}
              (<CribbageScoreReasons scoreReasons={m.scoreReasons} {colorScheme} />).
            {:else}
              (+0).
            {/if}
          {/if}
        {:else if m.type === 'pass'}
          passed.
        {:else if m.type === 'out'}
          was out.
        {:else if m.type === 'leave'}
          left.
        {:else}
          [unknown move {JSON.stringify(m)}]
        {/if}
      </div>
      {' '}
    {/if}
  {:else}
    No moves yet!
  {/each}
</div>
