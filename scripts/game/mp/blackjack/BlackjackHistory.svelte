<script lang="ts">
import type { BGameHistory } from './BlackjackGame'

interface Props {
  results: BGameHistory[]
}

const { results }: Props = $props()

function scoreClass (s: number): string {
  return s ? s < 0 ? 'danger' : 'success' : 'warning'
}

function scoreBadgeClass (s: number): string {
  return `badge text-bg${scoreClass(s)}`
}
</script>

<ul class="list-group list-group-flush overflow-auto" style="max-height: 15rem">
  {#each results as pastGame}
    <li class="list-group-item">
      <div>
        Ranks:
        {#each pastGame.players as p}
          <span class={scoreBadgeClass(p.score)}>
            {p.name} ({p.cn})
            <span class={scoreBadgeClass(p.scoreChange)}>{p.scoreChange >= 0 ? '+' : ''}{p.scoreChange}</span>
            {p.score}
          </span>
        {/each}
      </div>
    </li>
  {:else}
    <li class="list-group-item">No past games!</li>
  {/each}
</ul>
