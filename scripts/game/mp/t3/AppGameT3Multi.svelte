<script lang="ts">
import { pState } from '@/util/svelte.svelte'

import Chat from '@gmc/Chat.svelte'
import ChatState, { processChat } from '@gmc/ChatState.svelte'
import GameHistoryCard from '@gmc/GameHistoryCard.svelte'
import Leaderboard from '@gmc/Leaderboard.svelte'
import NameBox from '@gmc/NameBox.svelte'
import PlayCard from '@gmc/PlayCard.svelte'
import TwoPlayerWinner from '@gmc/TwoPlayerWinner.svelte'
import { parseGameModeGeneric } from '@gmc/RoomOption'
import PIORoomList from '@gmc/PIORoomList.svelte'
import { GameState } from '@gmc/game/TurnBasedGame.svelte'

import { T3Game } from './T3Game.svelte'
import T3Play from './T3Play.svelte'

import { roomCreateOptions, getGameModeString } from './gamemode'

const chatState = new ChatState()
const gameState = new T3Game(chatState)

const {
  room: inGame,
  canReset,
  pastGames,
  leaderboard,
  localClient,
  roundState,
} = $derived(gameState)

let name = pState('game/mp/_shared/name', '')
let t3Isomorphism = pState('game/mp/t3/isomorphism', 0)

let roomList: PIORoomList
</script>

<NameBox bind:value={name.value} onchange={() => gameState.sendRename(name.value)} />

<div class="btn-group d-flex mb-3" role="group">
  <span class="input-group-text">Isomorphism</span>
  <button class="w-100 btn btn-outline-secondary"
    class:active={!t3Isomorphism.value}
    onclick={() => { t3Isomorphism.value = 0 }}>Tic-Tac-Toe</button>
  <button class="w-50 btn btn-outline-secondary"
    class:active={t3Isomorphism.value === 1}
    onclick={() => { t3Isomorphism.value = 1 }}>Pick15</button>
  <button class="w-50 btn btn-outline-secondary"
    class:active={t3Isomorphism.value === 2}
    onclick={() => { t3Isomorphism.value = 2 }}>Words</button>
</div>

<PIORoomList
  bind:this={roomList}
  gameId="t3-k9s5th8thueeuso1rkilqw"
  roomType="T3Room"
  gameRoom={gameState.room}
  onJoinedRoom={(room) => gameState.enterGame(room, name.value)}
  formatGameMode={(roomData) => getGameModeString(parseGameModeGeneric(roomCreateOptions, roomData))}
  {roomCreateOptions} />

<PlayCard
  {inGame}
  isActive={gameState.localClient.active}
  canReady={roundState === GameState.INTERMISSION}
  isReady={gameState.localClient.ready}
  onActive={() => gameState.sendActive()}
  onReady={() => gameState.sendReady()}
  onDisconnect={() => (gameState.leaveGame(), roomList.refreshRooms())}>
  <T3Play {gameState} t3Isomorphism={t3Isomorphism.value} />
</PlayCard>

<div class="row">
  <div class="col-12 col-xl-8">
    <GameHistoryCard
      canClear={pastGames.length}
      onClear={() => gameState.clearHistory()}>
      <TwoPlayerWinner results={pastGames} />
    </GameHistoryCard>

    <Leaderboard {leaderboard} {localClient}
      {inGame}
      {canReset}
      onReset={() => gameState.sendReset()}
      columns={[
        ['Streak', (p) => p.streak],
        ['Score', (p) => p.score],
        ['Win', (p) => [p.wins, p.total]],
        ['Loss', (p) => [p.loss, p.total]],
        ['Ties', (p) => [p.ties, p.total]],
      ]}
    />
  </div>

  <div class="col-12 col-xl-4 mb-3">
    <Chat
      {chatState}
      canSend={gameState.room}
      onInput={(msg) => processChat(gameState, msg)}
    />
  </div>
</div>
