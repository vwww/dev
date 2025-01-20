<script lang="ts">
import { pStore } from '@/util/svelte'

import exampleHXS from './HXS'
import exampleHXQ from './HXQ'
import exampleQQC from './QQC'
import exampleVFV from './VFV'

import { copyFundInfo, loadComparison, type Comparison } from './fundInfo'
import { generateComparisonMatrix, type MatrixRowFund, type OutcomeMatrix } from './fundOutcome'

const EXAMPLES: readonly Example[] = [
  ['HXQ and QQC', exampleHXQ, exampleQQC],
  ['HXS and VFV', exampleHXS, exampleVFV],
]

type Example = [name: string, ...Comparison]

function loadExample (example: Example): Comparison {
  return [copyFundInfo(example[1]), copyFundInfo(example[2])]
}

const initialInvestment = pStore('tool/fund/initialInvestment', 10000)
const capitalGainsRatePercent = pStore('tool/fund/capitalGainsRateP', 50)
const taxRatePercent = pStore('tool/fund/taxRateP', 30)
const showResultType = pStore('tool/fund/showResultType', 3)

const capitalGainsRate = $derived($capitalGainsRatePercent / 100)
const taxRate = $derived($taxRatePercent / 100)

let comparison = $state(loadExample(EXAMPLES[0]))

let selectedExample = $state(EXAMPLES[0])
let importExportText = $state('')

let selectedPeriod: [name: string, outcomeIndex: number, r: number, c: number] | undefined = $state()

const outcomes = $derived([
  generateComparisonMatrix(comparison, { capitalGainsRate, taxRate }),
  generateComparisonMatrix(comparison),
])

function fundImport (): void {
  comparison = loadComparison(importExportText)
  selectedPeriod = undefined
}

function fundExport (): void {
  importExportText = JSON.stringify(comparison)
}

function formatPercentChange (multiplier: number): string {
  return (multiplier - 1).toLocaleString('en', { style: 'percent', minimumFractionDigits: 3, signDisplay: 'always' })
}

function formatShares (shares: number): string {
  return shares.toPrecision(9)
}

function formatDollars (dollars: number): string {
  return dollars.toFixed(2)
}

function formatDollarsUnrounded (dollars: number): string {
  return dollars.toLocaleString('en', { minimumFractionDigits: 3 })
}
</script>

<ul class="nav nav-tabs nav-fill mb-3" role="tablist">
  <li class="nav-item">
    <a class="nav-link active" data-bs-toggle="tab" href="#funds" role="tab" aria-controls="funds" aria-selected="true">Fund Info</a>
  </li>
  <li class="nav-item">
    <a class="nav-link" id="import-export-tab" data-bs-toggle="tab" href="#import-export" role="tab" aria-controls="import-export" aria-selected="false">Import/Export</a>
  </li>
  <li class="nav-item">
    <a class="nav-link" id="results-tab" data-bs-toggle="tab" href="#results" role="tab" aria-controls="contact" aria-selected="false">Results</a>
  </li>
</ul>

