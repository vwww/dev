<script lang="ts">
import { pState } from '@/util/svelte.svelte'

import CanvasGame from '@gmc/CanvasGame.svelte'
import RoundPlayerList from '@gmc/RoundPlayerList.svelte'

import type { DuelGame } from './DuelGame.svelte'

import { getGameModeString } from './gamemode'

interface Props {
  gameState: DuelGame
}

const { gameState }: Props = $props()

const topType = pState('game/mp/duel/t', 0)
const topSize = pState('game/mp/duel/s', 10)

$effect(() => {
  gameState.topType = topType.value
  gameState.topSize = topSize.value
  gameState.calcTop()
})

let canvasGame: CanvasGame
</script>

<div class="input-group mb-3">
  <span class="input-group-text">
    Leaderboard Type
  </span>
  <select class="form-select" bind:value={topType.value}>
    <option value={0}>Mass</option>
    <option value={1}>Score</option>
    <option value={2}>Kills</option>
  </select>
  <span class="input-group-text">
    Leaderboard Size
  </span>
  <input type="number" class="form-control" bind:value={topSize.value} min="0" max="23">
  <span class="input-group-text flex-grow-1">
    <label class="form-check mx-auto">
      <input type="checkbox" class="form-check-input" checked disabled>
      Show FPS
    </label>
  </span>
  <span class="input-group-text flex-grow-1">
    <label class="form-check mx-auto">
      <input type="checkbox" class="form-check-input" checked disabled>
      Dev Mode
    </label>
  </span>
  <span class="input-group-text flex-grow-1">
    <label class="form-check mx-auto">
      <input type="checkbox" class="form-check-input" onclick={function () { this.checked = false; canvasGame.requestFullscreen() }}>
      <span class="form-check-label">Full-Screen</span>
    </label>
  </span>
</div>

<CanvasGame bind:this={canvasGame} {gameState} aspect={16/9} />

<div class="mt-3">
  Game Mode: {getGameModeString(gameState.mode)}
</div>

<b>Lobby</b>
<RoundPlayerList
  localClient={gameState.localClient}
  inGame={gameState.roundPlayers}
  inQueue={[]} />
