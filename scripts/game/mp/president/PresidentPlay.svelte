<script>
import CardCountTable from '../common/CardCountTable'
</script>

<!-- Possible Move UI -->
Card: [buttons]
Cardinality: [number] [slider]
Jokers: [number] [slider]

<CardCountTable
  ranks={['*', '2', 'A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3']}
  counts={[
    ['Yours', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    ['Others', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    ['Played', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    ['Total', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]
  ]}
/>
