<script lang="ts">
import Chat from '@gmc/Chat.svelte'
import GameHistoryCard from '@gmc/GameHistoryCard.svelte'
import Leaderboard from '@gmc/Leaderboard.svelte'
import NameBox from '@gmc/NameBox.svelte'
import PlayCard from '@gmc/PlayCard.svelte'

import PIORoomList from '@gmc/PIORoomList.svelte'

import ChatState from '@gmc/ChatState'

import DiscardGame from './DiscardGame'
import DiscardPlay from './DiscardPlay.svelte'
import DiscardGameHistory from './DiscardGameHistory.svelte'

import { pState } from '@/util/svelte.svelte'

import { getGameModeString, roomCreateOptions } from './common'

const chatState = new ChatState()
const gameState = new DiscardGame(chatState)

const {
  inGame,
  isActive,
  isReady,
  pastGames,
  clientsSorted,
  roundState,
} = gameState

let name = pState('game/mp/_shared/name', '')
let showLLNames = pState('game/mp/discard/LL', true)
let showCardCount = pState('game/mp/discard/cardCount', true)

function formatGameMode ({optDecks, optTurnTime}: any) {
  return getGameModeString(+optDecks, +optTurnTime)
}
</script>

<NameBox bind:value={name.value} />

<div class="input-group mb-3">
  <span class="input-group-text flex-grow-1">
    <label class="form-check mx-auto">
      <input type="checkbox" class="form-check-input" bind:checked={showLLNames.value}>
      Show Love Letter Names
    </label>
  </span>
  <span class="input-group-text flex-grow-1">
    <label class="form-check mx-auto">
      <input type="checkbox" class="form-check-input" bind:checked={showCardCount.value}>
      Show Card Count
    </label>
  </span>
</div>

<PIORoomList
  gameId="discard-l3z5n5wptuoeqtkytj64a"
  roomType="DiscardRoom"
  joinData={{name: name.value}}
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
  <DiscardPlay {gameState} ll={showLLNames.value} showCardCount={showCardCount.value} />
</PlayCard>

<div class="row">
  <div class="col-12 col-xl-8">
    <GameHistoryCard
      canClear={!$pastGames.length}
      onClear={() => gameState.clearHistory()}>
      <DiscardGameHistory results={$pastGames} ll={showLLNames.value} />
    </GameHistoryCard>

    <Leaderboard players={$clientsSorted} columns={[
      ['Score', (p) => p.score],
      ['Streak', (p) => p.streak],
      ['Win', (p) => p.wins],
      ['Loss', (p) => p.losses],
      ['Rank Last', (p) => p.rankLast],
      ['Best', (p) => p.rankBest],
      ['Worst', (p) => p.rankWorst],
    ]} />
  </div>

  <div class="col-12 col-xl-4 mb-3">
    <Chat
      {chatState}
      onInput={msg => gameState.processCommand(msg)}
    />
  </div>
</div>
