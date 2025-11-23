<script lang="ts">
interface Props {
  delta: number
  solid?: boolean
}

const { delta, solid }: Props = $props()
</script>

<span class="badge text-bg-{solid ? '' : 'outline-'}{delta ? delta < 0 ? 'danger' : 'success' : 'warning'}">{delta >= 0 ? '+' : ''}{delta}</span>
