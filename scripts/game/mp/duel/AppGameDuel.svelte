<script lang="ts">
import { pState } from '@/util/svelte.svelte'

import Chat from '@gmc/Chat.svelte'
import ChatState, { processChat } from '@gmc/ChatState.svelte'
import Leaderboard from '@gmc/Leaderboard.svelte'
import NameBox from '@gmc/NameBox.svelte'
import PlayCard from '@gmc/PlayCard.svelte'
import { parseGameModeGeneric } from '@gmc/RoomOption'
import PIORoomList from '@gmc/PIORoomList.svelte'

import { DuelGame } from './DuelGame.svelte'
import DuelPlay from './DuelPlay.svelte'

import { roomCreateOptions, getGameModeString } from './gamemode'

const chatState = new ChatState()
const gameState = new DuelGame(chatState)

const {
  leaderboard,
  localClient,
} = $derived(gameState)

let name = pState('game/mp/_shared/name', '')
let hue = pState('game/mp/duel/hue', '42')

let roomList: PIORoomList

function onclickhue (event: MouseEvent) {
  const target = event.target as HTMLDivElement
  const h = (event.clientX - target.getBoundingClientRect().left) / target.clientWidth
  const hueHex = ('0' + ((h * 0xFF) | 0).toString(16)).slice(-2)
  hue.value = hueHex
}
</script>

<div class="row">
  <div class="col-7 col-sm-8 col-md-9 col-lg-10">
    <NameBox bind:value={name.value} />
  </div>
  <div class="col-5 col-sm-4 col-md-3 col-lg-2">
    <div class="input-group mb-3">
      <span class="input-group-text">Hue</span>
      <input bind:value={hue.value} type="text" class="form-control" placeholder="42" maxlength="2" style="background-color: hsl({parseInt(hue.value, 16) * (360 / 0x100)},95%,65%);">
    </div>
  </div>
  <div class="col mb-3">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div id="hue" onclick={onclickhue}></div>
  </div>
</div>

<PIORoomList
  bind:this={roomList}
  gameId="duel-tfbkn9e0umxmt1xrxv4g"
  roomType="DuelRoom"
  gameRoom={gameState.room}
  onJoinedRoom={(room) => gameState.enterGame(room, name.value, hue.value)}
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
  <DuelPlay {gameState} />
</PlayCard>

<div class="row">
  <div class="col-12 col-xl-8">
    <Leaderboard {leaderboard} {localClient} columns={[
      ['Score', (p) => p.score],
      ['Kills', (p) => p.kills],
      ['Deaths', (p) => p.deaths],
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

<style>
#hue {
  width: 100%;
  height: 36px;
  background: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
  border: solid #ccc 2px;
}
</style>
