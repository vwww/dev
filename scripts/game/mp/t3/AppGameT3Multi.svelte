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

import { GameState, T3Game } from './T3Game2.svelte'
import T3Play from './T3Play.svelte'

import { roomCreateOptions, getGameModeString } from './gamemode'

const chatState = new ChatState()
const gameState = new T3Game(chatState)

const {
  pastGames,
  leaderboard,
  roundState,
} = $derived(gameState)

let t3Isomorphism = pState('game/mp/t3/isomorphism', 0)
let name = pState('game/mp/_shared/name', '')

let roomList: PIORoomList

function formatGameMode (roomData: object): string {
  return getGameModeString(parseGameModeGeneric(roomCreateOptions, roomData))
}
</script>

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

<NameBox bind:value={name.value} />

<PIORoomList
  bind:this={roomList}
  gameId="t3-k9s5th8thueeuso1rkilqw"
  roomType="T3Room"
  joinData={{ name: name.value }}
  onJoinedRoom={(room) => gameState.enterGame(room, name.value)}
  {formatGameMode}
  {roomCreateOptions} />

<PlayCard
  inGame={gameState.room}
  isActive={gameState.localClient.active}
  canReady={roundState === GameState.INTERMISSION}
  isReady={gameState.localClient.ready}
  onSetActive={(a) => gameState.sendActive(a)}
  onSetReady={(r) => gameState.sendReady(r)}
  onReset={() => gameState.sendReset()}
  onDisconnect={() => (gameState.leaveGame(), roomList.refreshRooms())}>
  <T3Play {gameState} t3Isomorphism={t3Isomorphism.value} />
</PlayCard>

<div class="row">
  <div class="col-12 col-xl-8">
    <GameHistoryCard
      canClear={!pastGames.length}
      onClear={() => gameState.clearHistory()}>
      <TwoPlayerWinner results={pastGames} />
    </GameHistoryCard>

    <Leaderboard players={leaderboard} columns={[
      ['Streak', (p) => p.streak],
      ['Score', (p) => p.score],
      ['Win', (p) => [p.wins, p.total]],
      ['Loss', (p) => [p.loss, p.total]],
      ['Ties', (p) => [p.ties, p.total]],
    ]} />
  </div>

  <div class="col-12 col-xl-4 mb-3">
    <Chat
      {chatState}
      onInput={(msg) => processChat(gameState, msg)}
    />
  </div>
</div>
