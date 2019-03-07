<script lang="ts">
interface Props {
  name?: string
  hexBytes?: string
}

const {
  name = 'unknown field',
  hexBytes = '??',
}: Props = $props()
</script>

<tr>
  <td>{name}</td>
  <td colspan="2">{hexBytes}</td>
</tr>
