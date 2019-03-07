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
      <th>Derived</th>
      <th colspan="2">Value</th>
    </tr>
  </thead>
  <tbody>
    {@render children()}
  </tbody>
</table>
