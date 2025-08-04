<script lang="ts">
import CardCountTable from '@gmc/CardCountTable.svelte'
//import { GameState } from '@gmc/game/TurnBasedGame.svelte'

import { GamePhase, type PresidentGame } from './PresidentGame.svelte'

interface Props {
  gameState: PresidentGame
}

const { gameState }: Props = $props()

const {
  // isActive,
  gamePhase,
} = $derived(gameState)

const canPass = false // temporary
</script>

<script module>
export const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', '*', 'Total']
</script>

{#if gamePhase === GamePhase.GIVE_CARDS}<!-- global (transfer) -->
  Scum [pl] gives the two highest cards to President [pl], who must choose two cards to give back.
  High-Scum [pl] gives the two highest cards to Vice-President [pl], who must choose two cards to give back.
  <!-- scum -->
  You gave [c0] and [c1] to [pl], who will give you back two cards.

  <!-- pres -->
  [pl] gave you [c0] and [c1]. Give back two cards:
  [cards0]
  [cards1]
  <button class="btn btn-primary d-block w-100">Confirm</button>
{:else}<!-- gamePhase === GamePhase.PLAYING_* -->
  {#if gamePhase === GamePhase.PLAYING}<!-- Possible Move UI (first move) -->
    Card: [buttons]
    Cardinality: [number] [slider]
    Jokers: [number] [slider]
  {:else}<!-- Possible Move UI (locked trick) -->
    Move: [buttons]
    Jokers: [number] [slider]
  {/if}

  <div class="btn-group d-flex my-2">
    <button class="btn w-100 btn-primary">Confirm</button>
    <button class="btn w-50 btn-outline-secondary">Random</button>
    <button class="btn w-50 btn-outline-danger" class:disabled={!canPass}>Pass</button>
  </div>
{/if}

<CardCountTable
  {ranks}
  counts={[
    ['You', gameState.cardCountMine],
    ['Others', gameState.cardCountOthers],
    ['Played', gameState.cardCountDiscard],
    ['Total', gameState.cardCountTotal]
  ]}
/>
