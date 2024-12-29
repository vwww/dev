<script lang="ts">
interface Props {
  drawOffer: number
  onResign: () => void
  onDrawOffer: () => void
  onDrawReject: () => void
}

const {
  drawOffer,
  onResign,
  onDrawOffer,
  onDrawReject,
}: Props = $props()
</script>

<div class="btn-group d-flex my-2">
  <button class="btn w-100 btn-outline-danger" onclick={onResign}>Resign</button>
  <button class="btn w-50 btn-{['outline-primary', 'primary', 'info'][drawOffer]}" onclick={onDrawOffer}>{['Offer Draw', 'Draw Requested', 'Accept Draw'][drawOffer]}</button>
  <button class="btn w-50 btn-{drawOffer ? '' : 'outline-'}warning" class:disabled={!drawOffer} onclick={onDrawReject}>{drawOffer > 1 ? 'Reject Draw' : 'Cancel Draw'}</button>
</div>
