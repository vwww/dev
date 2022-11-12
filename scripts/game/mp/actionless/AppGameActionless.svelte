<script lang="ts">
import Chat from '@gmc/Chat.svelte'
import GameHistoryCard from '@gmc/GameHistoryCard.svelte'
import Leaderboard from '@gmc/Leaderboard.svelte'
import NameBox from '@gmc/NameBox.svelte'
import PlayCard from '@gmc/PlayCard.svelte'

import PIORoomList from '@gmc/PIORoomList.svelte'

import ChatState from '@gmc/ChatState'

import ActionlessGame from './ActionlessGame'
import ActionlessHistory from './ActionlessHistory.svelte'
import ActionlessPlay from './ActionlessPlay.svelte'

import { pStore } from '@/util/svelte'

import { roomCreateOptions, getGameModeString } from './gamemode'

const chatState = new ChatState()
const gameState = new ActionlessGame(chatState)

const {
  inGame,
  isActive,
  isReady,
  pastGames,
  clientsSorted,
  roundState,
} = gameState

let name = pStore('game/mp/_shared/name', '')

function formatGameMode ({optIndependent, optTeams}: any) {
  return getGameModeString(optIndependent === 'true', +optTeams)
}
</script>

<NameBox bind:value={$name} />

<PIORoomList
  gameId="actionless-rv9luoetuchidspmvghiq"
  roomType="ActionlessRoom"
  onJoinedRoom={(room) => gameState.enterGame(room, $name)}
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
  <ActionlessPlay {gameState} />
</PlayCard>

<div class="row">
  <div class="col-12 col-lg-8">
    <GameHistoryCard
      canClear={!$pastGames.length}
      onClear={() => gameState.clearHistory()}>
      <ActionlessHistory results={$pastGames} />
    </GameHistoryCard>

    <Leaderboard players={$clientsSorted} columns={[
      ['Streak', (p) => p.streak],
      ['Score', (p) => p.wins - p.losses],
      ['Win', (p) => p.wins],
      ['Loss', (p) => p.losses],
    ]} />
  </div>

  <div class="col-12 col-lg-4 mb-3">
    <Chat
      {chatState}
      onInput={msg => gameState.processCommand(msg)}
    />
  </div>
</div>
