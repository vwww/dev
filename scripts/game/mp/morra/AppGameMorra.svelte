<script>
import Chat from '../common/Chat'
import GameHistoryCard from '../common/GameHistoryCard'
import Leaderboard from '../common/Leaderboard'
import NameBox from '../common/NameBox'
import PlayCard from '../common/PlayCard'

import PIORoomList from '../common/PIORoomList'

import ChatState from '../common/ChatState'

import MorraGame from './MorraGame'
import MorraHistory from './MorraHistory'
import MorraPlay from './MorraPlay'

import { pStore } from '../../../util/svelte'

import { roomCreateOptions, getGameModeString } from './gamemode'

let play

const chatState = new ChatState()
const gameState = new MorraGame(chatState, () => gameState.sendMove(play.randomizeNextNumber()))

const {
  inGame,
  isActive,
  isReady,
  pastGames,
  clientsSorted,
  roundState,
} = gameState

let name = pStore('game/mp/_shared/name', '')

function formatGameMode ({optInverted, optAddRandom, optTeams}) {
  return getGameModeString(optInverted === 'true', optAddRandom === 'true', +optTeams)
}
</script>

<NameBox bind:value={$name} />

<PIORoomList
  gameId="morra-prb9sv8g70oyhq9eznhkyq"
  roomType="MorraRoom"
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
  <MorraPlay {gameState} bind:this={play} />
</PlayCard>

<div class="row">
  <div class="col-12 col-lg-8">
    <GameHistoryCard
      canClear={!$pastGames.length}
      onClear={() => gameState.clearHistory()}>
      <MorraHistory results={$pastGames} />
    </GameHistoryCard>

    <Leaderboard players={$clientsSorted} columns={[
      ['Streak', (p) => p.streak],
      ['Score', (p) => p.wins - p.losses],
      ['Win', (p) => p.wins],
      ['Loss', (p) => p.losses],
    ]} />
  </div>

  <div class="col-12 col-lg-4 mb-3">
    <Chat
      {chatState}
      onInput={msg => gameState.processCommand(msg)}
    />
  </div>
</div>