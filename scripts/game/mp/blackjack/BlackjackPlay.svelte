<script lang="ts">
import CardCountTable from '@gmc/CardCountTable.svelte'
</script>

<CardCountTable
  ranks={['A', 'Tens', '9', '8', '7', '6', '5', '4', '3', '2']}
  counts={[
    ['Remaining', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    ['Played', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    ['Total', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]
  ]}
/>
