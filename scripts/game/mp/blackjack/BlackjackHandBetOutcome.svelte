<script lang="ts">
import type { HandBetOutcome } from './BlackjackGame.svelte'
import BlackjackHand from './BlackjackHand.svelte'
import BlackjackScoreChange from './BlackjackScoreChange.svelte'

interface Props {
  hand: HandBetOutcome
}

const { hand: handBetOutcome }: Props = $props()
const [hand, bet, outcome, delta] = $derived(handBetOutcome)
</script>

Bet <span class="badge text-bg-outline-secondary">{bet < 0 ? -bet : bet}</span> on <BlackjackHand {hand} final />
<span class="badge text-bg-{[
  'outline-secondary',
  'secondary',
  'primary',
  'success',
  'warning',
  'danger',
][outcome]}">{[
  'SURRENDERED',
  'BUST',
  'BLACKJACK',
  'WIN',
  'PUSH',
  'LOSE',
][outcome]}</span>
<BlackjackScoreChange {delta} />
