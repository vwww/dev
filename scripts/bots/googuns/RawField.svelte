<script>
export let offset
export let length
export let desc
export let hexBytes
export let valid
</script>

<tr>
  <td>0x{offset.toString(16)}</td>
  <td>{offset}</td>
  <td>0x{length.toString(16)}</td>
  <td>{length}</td>
  <td>{desc}</td>
  <td class={valid !== undefined ? valid ? 'table-success' : 'table-danger' : ''}>{hexBytes}</td>
</tr>
