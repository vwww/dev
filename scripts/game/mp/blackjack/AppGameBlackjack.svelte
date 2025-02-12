<script lang="ts">
import Chat from '@gmc/Chat.svelte'
import GameHistoryCard from '@gmc/GameHistoryCard.svelte'
import Leaderboard from '@gmc/Leaderboard.svelte'
import NameBox from '@gmc/NameBox.svelte'
import PlayCard from '@gmc/PlayCard.svelte'

import PIORoomList from '@gmc/PIORoomList.svelte'

import ChatState from '@gmc/ChatState.svelte'

import BlackjackGame from './BlackjackGame.svelte'
import BlackjackHistory from './BlackjackHistory.svelte'
import BlackjackPlay from './BlackjackPlay.svelte'

import { pState } from '@/util/svelte.svelte'

import { roomCreateOptions, getGameModeString } from './gamemode'

const chatState = new ChatState()
const gameState = new BlackjackGame(chatState)

const {
  inGame,
  isActive,
  isReady,
  pastGames,
  clientsSorted,
  roundState,
} = $derived(gameState)

let name = pState('game/mp/_shared/name', '')

function formatGameMode ({optInverted}: any) {
  return getGameModeString()
}
</script>

<NameBox bind:value={name.value} />

<PIORoomList
  gameId="blackjack-6zesndxegeqvedc1obxixa"
  roomType="BlackjackRoom"
  onJoinedRoom={(room) => gameState.enterGame(room, name.value)}
  {formatGameMode}
  {roomCreateOptions} />

<PlayCard
  {inGame}
  {isActive}
  canReady={roundState === 1}
  {isReady}
  onSetActive={(a) => gameState.sendActive(a)}
  onSetReady={(r) => gameState.sendReady(r)}
  onReset={() => gameState.sendReset()}
  onDisconnect={() => gameState.leaveGame()}>
  <BlackjackPlay {gameState} />
</PlayCard>

<div class="row">
  <div class="col-12 col-lg-8">
    <GameHistoryCard
      canClear={!pastGames.length}
      onClear={() => gameState.clearHistory()}>
      <BlackjackHistory results={pastGames} />
    </GameHistoryCard>

    <Leaderboard players={clientsSorted} columns={[
      ['Score', (p) => p.score],
      ['Wins', (p) => p.wins],
      ['Streak', (p) => p.streak],
    ]} />
  </div>

  <div class="col-12 col-lg-4 mb-3">
    <Chat
      {chatState}
      onInput={msg => gameState.processCommand(msg)}
    />
  </div>
</div>
