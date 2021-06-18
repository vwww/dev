<script lang="ts">
import CardCountTable from '../common/CardCountTable'
import PresidentGame from './PresidentGame'

export let gameState: PresidentGame

const {
  // isActive,
  gamePhase,
} = gameState
</script>

{#if !$gamePhase}<!-- global (transfer) -->
  Scum [pl] gives the two highest cards to President [pl], who must choose two cards to give back.
  High-Scum [pl] gives the two highest cards to Vice-President [pl], who must choose two cards to give back.
  <!-- scum -->
  You gave [c0] and [c1] to [pl].

  <!-- pres -->
  [pl] gave you [c0] and [c1]. Give back two cards:
  [cards0]
  [cards1]
  <button class="btn btn-primary d-block w-100">Confirm</button>
{:else}
  {#if $gamePhase === 1}<!-- Possible Move UI (first move) -->
    Card: [buttons]
    Cardinality: [number] [slider]
    Jokers: [number] [slider]
  {:else}<!-- Possible Move UI (locked trick) -->
    Move: [buttons]
    Jokers: [number] [slider]
  {/if}

  <div class="btn-group d-flex my-2">
    <button class="btn w-100 btn-primary" on:click={gameState.onConfirm}>Confirm</button>
    <button class="btn w-50 btn-outline-secondary" on:click={gameState.onRandom}>Random</button>
    <button class={`btn w-50 btn-outline-danger`} class:disabled={!canPass} on:click={gameState.onPass}>Pass</button>
  </div>
{/if}

<CardCountTable
  ranks={['*', '2', 'A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3']}
  counts={[
    ['Yours', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    ['Others', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    ['Played', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    ['Total', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]
  ]}
/>
