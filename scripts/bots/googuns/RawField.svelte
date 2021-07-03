<script lang="ts">
export let offset: number | string
export let length: number | string
export let desc: string
export let hexBytes: string
export let valid: boolean | undefined = undefined
</script>

<tr>
  <td>0x{(+offset).toString(16)}</td>
  <td>{offset}</td>
  <td>0x{(+length).toString(16)}</td>
  <td>{length}</td>
  <td>{desc}</td>
  <td class={valid !== undefined ? valid ? 'table-success' : 'table-danger' : ''}>{hexBytes}</td>
</tr>