<div class="tab-content">
  <div class="tab-pane show active" id="funds" role="tabpanel" aria-labelledby="funds-tab">
    <div class="alert alert-secondary" role="alert">
      <h4 class="alert-heading">Under Construction!</h4>
      This tab is still under construction, although the other tabs are working.
    </div>

    <button class="btn btn-outline-primary d-block w-100 mb-3" onclick={() => comparison = [comparison[1], comparison[0]]}>Swap</button>
    {#snippet fundEditor(i: number)}
      {@const fund = comparison[i]}
      <div class="col-md-6">
        <h2>Fund {i+1}</h2>
        <input type="text" class="form-control mb-2" placeholder="Fund Name" bind:value={fund.name}>
      </div>
    {/snippet}
    <div class="row">
      {@render fundEditor(0)}
      {@render fundEditor(1)}
    </div>
  </div>
  <div class="tab-pane" id="import-export" role="tabpanel" aria-labelledby="import-export-tab">
    <div class="input-group mb-3">
      <button class="btn btn-outline-primary" onclick={fundImport}>Import from Text</button>
      <button class="btn btn-outline-danger" onclick={fundExport}>Export to Text</button>
      <span class="input-group-text">Examples</span>
      <select class="form-select" bind:value={selectedExample}>
        {#each EXAMPLES as e}
          <option value={e}>{e[0]}</option>
        {/each}
      </select>
      <button class="btn btn-outline-secondary" onclick={() => (comparison = loadExample(selectedExample), selectedPeriod = undefined, fundExport())}>Load and Import</button>
    </div>
    <textarea class="form-control" bind:value={importExportText}></textarea>
  </div>
  <div class="tab-pane" id="results" role="tabpanel" aria-labelledby="results-tab">
    <h2>Settings</h2>
    <p>Tax Rate / %</p>
    <input type="number" class="form-control" min=0 bind:value={$taxRatePercent}>
    <input type="range" class="form-range" min=0 max=100 bind:value={$taxRatePercent}>
    <p>Capital Gains Inclusion Rate / %</p>
    <input type="number" class="form-control" min=0 bind:value={$capitalGainsRatePercent}>
    <input type="range" class="form-range" min=0 max=100 bind:value={$capitalGainsRatePercent}>
    <p>Initial Investment / $</p>
    <input type="number" class="form-control" bind:value={$initialInvestment}>
    <div class="my-2">
      <b class="me-3">Show as</b>
      <label class="form-check form-check-inline">
        <input type="radio" class="form-check-input" bind:group={$showResultType} value={1}>
        <span class="form-check-label">Difference</span>
      </label>
      <label class="form-check form-check-inline">
        <input type="radio" class="form-check-input" bind:group={$showResultType} value={2}>
        <span class="form-check-label">Returns</span>
      </label>
      <label class="form-check form-check-inline">
        <input type="radio" class="form-check-input" bind:group={$showResultType} value={3}>
        <span class="form-check-label">Both</span>
      </label>
    </div>
    <h2>Comparison</h2>
    {#snippet comparisonTable(name: string, outcomes: OutcomeMatrix[], outcomeIndex: number)}
      {@const outcome = outcomes[outcomeIndex]}
      {@const tableSize = outcome.length}
      <div class="col-12">
        <table class="table table-bordered table-hover caption-top w-auto">
          <caption>{name}</caption>
          <thead>
            <tr>
              <th rowspan=2 colspan=2></th>
              <th colspan={tableSize}>End Year</th>
            </tr>
            <tr style="position: sticky; top: 0; z-index: 1">
              {#each outcome as [year]}
                <th>{year}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each outcome as [year, [rowA, rowB]], i}
              <tr>
                {#if !i}
                  <th rowspan={tableSize}><div style="writing-mode: vertical-lr; transform: rotate(180deg)">Start Year</div></th>
                {/if}
                <th style="position: sticky; left: 0">{year}</th>
                {#if i}
                  <td colspan={i} class="table-secondary"></td>
                {/if}
                {#each rowA?.cols ?? rowB?.cols ?? [], j}
                  {@const colA = rowA?.cols[j]}
                  {@const colB = rowB?.cols[j]}
                  {@const resultA = colA ? formatPercentChange(colA.value) : 'N/A'}
                  {@const resultB = colB ? formatPercentChange(colB.value) : 'N/A'}
                  {@const resultDiff = colA && colB ? formatPercentChange(colA.value / colB.value) : '?'}
                  <td
                    class:table-warning={selectedPeriod?.[1] == outcomeIndex && selectedPeriod[2] == i && selectedPeriod[3] == j}
                    role="button" onclick={() => selectedPeriod = [name, outcomeIndex, i, j]}>
                    {#if $showResultType & 1}{resultDiff}{/if}
                    {#if $showResultType == 3}<br>{/if}
                    {#if $showResultType & 2}{resultA}<br>{resultB}{/if}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/snippet}
    <div class="row">
      {@render comparisonTable('Non-registered account', outcomes, 0)}
      {@render comparisonTable('Registered account', outcomes, 1)}
    </div>
    {#if selectedPeriod}
      {@const [name, outcomeIndex, r, c] = selectedPeriod}
      {@const outcome = outcomes[outcomeIndex]}
      {@const [year0, [rowA, rowB]] = outcome[r]}
      {@const [year1] = outcome[r + c]}
      <h2>Details of {name} {year0} {#if year1 != year0}to {year1}{/if}</h2>
      {#snippet details(fundName: string, row?: MatrixRowFund)}
        {@const cell = row?.cols[c]}
        <div class="col-12">
          {#if cell}
            <table class="table table-bordered table-hover caption-top w-auto">
              <caption>{fundName} ({formatPercentChange(cell.value)})</caption>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Price</th>
                  <th>Shares</th>
                  <th>Market Value</th>
                  <th>Book Value</th>
                  <th>ACB</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {#each row.lines.slice(0, cell.lineCount).concat(...cell.lineAdditional ?? []) as line}
                  <tr>
                    <td>{line.date}</td>
                    <td class="text-end">{formatDollars(line.price)}</td>
                    <td class="text-end">{formatShares(line.shares * $initialInvestment)}</td>
                    <td class="text-end">{formatDollarsUnrounded(line.shares * line.price * $initialInvestment)}</td>
                    <td class="text-end">{formatDollarsUnrounded(line.bookValue * $initialInvestment)}</td>
                    <td class="text-end">{formatDollarsUnrounded(line.bookValue / line.shares)}</td>
                    <td>{line.description}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {:else}
            <p>{fundName} is missing data for this time period.</p>
          {/if}
        </div>
      {/snippet}
      <div class="row">
        {@render details(comparison[0].name, rowA)}
        {@render details(comparison[1].name, rowB)}
      </div>
    {:else}
      <h2>Details</h2>
      <p>Click a table cell for details.</p>
    {/if}
  </div>
</div>
