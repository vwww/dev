<script lang="ts">
import { formatDuration } from '@gmc/game/common'

import PresidentRoleChange from './PresidentRoleChange.svelte'

import type { PresidentGameHistory } from './PresidentGame.svelte'

interface Props {
  results: PresidentGameHistory[]
}

const { results }: Props = $props()
</script>

<ul class="list-group list-group-flush overflow-auto" style="max-height: 15rem">
  {#each results as pastGame}
    <li class="list-group-item">
      <div>
        Turn {pastGame.trickNum}:{pastGame.trickTurn} in {formatDuration(pastGame.duration)}:
        {#each pastGame.players as p, i}
          {' '}
          <div class="d-inline-block">
            #{i + 1}
            <PresidentRoleChange {...p} />
            (on {p.trickNum}:{p.trickTurn} in {formatDuration(p.duration)})
          </div>
        {/each}
      </div>
    </li>
  {:else}
    <li class="list-group-item">No past games!</li>
  {/each}
</ul>
