<script lang="ts">
import CardCountInline from '@gmc/CardCountInline.svelte'

import type { CheatMoveInfo } from './CheatGame.svelte'
import { ranks } from './CheatPlay.svelte'

interface Props {
  moves: ArrayLike<CheatMoveInfo>
}

const { moves }: Props = $props()
</script>

<b>Move History</b>
<ol class="list-unstyled overflow-auto" style="max-height: 20rem">
  {#each moves as m}
    <li>
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
        [unknown move {m}]
      {/if}
    </li>
  {:else}
    <li>No moves yet!</li>
  {/each}
</ol>
