<script lang="ts">
export let sender = ''
export let text = ''
export let msgClassNum = 0
export let title: string | undefined = undefined

$: floatRightClass = msgClassNum === 1 || msgClassNum === 2 ? '' : ' float-end'

$: msgClass =
  msgClassNum === 1 ? 'light'
    : msgClassNum === 2 ? 'danger'
      : msgClassNum === 3 ? 'dark'
        : 'primary'
</script>

<style>
div.card {
  max-width: 75%;
  float: left;
  font-size: 125%;
  font-family: monospace;
  overflow-wrap: break-word;
}
</style>

<div class="clearfix">
  <div class="card my-1 clearfix{floatRightClass}" {title}>
    {#if sender}
      <div class="card-header text-bg-{msgClass}">{sender}</div>
      <div class="card-body">{text}</div>
    {:else}
      <div class="card-header text-bg-{msgClass}">{text}</div>
    {/if}
  </div>
</div>
