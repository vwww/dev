<script lang="ts">
import { pState } from '@/util/svelte.svelte'

let logicPresets: Preset[][] = $state([])

const title = pState('game/sp/logic/title', '')
const description = pState('game/sp/logic/desc', '')
const clues = pState('game/sp/logic/clues', ['', '', ''])
const puzzleTypes = pState('game/sp/logic/puzzleTypes', [] as PuzzleType[])
const puzzleRules = pState('game/sp/logic/puzzleRules', [] as PuzzleRule[])
const solution = pState('game/sp/logic/solution', undefined as string[][] | undefined)

type PresetCommon = {
  name: string
  desc: string
  clues: string[]
  types: PuzzleType[]
  rules: PuzzleRule[]
}

type PuzzleType = {
  type: string
  vals: string[]
}

type PuzzleRule = {
  name: string
  type: string
  a: string
  b: string
}

interface RawPreset extends PresetCommon {
  solution?: string[][]
  solution2?: string[]
}

interface Preset extends PresetCommon {
  num: number
  solution?: string[][]
}

function loadPreset (preset: Preset): void {
  title.value = preset.name
  description.value = preset.desc
  clues.value = preset.clues.slice(0)
  puzzleTypes.value = preset.types.map((x) => ({ ...x }))
  puzzleRules.value = preset.rules.map((x) => ({ ...x }))
  solution.value = preset.solution
}

function reset (): void {
  title.value = description.value = ''
  clues.value = []
  puzzleTypes.value = []
  puzzleRules.value = []
  solution.value = undefined
}

async function loadLogic () {
  const resp = await fetch('logic.json')
  const p: Record<string, (RawPreset | null)[]> = await resp.json()

  logicPresets = Object.keys(p).sort().map((presetKey) => p[presetKey]
    .flatMap((puzzle, num) => puzzle
      ? {
          num,
          name: puzzle.name,
          desc: puzzle.desc.trim(),
          clues: puzzle.clues.map((c) => c.trim()),
          types: puzzle.types || [],
          rules: puzzle.rules || [],
          solution: puzzle.solution2 ? puzzle.solution2.map((x) => [...x].map((y, i) => puzzle.types[i].vals[+y])) : puzzle.solution,
        }
      : []
    )
  )
}

loadLogic()
</script>

<div class="row">
  <div class="col-lg-6 mb-3">
    <h2>Puzzle Info <button class="btn btn-outline-danger mb-2" onclick={reset}>Reset</button></h2>

    <input type="text" class="form-control mb-2" placeholder="Title" bind:value={title.value}>

    <textarea class="form-control" placeholder="Description" bind:value={description.value} rows="10"></textarea>
  </div>

  <div class="col-lg-6 mb-2">
    <h3>Clues <button class="btn btn-outline-success mb-2" onclick={() => { clues.value.push('') }}>+</button></h3>

    <ol>
      {#each clues.value, i}
        <li>
          <div class="input-group mb-3">
            <div class="input-group">
              <textarea class="form-control" placeholder="Clue {i + 1}" bind:value={clues.value[i]} rows="2"></textarea>
              <button class="btn btn-outline-danger" onclick={() => clues.value.splice(i, 1)}>-</button>
            </div>
          </div>
        </li>
      {/each}
    </ol>
  </div>
</div>

{#if solution.value}
  <div class="mb-2">
    <h2>Puzzle Solution</h2>
    <div class="row justify-content-center">
      <div class="col-auto">
        <table class="table table-striped table-bordered table-hover table-sm table-responsive">
          <thead>
            <tr>
              {#each puzzleTypes.value as puzzleType}
                <th scope="col">{puzzleType.type}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each solution.value as solutionRow}
              <tr>
                {#each solutionRow as solutionCol}
                  <td>{solutionCol}</td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
{/if}

<div class="row mb-2">
  <div class="col-sm-8 col-md-6">
    <h2>Grids</h2>
    TODO
  </div>
  <div class="col-sm-4 col-md-6">
    <h2>Rules</h2>
    TODO
    <!--
    Item Names
    <p>Categories:</p> [num picker, up to 4]
    <p>Items:</p> [num picker, up to 8]

    [name table]

    Rules
    [constraint add buttons]

    [constraints]
    -->
  </div>
</div>

<div>
  <h2>Preset Puzzles</h2>
  {#each logicPresets as logicPreset}
    <table class="table table-sm table-striped table-bordered table-hover">
      <thead>
        <tr>
          <th>#</th>
          <th>Title</th>
          <th>Choices</th>
          <th>Load</th>
        </tr>
      </thead>
      <tbody>
        {#each logicPreset as preset}
          <tr>
            <td>{preset.num}</td>
            <td title={preset.desc}>{preset.name} <span class="badge text-bg-secondary" title={preset.clues.join('\n\n')}>{preset.clues.length} clues</span></td>
            <td>
              {#each preset.types as presetType}
                <span class="badge text-bg-secondary me-1" title={presetType.vals.join(', ')}>{presetType.vals.length} {presetType.type}</span>
              {/each}
            </td>
            <td>
              <button onclick={() => loadPreset({ ...preset, solution: undefined })} class="btn btn-sm btn-outline-secondary" class:btn-outline-danger={!preset.rules.length}>Puzzle Only</button>
              {#if preset.solution}
                <button onclick={() => loadPreset(preset)} class="btn btn-sm btn-outline-primary">Answer</button>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/each}
</div>
