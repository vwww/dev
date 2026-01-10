<script lang="ts">
import type { ScoreReason } from './CribbageGame.svelte'

import CribbageCard from './CribbageCard.svelte'

interface Props {
  scoreReasons: ArrayLike<ScoreReason>
  colorScheme: number
}

const { scoreReasons, colorScheme }: Props = $props()
</script>

{#each scoreReasons as r, i}
  {i ? ', ' : ''}{r.score} for {r.reason}
  {#each r.cards as card}
    <CribbageCard {card} {colorScheme} />
  {/each}
{/each}
