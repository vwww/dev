<script lang="ts">
import Chat from '@gmc/Chat.svelte'
import ChatState, { processChat } from '@gmc/ChatState.svelte'
import GameHistoryCard from '@gmc/GameHistoryCard.svelte'
import Leaderboard from '@gmc/Leaderboard.svelte'
import NameBox from '@gmc/NameBox.svelte'
import PlayCard from '@gmc/PlayCard.svelte'
import { parseGameModeGeneric } from '@gmc/RoomOption'
import PIORoomList from '@gmc/PIORoomList.svelte'
import { GameState } from '@gmc/game/TurnBasedGame.svelte'

import { roomCreateOptions, getGameModeString } from './gamemode'
import { BlackjackGame } from './BlackjackGame.svelte'
import BlackjackHistory from './BlackjackHistory.svelte'
import BlackjackPlay from './BlackjackPlay.svelte'

import { pState } from '@/util/svelte.svelte'

const chatState = new ChatState()
const gameState = new BlackjackGame(chatState)

const {
  pastGames,
  leaderboard,
  localClient,
  roundState,
} = $derived(gameState)

let name = pState('game/mp/_shared/name', '')
let showCardCount = pState('game/mp/_shared/cardCount', true)

let roomList: PIORoomList
</script>

<NameBox bind:value={name.value} />

<div class="input-group mb-3">
  <span class="input-group-text flex-grow-1">
    <label class="form-check mx-auto">
      <input type="checkbox" class="form-check-input" bind:checked={showCardCount.value}>
      Show Detailed Card Count
    </label>
  </span>
</div>

<PIORoomList
  bind:this={roomList}
  gameId="blackjack-6zesndxegeqvedc1obxixa"
  roomType="BlackjackRoom"
  gameRoom={gameState.room}
  onJoinedRoom={(room) => gameState.enterGame(room, name.value)}
  formatGameMode={(roomData) => getGameModeString(parseGameModeGeneric(roomCreateOptions, roomData))}
  {roomCreateOptions} />

<PlayCard
  inGame={gameState.room}
  isActive={gameState.localClient.active}
  canReady={roundState === GameState.INTERMISSION}
  isReady={gameState.localClient.ready}
  onActive={() => gameState.sendActive()}
  onReady={() => gameState.sendReady()}
  onReset={() => gameState.sendReset()}
  onDisconnect={() => (gameState.leaveGame(), roomList.refreshRooms())}>
  <BlackjackPlay {gameState} showCardCount={showCardCount.value} />
</PlayCard>

<div class="row">
  <div class="col-12 col-lg-8">
    <GameHistoryCard
      canClear={pastGames.length}
      onClear={() => gameState.clearHistory()}>
      <ul class="list-group list-group-flush overflow-auto" style="max-height: 15rem">
        {#each pastGames as result}
          <li class="list-group-item">
            <BlackjackHistory {result} />
          </li>
        {:else}
          <li class="list-group-item">No past games!</li>
        {/each}
      </ul>
    </GameHistoryCard>

    <Leaderboard {leaderboard} {localClient} columns={[
      ['Balance', (p) => p.balance],
      ['Score', (p) => p.wins - p.loss],
      ['Wins', (p) => [p.wins, p.total]],
      ['Ties', (p) => [p.ties, p.total]],
      ['Loss', (p) => [p.loss, p.total]],
      ['Streak', (p) => p.streak],
    ]} />
  </div>

  <div class="col-12 col-lg-4 mb-3">
    <Chat
      {chatState}
      canSend={gameState.room}
      onInput={(msg) => processChat(gameState, msg)}
    />
  </div>
</div>
