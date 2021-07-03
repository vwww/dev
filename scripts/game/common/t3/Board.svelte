<script lang="ts">
import { Winner } from './game'

export let winner: Winner
const cellNumbers = [[0, 1, 2], [3, 4, 5], [6, 7, 8]]
</script>

<table class="w{winner}">
  {#each cellNumbers as row}
    <tr>
    {#each row as i}
      <slot {i} />
    {/each}
    </tr>
  {/each}
</table>

<style>
table {
  background-color: #add8e6;
  border-collapse: separate;
  border-radius: 12px;
  border-spacing: 10px;
  margin: auto;
  margin-bottom: 10px;
}
table.w1 { background-color: #008000 }
table.w2 { background-color: #ffa07a }
table.w3 { background-color: #a9a9a9 }
</style>
