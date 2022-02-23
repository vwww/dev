<script>
import Chat from '../common/Chat'
import GameHistoryCard from '../common/GameHistoryCard'
import Leaderboard from '../common/Leaderboard'
import NameBox from '../common/NameBox'
import PlayCard from '../common/PlayCard'

import PIORoomList from '../common/PIORoomList'

import ChatState from '../common/ChatState'

import DiscardGame from './DiscardGame'
import DiscardPlay from './DiscardPlay'
import DiscardGameHistory from './DiscardGameHistory'

import { pStore } from '../../../util/svelte'

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

let name = pStore('game/mp/_shared/name', '')
let showLLNames = pStore('game/mp/discard/LL', true)

function formatGameMode ({optDecks}) {
  return getGameModeString(+optDecks)
}
</script>

<NameBox bind:value={$name} />

<div class="input-group mb-3">
  <span class="input-group-text flex-grow-1">
    <label class="form-check mx-auto">
      <input type="checkbox" class="form-check-input" bind:checked={$showLLNames}>
      Show Love Letter Names
    </label>
  </span>
</div>

<PIORoomList
  gameId="discard-l3z5n5wptuoeqtkytj64a"
  roomType="DiscardRoom"
  joinData={{name: $name}}
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
  <DiscardPlay {gameState} ll={$showLLNames} />
</PlayCard>

<div class="row">
  <div class="col-12 col-xl-8">
    <GameHistoryCard
      canClear={!$pastGames.length}
      onClear={() => gameState.clearHistory()}>
      <DiscardGameHistory results={$pastGames} ll={$showLLNames} />
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
