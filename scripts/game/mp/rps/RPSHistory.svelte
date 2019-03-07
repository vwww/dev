<script lang="ts">
import type { RPSGameHistory } from './RPSGame.svelte'

interface Props {
  results: ArrayLike<RPSGameHistory>
}

const { results }: Props = $props()

const outcomePairs = [
  {
    a: 'R', b: 'P',
    text: [
      ['covers', 'hides'],
      ['matches'],
      ['punctures'],
    ],
    textBitShift: 0,
  },
  {
    a: 'P', b: 'S',
    text: [
      ['cuts', 'slices'],
      ['matches'],
      ['jams'],
    ],
    textBitShift: 1,
  },
  {
    a: 'S', b: 'R',
    text: [
      ['smashes', 'obliterates', 'breaks', 'destroys'],
      ['matches'],
      ['slashes', 'scratches'],
    ],
    textBitShift: 2,
  },
]

function getOutcomeText<T>(text: T[], textBitShift: number, detRandBits: number): T {
  // text.length must be a power of 2
  const mask = text.length - 1
  return text[(detRandBits >> textBitShift) & mask]
}
</script>

<ul class="list-group list-group-flush overflow-auto" style="max-height: 15rem">
  {#each results as pastGame}
    <li class="list-group-item">
      {#if pastGame.local}
        <p>
          You: <span class="badge text-bg-primary">{pastGame.local.newStreak > 0 ? '+' : ''}{pastGame.local.newStreak}</span> streak;
          <span class="badge text-bg-success">{pastGame.local.battleLTW[2]}</span> win,
          <span class="badge text-bg-danger">{pastGame.local.battleLTW[0]}</span> lose,
          <span class="badge text-bg-warning">{pastGame.local.battleLTW[1]}</span> tie
        </p>
      {/if}
      <div class="row">
        <div class="col-auto">
          <table class="table table-sm">
            <tbody>
              <tr class="text-center">
                <th>#</th>
                <th>Outcome</th>
                <th>#</th>
              </tr>
              {#each outcomePairs as move, i}
                {@const nextIndex = (i + 1) % 3}
                {@const localMove = pastGame.local?.move}
                <tr>
                  <td class={localMove == i ? 'table-danger' : localMove == nextIndex ? 'table-primary' : ''}>{pastGame.count[(i + 1) % 3]}</td>
                  <td>
                    {move.b}
                    <span class="badge text-bg-{pastGame.outcomes[i] < 0 ? 'primary' : pastGame.outcomes[i] > 0 ? 'danger' : 'secondary'}">
                      {#if pastGame.outcomes[i] > 0}&lt;{/if}
                      {getOutcomeText(move.text[pastGame.outcomes[i] + 1], move.textBitShift, pastGame.detRandBits)}
                      {#if pastGame.outcomes[i] < 0}&gt;{/if}
                    </span>
                    {move.a}
                  </td>
                  <td class={localMove == nextIndex ? 'table-success' : localMove == i ? 'table-primary' : ''}>{pastGame.count[i]}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        <div class="col-auto">
          <table class="table table-sm">
            <tbody>
              <tr class="text-center">
                <th>Move</th>
                <th>Wins</th>
                <th>Ties</th>
                <th>Loss</th>
                <th>Score</th>
                <th>Players</th>
              </tr>
              {#each pastGame.moves as move, i}
                {@const score = move.ltw[2] - move.ltw[0]}
                <tr class:table-primary={pastGame.local && pastGame.local.move === i}>
                  <td>{['Rock', 'Paper', 'Scissors'][i]}</td>
                  <td>{move.ltw[2]}</td>
                  <td>{move.ltw[1]}</td>
                  <td>{move.ltw[0]}</td>
                  <td>{score > 0 ? '+' : ''}{score}</td>
                  <td>
                    {pastGame.count[i]}:
                    {#each move.players as player, i}
                      <span class="badge text-bg{i == move.meIndex ? '' : '-outline'}-secondary">{player}</span>
                    {/each}
                    {#if pastGame.botCount[i]}
                      <span class="badge text-bg-outline-secondary">+{pastGame.botCount[i]}</span>
                    {/if}
                    {#if !(move.players.length || pastGame.botCount[i])}nobody{/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </li>
  {:else}
    <li class="list-group-item">No past games!</li>
  {/each}
</ul>
