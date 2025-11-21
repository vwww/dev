<script lang="ts">
import type { Hand } from './BlackjackGame.svelte'
import { ranks } from './BlackjackPlay.svelte'

interface Props {
  hand: Hand
  hole?: boolean
  final?: boolean
}

const { hand, hole, final }: Props = $props()
</script>

{#if hole}
<span class="badge text-bg-light">?</span>
{/if}
{#each hand.cards as c}
<span class="badge text-bg-light">{ranks[c]}</span>
{/each}
({#if !final && hand.isSoft}{hand.valueHard}/{/if}{hand.value})
