<script lang="ts">
import Chat from '@gmc/Chat.svelte'
import GameHistoryCard from '@gmc/GameHistoryCard.svelte'
import Leaderboard from '@gmc/Leaderboard.svelte'
import NameBox from '@gmc/NameBox.svelte'
import PlayCard from '@gmc/PlayCard.svelte'

import PIORoomList from '@gmc/PIORoomList.svelte'

import ChatState from '@gmc/ChatState.svelte'

import RPSGame from './RPSGame.svelte'
import RPSHistory from './RPSHistory.svelte'
import RPSPlay from './RPSPlay.svelte'

import { pState } from '@/util/svelte.svelte'

import { roomCreateOptions, getGameModeString } from './gamemode'

const chatState = new ChatState()
const gameState = new RPSGame(chatState)

const {
  inGame,
  isActive,
  isReady,
  pastGames,
  clientsSorted,
  roundState,
} = $derived(gameState)

let name = pState('game/mp/_shared/name', '')

function formatGameMode ({optClassic, optInverted, optCount, optRoundTime, optBotBalance}: any) {
  return getGameModeString(
    optClassic === 'true',
    optInverted === 'true',
    optCount === 'true',
    +optRoundTime,
    +optBotBalance,
  )
}
</script>

<NameBox bind:value={name.value} />

<PIORoomList
  gameId="rps-oj40aopjv0w7gnc1pj9zpq"
  roomType="RPSRoom"
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
  <RPSPlay {gameState} />
</PlayCard>

<div class="row">
  <div class="col-12 col-xl-8">
    <GameHistoryCard
      canClear={!pastGames.length}
      onClear={() => gameState.clearHistory()}>
      <RPSHistory results={pastGames} />
    </GameHistoryCard>

    <Leaderboard players={clientsSorted} columns={[
      ['Streak', (p) => p.roundStreak],
      ['Score', (p) => p.roundScore],
      ['Round Win', (p) => [p.roundWins, p.roundTotal]],
      ['Tie', (p) => [p.roundTies, p.roundTotal]],
      ['Loss', (p) => [p.roundLosses, p.roundTotal]],
      ['Battle Win', (p) => [p.battleWins, p.battleTotal]],
      ['Tie', (p) => [p.battleTies, p.battleTotal]],
      ['Loss', (p) => [p.battleLosses, p.battleTotal]],
    ]} />
  </div>

  <div class="col-12 col-xl-4 mb-3">
    <Chat
      {chatState}
      onInput={msg => gameState.processCommand(msg)}
    />
  </div>
</div>
