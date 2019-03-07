<script lang="ts">
interface Props {
  sender?: string
  text?: string
  msgClassNum?: number
  title?: string
}

const {
  sender = '',
  text = '',
  msgClassNum = 0,
  title
}: Props = $props()

const floatRightClass = $derived(msgClassNum === 1 || msgClassNum === 2 ? '' : ' float-end')

const msgClass = $derived(
  msgClassNum === 1 ? 'light'
    : msgClassNum === 2 ? 'danger'
      : msgClassNum === 3 ? 'dark'
        : 'primary'
)
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
