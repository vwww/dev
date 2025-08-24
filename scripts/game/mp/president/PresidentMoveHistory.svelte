<script lang="ts">
import CardCountInline from '@gmc/CardCountInline.svelte'

import { CardRank, type PresidentMoveInfo } from './PresidentGame.svelte'
import { ranks } from './PresidentPlay.svelte'

interface Props {
  moves: ArrayLike<PresidentMoveInfo>
}

const { moves }: Props = $props()
</script>

<b>Move History</b>
<div class="overflow-auto" style="max-height: 20rem">
  {#each moves as m}
    <span class="d-inline-block">
      {#if m.type == 'give' || m.type == 'take'}
        (You
        {m.type == 'give' ? 'took' : 'gave'}
        <span class="badge text-bg-light">{ranks[m.card0]}</span>
        {#if m.card1 != undefined}
          and <span class="badge text-bg-light">{ranks[m.card1]}</span>
        {/if}
        {m.type == 'give' ? 'from' : 'to'}
        <span class="badge text-bg-outline-secondary">{m.playerName}</span>)
      {:else}
        {@const outline = m.playerIsMe ? '' : '-outline'}
        <span class="badge text-bg{outline}-{m.type == 'leave' ? 'secondary' : 'primary'}">{m.playerName}</span>
        {#if m.type == 'move'}
          played <span class="badge text-bg-light">{ranks[m.rank]}</span>{#if m.base != 1}{' '}&times;{m.base}{#if m.jokers}+{m.jokers}{/if}{/if}.
        {:else if m.type == 'pass'}
          passed.
        {:else if m.type == 'give_public'}
          {@const outline2 = m.targetIsMe ? '' : '-outline'}
          gave {m.cardCount} card{m.cardCount == 1 ? '' : 's'} to
          <span class="badge text-bg{outline2}-secondary">{m.targetName}</span>.
        {:else if m.type == 'discard'}
          discarded
          <span class="badge text-bg-light">{ranks[m.card0]}</span>
          {#if m.card1 != undefined}
            and <span class="badge text-bg-light">{ranks[m.card1]}</span>
          {/if}.
        {:else if m.type == 'leave'}
          {#if m.cards[CardRank.NUM]}
            left, discarding <CardCountInline {ranks} cards={m.cards} />
          {:else}
            won.
          {/if}
        {:else}
          [unknown move {m}]
        {/if}
      {/if}
    </span>
    {' '}
  {:else}
    No moves yet!
  {/each}
</div>
