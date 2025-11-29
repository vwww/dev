<script lang="ts">
import { formatDuration } from '@gmc/game/common'

import type { BlackjackGameHistory } from './BlackjackGame.svelte'
import BlackjackHand from './BlackjackHand.svelte'
import BlackjackHandBetOutcome from './BlackjackHandBetOutcome.svelte'
import BlackjackScoreChange from './BlackjackScoreChange.svelte'

interface Props {
  result: BlackjackGameHistory
}

const { result }: Props = $props()
</script>

<div>
  Dealer: <BlackjackHand hand={result.dealerHand} final /> after {formatDuration(result.duration)}
  <ul class="list-unstyled">
    {#each result.players as p}
      <li>
        <span class="badge text-bg-{p.isMe ? '' : 'outline-'}secondary">{p.name}</span>
        <BlackjackScoreChange delta={p.scoreChange} solid />
        &rarr;
        {p.score}
        <ol class="list-unstyled">
          {#if p.insurance}
            <li>
              Insurance
              <span class="badge text-bg-outline-secondary">{p.insurance}</span>
              {p.insuranceDelta > 0 ? 'won' : 'lost'}
              <BlackjackScoreChange delta={p.insuranceDelta} />
            </li>
          {/if}
          {#if p.hands.length && p.dealerCanBJ != null}
            <li>
              <small>Left when dealer blackjack was {p.dealerCanBJ ? '' : 'not'} possible</small>
            </li>
          {/if}
          {#each p.hands as hand}
            <li>
              <BlackjackHandBetOutcome {hand} />
            </li>
          {/each}
        </ol>
      </li>
    {/each}
  </ul>
</div>
