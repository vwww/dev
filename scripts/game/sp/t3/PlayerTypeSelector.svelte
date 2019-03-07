<script>
export let playerTypes
export let playerType
export let onSelectPlayerType
</script>

<div class="btn-group d-flex mb-2" role="group">
  {#each playerTypes as pt}
    <button on:click={() => onSelectPlayerType(pt[1])} class="w-100 btn btn-outline-secondary" class:active={pt[1] === playerType}>{pt[0]}</button>
  {/each}
</div>
