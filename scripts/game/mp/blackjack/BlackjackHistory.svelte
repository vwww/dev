<script lang="ts">
import { formatDuration } from '@gmc/game/common'

import { BlackjackOutcome, type BlackjackGameHistory } from './BlackjackGame.svelte'
import BlackjackHand from './BlackjackHand.svelte'

interface Props {
  results: BlackjackGameHistory[]
}

const { results }: Props = $props()

function scoreClass (s: number | bigint): string {
  return s ? s < 0 ? 'danger' : 'success' : 'warning'
}

function scoreBadgeClass (s: number | bigint): string {
  return `badge text-bg-${scoreClass(s)}`
}
</script>

<ul class="list-group list-group-flush overflow-auto" style="max-height: 15rem">
  {#each results as pastGame}
    <li class="list-group-item">
      <div>
        Dealer: <BlackjackHand hand={pastGame.dealerHand} final /> after {formatDuration(pastGame.duration)}
        <ul class="list-unstyled">
          {#each pastGame.players as p}
            <li>
              <span class="badge text-bg-{p.isMe ? '' : 'outline-'}secondary">{p.name}</span>
              <span class={scoreBadgeClass(p.scoreChange)}>{p.scoreChange >= 0 ? '+' : ''}{p.scoreChange}</span>
              &rarr;
              {p.score}
              <ol class="list-unstyled">
                {#if p.insurance > 0}
                  <li>Insurance won <span class="badge text-bg-outline-success">+{p.insurance}</span></li>
                {:else if p.insurance}
                  <li>Insurance lost <span class="badge text-bg-outline-danger">{p.insurance}</span></li>
                {/if}
                {#each p.hands as [hand, bet, outcome]}
                  <li>
                    <span class="badge text-bg-outline-secondary">{bet < 0 ? -bet : bet}</span> on <BlackjackHand {hand} final />
                    {#if outcome === BlackjackOutcome.SURRENDERED}
                      <span class="badge text-bg-outline-secondary">SURRENDERED</span>
                      <span class="badge text-bg-outline-danger">{bet >> 1n}</span>
                    {:else if outcome === BlackjackOutcome.BUST}
                      <span class="badge text-bg-secondary">BUST</span>
                      <span class="badge text-bg-outline-danger">-{bet}</span>
                    {:else if outcome === BlackjackOutcome.BLACKJACK_NATURAL}
                      <span class="badge text-bg-primary">BLACKJACK</span>
                      <span class="badge text-bg-outline-success">+{bet + (bet >> 1n)}</span>
                    {:else if outcome === BlackjackOutcome.WIN}
                      <span class="badge text-bg-success">WIN</span>
                      <span class="badge text-bg-outline-success">+{bet}</span>
                    {:else if outcome === BlackjackOutcome.PUSH}
                      <span class="badge text-bg-warning">PUSH</span>
                      <span class="badge text-bg-outline-secondary">+0</span>
                    {:else if outcome === BlackjackOutcome.LOSE}
                      <span class="badge text-bg-danger">LOSE</span>
                      <span class="badge text-bg-outline-danger">-{bet}</span>
                    {/if}
                  </li>
                {/each}
              </ol>
            </li>
          {/each}
        </ul>
      </div>
    </li>
  {:else}
    <li class="list-group-item">No past games!</li>
  {/each}
</ul>
