<script lang="ts">
import { pStore } from '../../../util/svelte'

import Chat from '../common/Chat.svelte'
import GameHistoryCard from '../common/GameHistoryCard.svelte'
import Leaderboard from '../common/Leaderboard.svelte'
import NameBox from '../common/NameBox.svelte'
import PlayCard from '../common/PlayCard.svelte'
import TwoPlayerWinner from '../common/TwoPlayerWinner.svelte'

import PIORoomList from '../common/PIORoomList.svelte'

import ChatState from '../common/ChatState'

import T3Game from './T3Game'
import T3Play from './T3Play.svelte'

import { roomCreateOptions, getGameModeString } from './gamemode'

const chatState = new ChatState()
const gameState = new T3Game(chatState)

const {
  inGame,
  isActive,
  isReady,
  pastGames,
  clientsSorted,
  roundState,
} = gameState

let t3Isomorphism = pStore('game/mp/t3/isomorphism', 0)
let name = pStore('game/mp/_shared/name', '')

function formatGameMode ({ optTurnTime, optInverted, optChecked, optQuick }: any) {
  return getGameModeString(optInverted === 'true', optChecked === 'true', optQuick === 'true', +optTurnTime)
}
</script>

<div class="btn-group d-flex mb-3" role="group">
  <span class="input-group-text">Isomorphism</span>
  <button class="w-100 btn btn-outline-secondary"
    class:active={!$t3Isomorphism}
    on:click={() => { $t3Isomorphism = 0 }}>Tic-Tac-Toe</button>
  <button class="w-50 btn btn-outline-secondary"
    class:active={$t3Isomorphism === 1}
    on:click={() => { $t3Isomorphism = 1 }}>Pick15</button>
  <button class="w-50 btn btn-outline-secondary"
    class:active={$t3Isomorphism === 2}
    on:click={() => { $t3Isomorphism = 2 }}>Words</button>
</div>

<NameBox bind:value={$name} />

<PIORoomList
  gameId="t3-k9s5th8thueeuso1rkilqw"
  roomType="T3Room"
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
  <T3Play {gameState} t3Isomorphism={$t3Isomorphism} />
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
      onInput={(msg) => gameState.processCommand(msg)}
    />
  </div>
</div>
