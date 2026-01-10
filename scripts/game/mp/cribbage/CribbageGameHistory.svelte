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
      Turn {pastGame.hand}:{pastGame.trick}:{pastGame.turn} in {formatDuration(pastGame.duration)}:
      <ol class="list-unstyled">
        {#each pastGame.players as p}
          <li>
            #{p.rank}
            <span class="badge text-bg-{p.isMe ? '' : 'outline-'}{p.rank > 1 ? 'secondary' : 'primary'}">
              {p.name}
            </span>
            <span class="badge text-bg-outline-secondary">{p.score}</span>/{pastGame.scoreTarget}
            <!-- <br> -->
            <div class="progress mt-1 mb-2" style="height:0.6rem">
              {#if p.score}
                <div class="progress-bar bg-{p.rank > 1 ? 'secondary' : 'primary'}" style="width:{Math.min(p.score * 100 / pastGame.scoreTarget, 100)}%"></div>
              {/if}
            </div>
          </li>
        {/each}
      </ol>
    </li>
  {:else}
    <li class="list-group-item">
      No past games!
    </li>
  {/each}
</ul>
