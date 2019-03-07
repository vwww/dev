<script lang="ts">
import { pState } from '@/util/svelte.svelte'

import Chat from '@gmc/Chat.svelte'
import ChatState, { processChat } from '@gmc/ChatState.svelte'
import Leaderboard from '@gmc/Leaderboard.svelte'
import NameBox from '@gmc/NameBox.svelte'
import PlayCard from '@gmc/PlayCard.svelte'
import { parseGameModeGeneric } from '@gmc/RoomOption'
import PIORoomList from '@gmc/PIORoomList.svelte'

import { SlimeGame } from './SlimeGame.svelte'
import SlimePlay from './SlimePlay.svelte'

import { roomCreateOptions, getGameModeString } from './gamemode'

const chatState = new ChatState()
const gameState = new SlimeGame(chatState)

const name = pState('game/mp/_shared/name', '')
const color = pState('game/mp/slime/color', '#77ff00')
const flip = pState('game/mp/slime/f', false)
const background = pState('game/mp/slime/b', false)
const devMode = pState('game/mp/slime/d', false)

$effect(() => { gameState.flipP1 = flip.value })
$effect(() => { gameState.drawFancyBackground = background.value })
$effect(() => { gameState.drawDev = devMode.value })

const {
  leaderboard,
  localClient,
} = $derived(gameState)

let roomList: PIORoomList
let slimePlay: SlimePlay
</script>

<div class="row">
  <div class="col-6 col-md-7 col-lg-8 col-xl-9">
    <NameBox bind:value={name.value} />
  </div>
  <div class="col-6 col-md-5 col-lg-4 col-xl-3">
    <div class="input-group mb-3">
      <span class="input-group-text">Color</span>
      <input bind:value={color.value} type="text" class="form-control" placeholder="#77ff00" maxlength="7">
      <input bind:value={color.value} type="color" class="form-control form-control-color" maxlength=20>
    </div>
  </div>
</div>

<PIORoomList
  bind:this={roomList}
  gameId="slime-fd3iliszksmlav83stww"
  roomType="SlimeRoom"
  gameRoom={gameState.room}
  onJoinedRoom={(room) => gameState.enterGame(room, name.value, color.value.slice(1))}
  formatGameMode={(roomData) => getGameModeString(parseGameModeGeneric(roomCreateOptions, roomData))}
  {roomCreateOptions} />

<PlayCard
  inGame={gameState.room}
  isActive={gameState.localClient.active}
  canReady={false}
  isReady={false}
  onActive={() => gameState.sendActive()}
  onReady={() => gameState.sendReady()}
  onReset={() => gameState.sendReset()}
  onDisconnect={() => (gameState.leaveGame(), roomList.refreshRooms())}>

  <div class="input-group mb-3">
    <span class="input-group-text flex-grow-1">
      <label class="form-check mx-auto">
        <input type="radio" class="form-check-input" checked={!flip.value} onclick={() => flip.value = false}>
        Left
      </label>
    </span>
    <span class="input-group-text flex-grow-1">
      <label class="mx-auto"><!-- omit .form-check so that radio is right of label -->
        Right
        <input type="radio" class="form-check-input" checked={flip.value} onclick={() => flip.value = true}>
      </label>
    </span>
    <span class="input-group-text flex-grow-1">
      <label class="form-check mx-auto">
        <input type="checkbox" class="form-check-input" bind:checked={background.value}>
        Fancy Background
      </label>
    </span>
    <span class="input-group-text flex-grow-1">
      <label class="form-check mx-auto">
        <input type="checkbox" class="form-check-input" bind:checked={devMode.value}>
        Dev Mode
      </label>
    </span>
    <span class="input-group-text flex-grow-1">
      <label class="form-check mx-auto">
        <input id="fullscreen" type="checkbox" class="form-check-input" onclick={function () { slimePlay.requestFullscreen(); this.checked = false }}>
        <span class="form-check-label">Full-Screen</span>
      </label>
    </span>
  </div>

  <SlimePlay bind:this={slimePlay} {gameState} />
</PlayCard>

<div class="row">
  <div class="col-12 col-xl-8">
    <Leaderboard {leaderboard} {localClient} columns={[
      ['Streak', (p) => p.streak],
      ['Score', (p) => p.score],
      ['Win', (p) => [p.wins, p.total]],
      ['Loss', (p) => [p.loss, p.total]],
    ]} />
  </div>

  <div class="col-12 col-xl-4 mb-3">
    <Chat
      {chatState}
      canSend={gameState.room}
      onInput={(msg) => processChat(gameState, msg)}
    />
  </div>
</div>
