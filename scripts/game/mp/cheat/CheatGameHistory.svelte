<script lang="ts">
import { formatDuration } from '@gmc/game/common'

import type { CheatGameHistory } from './CheatGame.svelte'

interface Props {
  results: CheatGameHistory[]
}

const { results }: Props = $props()
</script>

<ul class="list-group list-group-flush overflow-auto" style="max-height: 15rem">
  {#each results as pastGame}
    <li class="list-group-item">
      <div>
        Trick {pastGame.trickNum} in {formatDuration(pastGame.duration)}:
        {#each pastGame.players as p, i}
          {' '}
          <div class="d-inline-block">
            #{i + 1}
            <span class="badge text-bg-{i ? 'secondary' : 'primary'}">
              {p.name}
            </span>
            (on {p.trickNum} in {formatDuration(p.duration)})
          </div>
        {/each}
      </div>
    </li>
  {:else}
    <li class="list-group-item">No past games!</li>
  {/each}
</ul>
