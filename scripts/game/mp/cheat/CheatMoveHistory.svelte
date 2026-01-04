<script lang="ts">
import CardCountInline from '@gmc/CardCountInline.svelte'

import type { CheatMoveInfo } from './CheatGame.svelte'
import { ranks } from './CheatPlay.svelte'

interface Props {
  moves: ArrayLike<CheatMoveInfo>
}

const { moves }: Props = $props()

let compact = $state(true)
</script>

<b>Move History</b>
<label class="form-check d-inline-block">
  <input type="checkbox" class="form-check-input" bind:checked={compact}>
  <span class="form-check-label">compact</span>
</label>
<div class="overflow-auto" style="max-height: 20rem">
  {#each moves as m}
    <div class:d-inline-block={compact}>
      {#if m.type == 'tEnd'}
        [{m.trick}:{m.turn} end{m.move ? ' by pass' : ''}]
      {:else if m.type == 'move'}
        {@const outline = m.playerIsMe ? '' : '-outline'}
        <span class="badge text-bg{outline}-primary">{m.playerName}</span> played <span class="badge text-bg-light">{ranks[m.rank]}</span>{#if m.count != 1n}{' '}&times;{m.count}{/if}.
      {:else if m.type == 'pass'}
        {@const outline = m.playerIsMe ? '' : '-outline'}
        <span class="badge text-bg{outline}-primary">{m.playerName}</span> passed.
      {:else if m.type == 'callSuccess'}
        {@const outline = m.playerIsMe ? '' : '-outline'}
        {@const outlineV = m.victimIsMe ? '' : '-outline'}
        <span class="badge text-bg{outline}-success">{m.playerName}</span> called cheat successfully on <span class="badge text-bg{outlineV}-danger">{m.victimName}</span>.
      {:else if m.type == 'callFail'}
        {@const outline = m.playerIsMe ? '' : '-outline'}
        <span class="badge text-bg{outline}-danger">{m.playerName}</span> called cheat wrongfully.
      {:else if m.type == 'play' || m.type == 'penalty' || m.type == 'reveal' || m.type == 'reveal2'}
        {({
          play: 'You played',
          penalty: 'You took',
          reveal: 'Previous move',
          reveal2: 'Cards under previous move',
        }[m.type])}:
        <CardCountInline {ranks} cards={m.cards} />
      {:else if m.type == 'leave'}
        {@const outline = m.playerIsMe ? '' : '-outline'}
        <span class="badge text-bg{outline}-secondary">{m.playerName}</span> left, discarding &times;{m.handSize}.
      {:else}
        [unknown move {JSON.stringify(m)}]
      {/if}
    </div>
    {' '}
  {:else}
    No moves yet!
  {/each}
</div>
