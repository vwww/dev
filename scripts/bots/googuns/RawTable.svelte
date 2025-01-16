<script lang="ts">
import type { Snippet } from 'svelte'

interface Props {
  children: Snippet
}

const { children }: Props = $props()
</script>

<table class="table table-bordered table-hover">
  <thead>
    <tr>
      <th colspan="2">Offset</th>
      <th colspan="2">Length</th>
      <th>Description</th>
      <th>Entered</th>
    </tr>
  </thead>
  <tbody>
    {@render children()}
  </tbody>
</table>
