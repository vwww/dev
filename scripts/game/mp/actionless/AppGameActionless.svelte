<script lang="ts">
import Chat from '@gmc/Chat.svelte'
import ChatState, { processChat } from '@gmc/ChatState.svelte'
import GameHistoryCard from '@gmc/GameHistoryCard.svelte'
import Leaderboard from '@gmc/Leaderboard.svelte'
import NameBox from '@gmc/NameBox.svelte'
import PlayCard from '@gmc/PlayCard.svelte'
import { parseGameModeGeneric, type GamemodeFromOptions } from '@gmc/RoomOption.svelte'
import PIORoomList from '@gmc/PIORoomList.svelte'

import { ActionlessGame, GameState } from './ActionlessGame2.svelte'
import ActionlessHistory from './ActionlessHistory.svelte'
import ActionlessPlay from './ActionlessPlay.svelte'

import { pState } from '@/util/svelte.svelte'

const chatState = new ChatState()
const gameState = new ActionlessGame(chatState)

const {
  pastGames,
  leaderboard,
  roundState,
} = $derived(gameState)

let name = pState('game/mp/_shared/name', '')

let roomList: PIORoomList
</script>

<script lang="ts" module>
const roomCreateOptions = [
  ['optIndependent', 'b', false, 'Independent', 'players or teams win/lose independently of each other'],
  ['optTeams', 'i', 0, 'Teams', 'number of teams players are randomly assigned to every game', 0, 45],
] as const

export type ActionlessMode = GamemodeFromOptions<typeof roomCreateOptions>

export function getGameModeString ({ optIndependent, optTeams }: ActionlessMode): string {
  return (optIndependent ? 'Independent ' : 'One-Winner ') + (optTeams ? optTeams + ' Teams' : 'FFA')
}
</script>

<NameBox bind:value={name.value} />

<PIORoomList
  bind:this={roomList}
  gameId="actionless-rv9luoetuchidspmvghiq"
  roomType="ActionlessRoom"
  onJoinedRoom={(room) => gameState.enterGame(room, name.value)}
  formatGameMode={(roomData) => getGameModeString(parseGameModeGeneric(roomCreateOptions, roomData))}
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
  <ActionlessPlay {gameState} />
</PlayCard>

<div class="row">
  <div class="col-12 col-lg-8">
    <GameHistoryCard
      canClear={!pastGames.length}
      onClear={() => gameState.clearHistory()}>
      <ActionlessHistory results={pastGames} />
    </GameHistoryCard>

    <Leaderboard players={leaderboard} columns={[
      ['Streak', (p) => p.streak],
      ['Score', (p) => p.wins - p.losses],
      ['Win', (p) => [p.wins, p.total]],
      ['Loss', (p) => [p.losses, p.total]],
    ]} />
  </div>

  <div class="col-12 col-lg-4 mb-3">
    <Chat
      {chatState}
      onInput={(msg) => processChat(gameState, msg)}
    />
  </div>
</div>
