<script lang="ts">
interface Props {
  hexBytes: string
  date: Date | false | ''
  valid: boolean
}

const { hexBytes, date, valid }: Props = $props()
</script>

<tr>
  <td>UNIX timestamp</td>
  <td>{hexBytes}</td>
  <td class={valid ? 'table-success' : 'table-danger'}>{date ? date.toLocaleString() : 'Unknown'}</td>
</tr>
