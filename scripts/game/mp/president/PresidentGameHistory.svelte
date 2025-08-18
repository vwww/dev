<script lang="ts">
import { formatDuration } from '@gmc/game/common'

import type { PresidentGameHistory, PresidentRole } from './PresidentGame.svelte'

interface Props {
  results: PresidentGameHistory[]
}

const { results }: Props = $props()

const RANKS = [
  ['Scum', 'danger'],
  ['High-Scum', 'warning'],
  ['∅', 'secondary'],
  ['Vice-President', 'success'],
  ['President', 'primary'],
]

function rankName (r: PresidentRole): string {
  return RANKS[r + 2][0]
}

function rankClass (r: PresidentRole): string {
  return RANKS[r + 2][1]
}

function rankBadgeClass (r: PresidentRole, isMe?: boolean): string {
  return `badge text-bg-${isMe ? '' : 'outline-'}${rankClass(r)}`
}
</script>

<ul class="list-group list-group-flush overflow-auto" style="max-height: 15rem">
  {#each results as pastGame}
    <li class="list-group-item">
      <div>
        Turn {pastGame.trickNum}:{pastGame.trickTurn} in {formatDuration(pastGame.duration)}:
        {#each pastGame.players as p, i}
          {' '}{i + 1}
          <span class={rankBadgeClass(p.prevRole, p.isMe)}>
            {p.name}
            {#if p.prevRole != p.newRole}
              <!-- hide old rank name if it was neutral -->
              {#if p.prevRole}
                {rankName(p.prevRole)}
              {/if}

              {p.prevRole < p.newRole ? '➚' : '➘'}
            {/if}
            {#if p.prevRole != p.newRole || p.newRole}
              <span class={rankBadgeClass(p.newRole, p.isMe)}>{rankName(p.newRole)}</span>
            {/if}
          </span>
          (on {p.trickNum}:{p.trickTurn} in {formatDuration(p.duration)})
        {/each}
      </div>
    </li>
  {:else}
    <li class="list-group-item">No past games!</li>
  {/each}
</ul>
