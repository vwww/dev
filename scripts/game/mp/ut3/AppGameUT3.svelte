<script lang="ts">
import Chat from '@gmc/Chat.svelte'
import GameHistoryCard from '@gmc/GameHistoryCard.svelte'
import Leaderboard from '@gmc/Leaderboard.svelte'
import NameBox from '@gmc/NameBox.svelte'
import PlayCard from '@gmc/PlayCard.svelte'
import TwoPlayerWinner from '@gmc/TwoPlayerWinner.svelte'

import PIORoomList from '@gmc/PIORoomList.svelte'

import ChatState from '@gmc/ChatState'

import UT3Game from './UT3Game'
import UT3Play from './UT3Play.svelte'

import { pStore } from '@/util/svelte'

import { roomCreateOptions, getGameModeString } from './gamemode'

const chatState = new ChatState()
const gameState = new UT3Game(chatState)

const {
  inGame,
  isActive,
  isReady,
  pastGames,
  clientsSorted,
  roundState,
} = gameState

let name = pStore('game/mp/_shared/name', '')

function formatGameMode ({optTurnTime, optInverted, optChecked, optQuick}: any) {
  return getGameModeString(optInverted === 'true', optChecked === 'true', optQuick === 'true', +optTurnTime)
}
</script>

<NameBox bind:value={$name} />

<PIORoomList
  gameId="ut3-zpfnljsogeu8x8fopwhylg"
  roomType="UT3Room"
  joinData={{ name: $name }}
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
  <UT3Play {gameState} />
</PlayCard>

<div class="row">
  <div class="col-12 col-xl-8">
    <GameHistoryCard
      canClear={!$pastGames.length}
      onClear={() => gameState.clearHistory()}>
      <TwoPlayerWinner results={$pastGames} />
    </GameHistoryCard>

    <Leaderboard players={$clientsSorted} columns={[
      ['Streak', (p) => p.streak],
      ['Score', (p) => p.score],
      ['Win', (p) => p.wins],
      ['Loss', (p) => p.loss],
      ['Ties', (p) => p.ties],
    ]} />
  </div>

  <div class="col-12 col-xl-4 mb-3">
    <Chat
      {chatState}
      onInput={msg => gameState.processCommand(msg)}
    />
  </div>
</div>
