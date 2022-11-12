<script lang="ts">
import { Bot, PlayerType } from '@gc/t3/ai'

export let playerTypes: PlayerType[]
export let playerType: Bot | undefined
export let onSelectPlayerType: (pt: Bot | undefined) => void
</script>

<div class="btn-group d-flex mb-2" role="group">
  {#each playerTypes as pt}
    <button on:click={() => onSelectPlayerType(pt[1])} class="w-100 btn btn-outline-secondary" class:active={pt[1] === playerType}>{pt[0]}</button>
  {/each}
</div>
