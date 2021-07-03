<script lang="ts">
export let hexBytes: string
export let date: Date | undefined | false
export let valid: boolean
</script>

<tr>
  <td>UNIX timestamp</td>
  <td>{hexBytes}</td>
  <td class={valid ? 'table-success' : 'table-danger'}>{date ? date.toLocaleString() : 'Unknown'}</td>
</tr>
