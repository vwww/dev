<script lang="ts">
import Chat from '@gmc/Chat.svelte'
import GameHistoryCard from '@gmc/GameHistoryCard.svelte'
import Leaderboard from '@gmc/Leaderboard.svelte'
import NameBox from '@gmc/NameBox.svelte'
import PlayCard from '@gmc/PlayCard.svelte'

import PIORoomList from '@gmc/PIORoomList.svelte'

import ChatState from '@gmc/ChatState.svelte'

import MorraGame from './MorraGame.svelte'
import MorraHistory from './MorraHistory.svelte'
import MorraPlay from './MorraPlay.svelte'

import { pState } from '@/util/svelte.svelte'

import { roomCreateOptions, getGameModeString } from './gamemode'

let play: MorraPlay | undefined = $state()

const chatState = new ChatState()
const gameState: MorraGame = new MorraGame(chatState, () => gameState.sendMove(play!.randomizeNextNumber()))

const {
  inGame,
  isActive,
  isReady,
  pastGames,
  clientsSorted,
  roundState,
} = $derived(gameState)

let name = pState('game/mp/_shared/name', '')

function formatGameMode ({optInverted, optAddRandom, optTeams}: any) {
  return getGameModeString(optInverted === 'true', optAddRandom === 'true', +optTeams)
}
</script>

<NameBox bind:value={name.value} />

<PIORoomList
  gameId="morra-prb9sv8g70oyhq9eznhkyq"
  roomType="MorraRoom"
  joinData={{ name: name.value }}
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
  <MorraPlay {gameState} bind:this={play} />
</PlayCard>

<div class="row">
  <div class="col-12 col-lg-8">
    <GameHistoryCard
      canClear={!pastGames.length}
      onClear={() => gameState.clearHistory()}>
      <MorraHistory results={pastGames} />
    </GameHistoryCard>

    <Leaderboard players={clientsSorted} columns={[
      ['Streak', (p) => p.streak],
      ['Score', (p) => p.wins - p.losses],
      ['Win', (p) => [p.wins, p.total]],
      ['Loss', (p) => [p.losses, p.total]],
    ]} />
  </div>

  <div class="col-12 col-lg-4 mb-3">
    <Chat
      {chatState}
      onInput={(msg) => gameState.processCommand(msg)}
    />
  </div>
</div>
