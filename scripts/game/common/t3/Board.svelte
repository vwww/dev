<script lang="ts">
import type { Snippet } from 'svelte'

import { Winner } from './game'

interface Props {
  winner: Winner
  cell: Snippet<[i: number]>
}

const { winner, cell }: Props = $props()

const cellNumbers = [[0, 1, 2], [3, 4, 5], [6, 7, 8]]
</script>

<table class="w{winner}">
  <tbody>
    {#each cellNumbers as row}
      <tr>
      {#each row as i}
        {@render cell(i)}
      {/each}
      </tr>
    {/each}
  </tbody>
</table>

<style>
table {
  background-color: #add8e6;
  border-collapse: separate;
  border-radius: 12px;
  border-spacing: 10px;
  margin: auto;
  margin-bottom: 10px;

  &.w1 { background-color: #008000 }
  &.w2 { background-color: #ffa07a }
  &.w3 { background-color: #a9a9a9 }
}
</style>
