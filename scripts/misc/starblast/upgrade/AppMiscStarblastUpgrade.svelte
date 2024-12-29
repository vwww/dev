<script lang="ts">
import ships_alienintrusion from './ships_alienintrusion.json'
import ships_kest from './ships_kest.json'
import ships_mcst from './ships_mcst.json'
import ships_nauticseries from './ships_nauticseries.json'
import ships_strawberry from './ships_strawberry.json'
import ships_useries from './ships_useries.json'
import ships_vanilla from './ships_vanilla.json'

import { solve } from './solve'

type number2 = [number, number]
type ShipInfo = [name: string, level: number, code: number, regen: number2, damage: number2]
type GroupedShipInfo = [level: number, ships: ShipInfo[]][]
type ModInfo = [name: string, ships: GroupedShipInfo]

const mods: readonly Readonly<ModInfo>[] = [
  ['Vanilla', groupByLevel(ships_vanilla as any)],
  ['U-series team mode', groupByLevel(ships_useries as any)],
  ['Alien Intrusion', groupByLevel(ships_alienintrusion as any)],
  ['Nautic series', groupByLevel(ships_nauticseries as any)],
  ['MCST (Multi Class Ship Tree)', groupByLevel(ships_mcst as any)],
  ["KEST (Kleinem's Enhanced Ship Tree)", groupByLevel(ships_kest as any)],
  ['Strawberry', groupByLevel(ships_strawberry as any)],
] as const

function groupByLevel (ships: ShipInfo[]): GroupedShipInfo {
  const levels: Record<number, ShipInfo[]> = {}
  for (const ship of ships) {
    const lvl = ship[1]
    ;(levels[lvl] ??= []).push(ship)
  }

  const levelKeys = Object.keys(levels).map(Number).sort()
  return levelKeys.map((lvl) => [lvl, levels[lvl]])
}

let mod = $state(mods[0])
let ship = $state(mods[0][1][1][1][1]) // Trident

let shipLevel = $state(2)
let shipEnergy = $state([15, 20])
let shipDamage = $state([20, 40])

function loadShip () {
  shipLevel = ship[1]
  shipEnergy = ship[3].slice()
  shipDamage = ship[4].slice()
}

const upgradeInfo = $derived(solve(shipLevel, shipEnergy[0], shipEnergy[1], shipDamage[0], shipDamage[1]))
</script>

<div class="input-group mb-3">
  <span class="input-group-text">Mod</span>
  <select class="form-select" bind:value={mod}>
    {#each mods as m}
      <option value={m}>{m[0]}</option>
    {/each}
  </select>
  <span class="input-group-text">Ship</span>
  <select class="form-select" bind:value={ship}>
    {#each mod[1] as lvl}
      <optgroup label="Level {lvl[0]}">
        {#each lvl[1] as s}
          <option value={s}>{s[1]} - {s[2]} - {s[0]}</option>
        {/each}
      </optgroup>
    {/each}
  </select>
  <button class="btn btn-outline-secondary" type="button" onclick={loadShip}>Load</button>
</div>

<div class="input-group mb-5">
  <span class="input-group-text">Level</span>
  <input type="number" class="form-control" min="1" max="16" bind:value={shipLevel}>
  <span class="input-group-text">Energy Regen</span>
  <input type="number" class="form-control" bind:value={shipEnergy[0]}>
  <input type="number" class="form-control" bind:value={shipEnergy[1]}>
  <span class="input-group-text">Damage</span>
  <input type="number" class="form-control" bind:value={shipDamage[0]}>
  <input type="number" class="form-control" bind:value={shipDamage[1]}>
</div>

<table class="table table-bordered">
  <thead>
    <tr>
      <th style="width: 0">Damage\Energy</th>
      {#each upgradeInfo.table[0], i}
        <th>{i}</th>
      {/each}
    </tr>
  </thead>
  <tbody>
  {#each upgradeInfo.table as upgradeTableRow, d}
    <tr>
      <th>{d}</th>
      {#each upgradeTableRow as cell}
        <td class:table-success={Math.abs(cell[3] - upgradeInfo.bestTimeMax) < 0.001}>
          {cell[4] & 1 ? '<' : ''}{cell[4] & 2 ? '^' : ''}<br>
          {cell[0].toPrecision(4)}x<br>
          {cell[1].toPrecision(4)}T<br>
          {cell[5].toPrecision(4)}/{cell[6].toPrecision(4)}<br>
          {cell[3].toPrecision(4)}T
        </td>
      {/each}
    </tr>
  {/each}
  </tbody>
</table>

<p>The row indicates the number of damage <kbd>5</kbd> upgrades.</p>
<p>The column indicates the number of energy regen <kbd>4</kbd> upgrades.</p>

<div>
  In each cell,
  <ol>
    <li>Line 1 shows the predecessor.<br>
      Tracing to the first cell finds all optimal paths to the current cell.</li>
    <li>Line 2 shows the mining speed relative to an unupgraded ship.</li>
    <li>Line 3 shows the optimal time to upgrade here. T is the time spent on mining for one upgrade when the ship is unupgraded.</li>
    <li>Line 4 shows the energy regen and DPS.<br>
      The mining speed is the minimum of the two numbers.</li>
    <li>Line 5 shows the optimal time to mine here and fill the cargo.<br>
      The minimum cells are highlighted.<br>
      To upgrade to the next tier optimally, start at any highlighted cell and trace any path to the top-left cell.<br>
      Paths: {upgradeInfo.bestNextTierPaths.join(', ')}
    </li>
    <li>To max a ship optimally, start from the bottom-right cell and trace any path to the top-left cell.<br>
      Paths: {upgradeInfo.bestMaxPaths.join(', ')}
    </li>
  </ol>
</div>
