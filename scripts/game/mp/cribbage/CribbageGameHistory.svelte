<script lang="ts">
import { formatDuration } from '@gmc/game/common'

import type { CribbageGameHistory } from './CribbageGame.svelte'

interface Props {
  results: ArrayLike<CribbageGameHistory>
}

const { results }: Props = $props()
</script>

<ul class="list-group list-group-flush overflow-auto" style="max-height: 15rem">
  {#each results as pastGame}
    <li class="list-group-item">
      <div>
        Turn {pastGame.hand}:{pastGame.trick}:{pastGame.turn} in {formatDuration(pastGame.duration)}:
        {#each pastGame.players as p}
          {' '}
          <div class="d-inline-block">
            #{p.rank}
            <span class="badge text-bg-{p.isMe ? '' : 'outline-'}{p.rank > 1 ? 'secondary' : 'primary'}">
              {p.name}
            </span>
            <span class="badge text-bg-outline-secondary">{p.score}</span>
          </div>
        {/each}
      </div>
    </li>
  {:else}
    <li class="list-group-item">
      No past games!
    </li>
  {/each}
</ul>
