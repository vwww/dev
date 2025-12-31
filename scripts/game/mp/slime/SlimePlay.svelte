<script lang="ts">
import CanvasGame from '@gmc/CanvasGame.svelte'
import RoundPlayerList from '@gmc/RoundPlayerList.svelte'

import type { SlimeGame } from './SlimeGame.svelte'

import { getGameModeString } from './gamemode'

interface Props {
  gameState: SlimeGame
}

const { gameState }: Props = $props()

let canvasGame: CanvasGame
export function requestFullscreen (options?: FullscreenOptions): Promise<void> {
  return canvasGame.requestFullscreen(options)
}
</script>

<CanvasGame bind:this={canvasGame} {gameState} />

<div class="mt-3">
  Game Mode: {getGameModeString(gameState.mode)}
</div>

<b>Lobby</b>
<RoundPlayerList
  localClient={gameState.localClient}
  inGame={gameState.roundPlayers}/>
