<script>
import Chat from '../common/Chat'
import GameHistoryCard from '../common/GameHistoryCard'
import Leaderboard from '../common/Leaderboard'
import NameBox from '../common/NameBox'
import PlayCard from '../common/PlayCard'

import PIORoomList from '../common/PIORoomList'

import ChatState from '../common/ChatState'

import CheatGame from './CheatGame'
import CheatHistory from './CheatHistory'
import CheatPlay from './CheatPlay'

import { pStore } from '../../../util/svelte'

import { roomCreateOptions, getGameModeString } from './gamemode'

const chatState = new ChatState()
const gameState = new CheatGame(chatState)

const {
  inGame,
  isActive,
  isReady,
  pastGames,
  clientsSorted,
  roundState,
} = gameState

let name = pStore('game/mp/_shared/name', '')

function formatGameMode ({optCount, optRank, optRounds, optPenalty}) {
  return getGameModeString()
}
</script>

<NameBox bind:value={$name} />

<PIORoomList
  gameId="cheat-zoded3ozqeqvek0bpz3fow"
  roomType="CheatRoom"
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
  <CheatPlay {gameState} />
</PlayCard>

<div class="row">
  <div class="col-12 col-xl-8">
    <GameHistoryCard
      canClear={!$pastGames.length}
      onClear={() => gameState.clearHistory()}>
      <CheatHistory results={$pastGames} />
    </GameHistoryCard>

    <Leaderboard players={$clientsSorted} columns={[
      ['Score', (p) => p.score],
      ['Wins', (p) => p.wins],
      ['Streak', (p) => p.streak],
      ['Best Rank', (p) => p.rankBest],
      ['Worst Rank', (p) => p.rankWorst],
      ['Last Rank', (p) => p.rankLast],
    ]} />
  </div>

  <div class="col-12 col-xl-4 mb-3">
    <Chat
      {chatState}
      onInput={msg => gameState.processCommand(msg)}
    />
  </div>
</div>
