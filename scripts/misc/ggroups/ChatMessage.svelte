<script>
export let sender = ''
export let text = ''
export let msgClassNum = 0

const floatRightClass = msgClassNum === 1 || msgClassNum === 2 ? '' : ' float-right'

const msgClass =
  msgClassNum === 1 ? 'light'
    : msgClassNum === 2 ? 'danger text-white'
      : 'primary text-white'
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
  <div class={'card my-1 clearfix' + floatRightClass}>
    {#if sender}
      <div class={'card-header bg-' + msgClass}>{sender}</div>
      <div class="card-body">{text}</div>
    {:else}
      <div class={'card-header bg-' + msgClass}>{text}</div>
    {/if}
  </div>
</div>
