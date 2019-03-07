<script>
export let hexBytes
export let date
export let valid
</script>

<tr>
  <td>UNIX timestamp</td>
  <td>{hexBytes}</td>
  <td class={valid ? 'table-success' : 'table-danger'}>{date ? date.toLocaleString() : 'Unknown'}</td>
</tr>
