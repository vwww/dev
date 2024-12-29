<script lang="ts">
interface Props {
  offset: number | string
  length: number | string
  desc: string
  hexBytes: string
  valid?: boolean
}

let {
  offset,
  length,
  desc,
  hexBytes,
  valid,
}: Props = $props()
</script>

<tr>
  <td>0x{(+offset).toString(16)}</td>
  <td>{offset}</td>
  <td>0x{(+length).toString(16)}</td>
  <td>{length}</td>
  <td>{desc}</td>
  <td class={valid !== undefined ? valid ? 'table-success' : 'table-danger' : ''}>{hexBytes}</td>
</tr>
