<script lang="ts">
import type { PresidentGameHistory, PresidentRankType } from './PresidentGame.svelte'

interface Props {
  results: PresidentGameHistory[]
}

const { results }: Props = $props()

const RANKS = [
  ['Scum', 'danger'],
  ['VS', 'warning'],
  ['∅', 'secondary'],
  ['VP', 'success'],
  ['President', 'primary'],
]

function rankName (r: PresidentRankType): string {
  return RANKS[r + 2][0]
}

function rankClass (r: PresidentRankType): string {
  return RANKS[r + 2][1]
}

function rankBadgeClass (r: PresidentRankType): string {
  return `badge text-bg-${rankClass(r)}`
}
</script>

<ul class="list-group list-group-flush overflow-auto" style="max-height: 15rem">
  {#each results as pastGame}
    <li class="list-group-item">
      <div>
        Ranks:
        {#each pastGame.players as p}
          <span class={rankBadgeClass(p.prevRankType)}>
            {p.name} ({p.cn})
            {#if p.prevRankType != p.newRankType}
              <!-- hide old rank name if it was neutral -->
              {#if p.prevRankType}
                {rankName(p.prevRankType)}
              {/if}

              {p.prevRankType < p.newRankType ? '➚' : '➘'}

              <span class={rankBadgeClass(p.newRankType)}>{rankName(p.newRankType)}</span>
            {/if}
          </span>
        {/each}
      </div>
    </li>
  {:else}
    <li class="list-group-item">No past games!</li>
  {/each}
</ul>
