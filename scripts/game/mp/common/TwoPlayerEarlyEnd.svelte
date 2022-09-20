<script lang="ts">
export let drawOffer: number
export let onResign: () => void
export let onDrawOffer: () => void
export let onDrawReject: () => void
</script>

<div class="btn-group d-flex my-2">
  <button class="btn w-100 btn-outline-danger" on:click={onResign}>Resign</button>
  <button class={`btn w-50 btn-${['outline-primary', 'primary', 'info'][drawOffer]}`} on:click={onDrawOffer}>{['Offer Draw', 'Draw Requested', 'Accept Draw'][drawOffer]}</button>
  <button class={`btn w-50 btn-${drawOffer ? '' : 'outline-'}warning`} class:disabled={!drawOffer} on:click={onDrawReject}>{drawOffer > 1 ? 'Reject Draw' : 'Cancel Draw'}</button>
</div>
