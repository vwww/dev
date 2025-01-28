<script lang="ts">
import Chat from '@gmc/Chat.svelte'
import GameHistoryCard from '@gmc/GameHistoryCard.svelte'
import Leaderboard from '@gmc/Leaderboard.svelte'
import NameBox from '@gmc/NameBox.svelte'
import PlayCard from '@gmc/PlayCard.svelte'

import PIORoomList from '@gmc/PIORoomList.svelte'

import ChatState from '@gmc/ChatState'

import PresidentGame from './PresidentGame'
import PresidentHistory from './PresidentHistory.svelte'
import PresidentPlay from './PresidentPlay.svelte'

import { pState } from '@/util/svelte.svelte'

import { roomCreateOptions, getGameModeString } from './gamemode'

const chatState = new ChatState()
const gameState = new PresidentGame(chatState)

const {
  inGame,
  isActive,
  isReady,
  pastGames,
  clientsSorted,
  roundState,
} = gameState

let name = pState('game/mp/_shared/name', '')

function formatGameMode ({optInverted, optAddRandom, optTeams}: any) {
  return getGameModeString(optInverted === 'true', optAddRandom === 'true', +optTeams)
}
</script>

<NameBox bind:value={name.value} />

<PIORoomList
  gameId="president-ftmxqwcwukyisw4waewyua"
  roomType="PresidentRoom"
  onJoinedRoom={(room) => gameState.enterGame(room, name.value)}
  {formatGameMode}
  {roomCreateOptions} />

<PlayCard
  inGame={$inGame}
  isActive={$isActive}
  canReady={$roundState === 1}
  isReady={$isReady}
  onSetActive={(a) => gameState.sendActive(a)}
  onSetReady={(r) => gameState.sendReady(r)}
  onReset={() => gameState.sendReset()}
  onDisconnect={() => gameState.leaveGame()}>
  <PresidentPlay {gameState} />
</PlayCard>

<div class="row">
  <div class="col-12 col-xl-8">
    <GameHistoryCard
      canClear={!$pastGames.length}
      onClear={() => gameState.clearHistory()}>
      <PresidentHistory results={$pastGames} />
    </GameHistoryCard>

    <Leaderboard players={$clientsSorted} columns={[
      ['Score', (p) => p.score],
      ['Streak', (p) => p.streak],
      ['President', (p) => p.rank2p],
      ['VP', (p) => p.rank1p],
      ['Neutral', (p) => p.rank0],
      ['VS', (p) => p.rank1s],
      ['Scum', (p) => p.rank2s],
    ]} />
  </div>

  <div class="col-12 col-xl-4 mb-3">
    <Chat
      {chatState}
      onInput={msg => gameState.processCommand(msg)}
    />
  </div>
</div>
