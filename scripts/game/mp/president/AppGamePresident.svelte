<script>
import Chat from '../common/Chat'
import GameHistoryCard from '../common/GameHistoryCard'
import Leaderboard from '../common/Leaderboard'
import NameBox from '../common/NameBox'
import PlayCard from '../common/PlayCard'

import PIORoomList from '../common/PIORoomList'

import ChatState from '../common/ChatState'

import PresidentGame from './PresidentGame'
import PresidentHistory from './PresidentHistory'
import PresidentPlay from './PresidentPlay'

import { pStore } from '../../../util/svelte'

import { roomCreateOptions, getGameModeString } from './gamemode'

const chatState = new ChatState()
const gameState = new PresidentGame(chatState)

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
  gameId="president-ftmxqwcwukyisw4waewyua"
  roomType="PresidentRoom"
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
  <PresidentPlay {gameState} />
</PlayCard>

<div class="row">
  <div class="col-12 col-xl-8">
    <GameHistoryCard
      canClear={!$pastGames.length}
      onClear={() => gameState.clearHistory()}>
      <PresidentHistory results={$pastGames} />
    </GameHistoryCard>

    <Leaderboard players={$clientsSorted} columns={[
      ['Score', (p) => p.score],
      ['Streak', (p) => p.streak],
      ['President', (p) => p.rank2p],
      ['VP', (p) => p.rank1p],
      ['Neutral', (p) => p.rank0],
      ['VS', (p) => p.rank1s],
      ['Scum', (p) => p.rank2s],
    ]} />
  </div>

  <div class="col-12 col-xl-4 mb-3">
    <Chat
      {chatState}
      onInput={msg => gameState.processCommand(msg)}
    />
  </div>
</div>
