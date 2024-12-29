<script lang="ts">
import type { Bot, PlayerType } from '@gc/t3/ai'

interface Props {
  playerTypes: PlayerType[]
  playerType: Bot | undefined
  onSelectPlayerType: (pt: Bot | undefined) => void
}

const { playerTypes, playerType, onSelectPlayerType }: Props = $props()
</script>

<div class="btn-group d-flex mb-2" role="group">
  {#each playerTypes as pt}
    <button onclick={() => onSelectPlayerType(pt[1])} class="w-100 btn btn-outline-secondary" class:active={pt[1] === playerType}>{pt[0]}</button>
  {/each}
</div>
