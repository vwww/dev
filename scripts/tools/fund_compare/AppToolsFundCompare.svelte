<script lang="ts">
import { deepCopy, padYear, sum } from '@/util'
import { pState } from '@/util/svelte.svelte'

import exampleHULC from './HULC'
import exampleHXS from './HXS'
import exampleHXQ from './HXQ'
import exampleQQC from './QQC'
import exampleVFV from './VFV'
import exampleUSCC from './USCC'

import { loadComparison, type Comparison, type Fund } from './fundInfo'
import { generateComparisonMatrix, type MatrixRowFund, type OutcomeMatrix } from './fundOutcome'

const STEP_CENT = 0.01
const STEP_DIST = 0.000001

const EXAMPLES: readonly Example[] = [
  ['Nasdaq-100', exampleHXQ, exampleQQC],
  ['Solactive US Large Cap', exampleHULC],
  ['S&P 500', exampleHXS, exampleVFV, exampleUSCC],
]

type Example = [name: string, ...Fund[]]

function loadExample (a: Fund, b: Fund): Comparison {
  return [deepCopy(a), deepCopy(b)]
}

const initialInvestment = pState('tool/fund/initialInvestment', 10000)
const capitalGainsRatePercent = pState('tool/fund/capitalGainsRateP', 50)
const taxRatePercent = pState('tool/fund/taxRateP', 30)
const showResultType = pState('tool/fund/showResultType', 3)
const showDiffAsMultiplier = pState('tool/fund/showDiffAsMultiplier', false)
const showGainAsMultiplier = pState('tool/fund/showGainAsMultiplier', false)
const showStartAsRow = pState('tool/fund/showStartAsRow', true)

const capitalGainsRate = $derived(capitalGainsRatePercent.value / 100)
const taxRate = $derived(taxRatePercent.value / 100)

let comparison = $state(loadExample(EXAMPLES[0][1], EXAMPLES[0][2]))

let selectedFund0 = $state(EXAMPLES[0][1])
let selectedFund1 = $state(EXAMPLES[0][2])
let importExportText = $state('')

let selectedPeriod: [name: string, outcomeIndex: number, r: number, c: number] | undefined = $state()
let modalDetails: string | undefined = $state()

const outcomes = $derived([
  generateComparisonMatrix(comparison, { capitalGainsRate, taxRate }),
  generateComparisonMatrix(comparison),
])

function fundImport (): void {
  try {
    comparison = loadComparison(importExportText)
    selectedPeriod = undefined
  } catch (e) {
    alert(e)
  }
}

function fundExport (): void {
  importExportText = JSON.stringify(comparison)
}

function formatPercentChange (multiplier: number): string {
  return (multiplier - 1).toLocaleString(undefined, {
    style: 'percent',
    minimumFractionDigits: 3,
    signDisplay: 'always',
  })
}

function formatMultiplier (multiplier: number): string {
  return multiplier.toLocaleString(undefined, {
    minimumFractionDigits: 5,
  })
}

function formatShares (shares: number): string {
  return shares.toPrecision(9)
}

function formatDollars (dollars: number): string {
  return dollars.toFixed(2)
}

function formatDollarsUnrounded (dollars: number): string {
  return dollars.toLocaleString(undefined, { minimumFractionDigits: 3 })
}

function formatDollarsDiff (dollars: number): string {
  return dollars.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 100,
    trailingZeroDisplay: 'stripIfInteger',
    signDisplay: 'always',
  })
}
</script>

<div class="alert alert-warning alert-dismissible" role="alert">
  This page does not automatically save changes yet! You must export your data with the second tab.
  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
</div>

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
    {#snippet fundEditor(i: number)}
      {@const fund = comparison[i]}
      <div class="col-md-6">
        <div class="input-group mb-3">
          <span class="input-group-text">Fund</span>
          <input type="text" class="form-control" placeholder="Fund Name" bind:value={fund.name}>
          <button class="btn btn-outline-primary" onclick={() => comparison = [comparison[1], comparison[0]]}>Swap</button>
        </div>
        {#each fund.taxYears as year, yearIndex}
          {@const { startPrice, dividends, dividendSplit } = year}
          <div class="card mb-3">
            <div class="card-header">
              <div class="input-group">
                <input type="number" class="form-control" bind:value={year.year}>
                <button class="btn btn-outline-danger" onclick={() => fund.taxYears.splice(yearIndex, 1)}>-</button>
                <button class="btn btn-outline-primary"
                  class:disabled={!yearIndex}
                  onclick={() => [fund.taxYears[yearIndex - 1], fund.taxYears[yearIndex]] = [fund.taxYears[yearIndex], fund.taxYears[yearIndex - 1]]}
                  >⬆️</button>
                <button class="btn btn-outline-primary"
                  class:disabled={yearIndex + 1 >= fund.taxYears.length}
                  onclick={() => [fund.taxYears[yearIndex], fund.taxYears[yearIndex + 1]] = [fund.taxYears[yearIndex + 1], fund.taxYears[yearIndex]]}
                  >⬇️</button>
                <button class="btn btn-outline-secondary"
                  onclick={() => year.expanded = !year.expanded}
                  >{year.expanded ? '🔼' : '🔽'}</button>
              </div>
            </div>
            <div class="card-body" class:d-none={!year.expanded}>
              <div class="input-group mb-3">
                <span class="input-group-text">
                  Initial Investment
                </span>
                <span class="input-group-text">
                  {padYear(year.year)}-01-
                </span>
                <input type="number" class="form-control" min="1" max="31" bind:value={startPrice[0]}>
                <span class="input-group-text">$</span>
                <input type="number" class="form-control text-end w-auto" step={STEP_CENT} bind:value={startPrice[1]}>
              </div>
              {#each dividends as dividend, dividendIndex}
                <div class="card my-3">
                  <div class="card-header">
                    <div class="input-group mb-2">
                      <span class="input-group-text">Amount</span>
                      <span class="input-group-text">$</span>
                      <input type="number" class="form-control text-end" step={STEP_DIST} placeholder="&mdash;" bind:value={dividend[4]}>
                      <button class="btn btn-outline-danger" onclick={() => dividends.splice(dividendIndex, 1)}>-</button>
                      <button class="btn btn-outline-primary"
                        class:disabled={!dividendIndex}
                        onclick={() => [dividends[dividendIndex - 1], dividends[dividendIndex]] = [dividends[dividendIndex], dividends[dividendIndex - 1]]}
                        >⬆️</button>
                      <button class="btn btn-outline-primary"
                        class:disabled={dividendIndex + 1 >= dividends.length}
                        onclick={() => [dividends[dividendIndex], dividends[dividendIndex + 1]] = [dividends[dividendIndex + 1], dividends[dividendIndex]]}
                        >⬇️</button>
                      <button class="btn btn-outline-secondary"
                        onclick={() => dividend[6] = !dividend[6]}
                        >{dividend[6] ? '🔼' : '🔽'}</button>
                    </div>
                  </div>
                  <div class="card-body" class:d-none={!dividend[6]}>
                    <div class="input-group mb-2">
                      <span class="input-group-text">Ex Date</span>
                      <input type="date" class="form-control text-end" bind:value={dividend[0]}>
                    </div>
                    <div class="input-group mb-2">
                      <span class="input-group-text">Record Date</span>
                      <input type="date" class="form-control text-end" bind:value={dividend[1]}>
                    </div>
                    <div class="input-group mb-2">
                      <span class="input-group-text">Payment Date</span>
                      <input type="date" class="form-control text-end" bind:value={dividend[2]}>
                    </div>
                    <div class="input-group mb-2">
                      <span class="input-group-text">Reinvestment Price</span>
                      <span class="input-group-text">$</span>
                      <input type="number" class="form-control text-end" step={STEP_CENT} bind:value={dividend[3]}>
                    </div>
                    <div class="input-group mb-2">
                      <span class="input-group-text">Phantom</span>
                      <span class="input-group-text">$</span>
                      <input type="number" class="form-control text-end" step={STEP_DIST} placeholder="&mdash;" bind:value={dividend[5]}>
                    </div>
                  </div>
                </div>
              {/each}

              <div class="btn-group d-flex mb-2">
                <button class="btn btn-outline-success w-100" onclick={() => {
                  const date = padYear(year.year) + '-01-01'
                  const price = dividends[dividends.length - 1]?.[3] ?? year.startPrice[1]
                  dividends.push([date, date, date, price])
                }}>Add Dividend</button>

                <button class="btn btn-outline-secondary"
                  onclick={() => dividends.forEach((dividend) => dividend[6] = false)}
                  >🔼All</button>
                <button class="btn btn-outline-secondary"
                  onclick={() => dividends.forEach((dividend) => dividend[6] = true)}
                  >🔽All</button>
              </div>

              {#if dividendSplit}
                <div class="input-group my-2">
                  <span class="input-group-text">Total</span>
                  <span class="input-group-text">$</span>
                  <input type="number" class="form-control text-end" min="0" step={STEP_DIST} bind:value={dividendSplit.total}>
                  <button class="btn btn-outline-danger" onclick={() => year.dividendSplit = undefined}>-</button>
                </div>
                {@const MUL_TO_INT = 100 / STEP_DIST}
                {@const MUL_UNDO = STEP_DIST / 100}
                {@const sumAbove = sum(dividends.map((d) => ((d[4] ?? 0) + (d[5] ?? 0)) * MUL_TO_INT)) * MUL_UNDO}
                {@const sumBelow = MUL_UNDO * (
                  + (dividendSplit?.returnOfCapital ?? 0) * MUL_TO_INT
                  + (dividendSplit?.capitalGains ?? 0) * MUL_TO_INT
                  + (dividendSplit?.otherIncome ?? 0) * MUL_TO_INT
                  + (dividendSplit?.foreignIncome ?? 0) * MUL_TO_INT
                  + (dividendSplit?.foreignTax ?? 0) * MUL_TO_INT
                )}
                {@const diffAbove = (sumAbove * MUL_TO_INT - dividendSplit.total * MUL_TO_INT) * MUL_UNDO}
                {@const diffBelow = (sumBelow * MUL_TO_INT - dividendSplit.total * MUL_TO_INT) * MUL_UNDO}
                <div class="my-2">Sum above: ${sumAbove} <span class="badge text-bg-{diffAbove ? 'danger' : 'secondary'}">{formatDollarsDiff(diffAbove)}</span></div>
                <div class="my-2">Sum below: ${sumBelow} <span class="badge text-bg-{diffBelow ? 'danger' : 'secondary'}">{formatDollarsDiff(diffBelow)}</span></div>
                <div class="input-group my-2">
                  <span class="input-group-text">Return of Capital</span>
                  <span class="input-group-text">$</span>
                  <input type="number" class="form-control text-end" placeholder="&mdash;" min="0" step={STEP_DIST} bind:value={dividendSplit.returnOfCapital}>
                </div>
                <div class="input-group my-2">
                  <span class="input-group-text">Capital Gains</span>
                  <span class="input-group-text">$</span>
                  <input type="number" class="form-control text-end" placeholder="&mdash;" min="0" step={STEP_DIST} bind:value={dividendSplit.capitalGains}>
                </div>
                <div class="input-group my-2">
                  <span class="input-group-text">Other Income</span>
                  <span class="input-group-text">$</span>
                  <input type="number" class="form-control text-end" placeholder="&mdash;" min="0" step={STEP_DIST} bind:value={dividendSplit.otherIncome}>
                </div>
                <div class="input-group my-2">
                  <span class="input-group-text">Foreign Income</span>
                  <span class="input-group-text">$</span>
                  <input type="number" class="form-control text-end" placeholder="&mdash;" min="0" step={STEP_DIST} bind:value={dividendSplit.foreignIncome}>
                </div>
                <div class="input-group my-2">
                  <span class="input-group-text">Foreign Tax Paid (enter as negative)</span>
                  <span class="input-group-text">$</span>
                  <input type="number" class="form-control text-end" placeholder="&mdash;" max="0" step={STEP_DIST} bind:value={dividendSplit.foreignTax}>
                </div>
              {:else}
                <button class="btn btn-outline-success mb-2 w-100" onclick={() => year.dividendSplit = { total: 0 }}>Add Dividend Split</button>
              {/if}
            </div>
          </div>
        {/each}
        <div class="btn-group d-flex mb-3">
          <button class="btn btn-outline-success w-100" onclick={() => {
            const lastYear = fund.taxYears.length ? fund.taxYears[fund.taxYears.length - 1] : undefined
            const lastDividend = lastYear?.dividends[lastYear.dividends.length - 1]
            const price = lastDividend?.[3] ?? lastYear?.startPrice[1] ?? 1
            fund.taxYears.push({
              year: (lastYear?.year ?? 1336) + 1,
              startPrice: [1, price],
              dividends: [],
              expanded: true,
            })
          }}>Add Tax Year</button>

          <button class="btn btn-outline-primary" onclick={() => fund.taxYears.sort((a, b) => a.year - b.year)}>Sort</button>
          <button class="btn btn-outline-secondary"
            onclick={() => fund.taxYears.forEach((year) => year.expanded = false)}
            >🔼All</button>
          <button class="btn btn-outline-secondary"
            onclick={() => fund.taxYears.forEach((year) => year.expanded = true)}
            >🔽All</button>
        </div>
      </div>
    {/snippet}
    <div class="row">
      {@render fundEditor(0)}
      {@render fundEditor(1)}
    </div>
  </div>
  <div class="tab-pane" id="import-export" role="tabpanel" aria-labelledby="import-export-tab">
    <div class="input-group mb-3">
      <button class="btn btn-outline-primary" onclick={fundImport}>Import JSON</button>
      <button class="btn btn-outline-danger" onclick={fundExport}>Export JSON</button>
      <span class="input-group-text">Examples</span>
      {#snippet fundOptions()}
        {#each EXAMPLES as [label, ...funds]}
          <optgroup {label}>
            {#each funds as value}
              <option {value}>{value.name}</option>
            {/each}
          </optgroup>
        {/each}
      {/snippet}
      <select class="form-select" bind:value={selectedFund0}>
        {@render fundOptions()}
      </select>
      <select class="form-select" bind:value={selectedFund1}>
        {@render fundOptions()}
      </select>
      <button class="btn btn-outline-secondary" onclick={() => (comparison = loadExample(selectedFund0, selectedFund1), selectedPeriod = undefined, fundExport())}>Load and Import</button>
    </div>
    <textarea class="form-control" bind:value={importExportText}></textarea>
  </div>
  <div class="tab-pane" id="results" role="tabpanel" aria-labelledby="results-tab">
    <h2>Settings</h2>
    <p>Tax Rate / %
      <button class="btn btn-sm btn-outline-secondary" onclick={() => taxRatePercent.value = 0}>0</button>
      <button class="btn btn-sm btn-outline-success" onclick={() => taxRatePercent.value = 25}>25</button>
      <button class="btn btn-sm btn-outline-primary" onclick={() => taxRatePercent.value = 30}>30</button>
      <button class="btn btn-sm btn-outline-danger" onclick={() => taxRatePercent.value = 50}>50</button>
      <button class="btn btn-sm btn-outline-warning" onclick={() => taxRatePercent.value = 100}>100</button>
    </p>
    <input type="number" class="form-control" min=0 bind:value={taxRatePercent.value}>
    <input type="range" class="form-range" min=0 max=100 bind:value={taxRatePercent.value}>
    <p>Capital Gains Inclusion Rate / %
      <button class="btn btn-sm btn-outline-primary" onclick={() => capitalGainsRatePercent.value = 50}>50</button>
      <button class="btn btn-sm btn-outline-danger" onclick={() => capitalGainsRatePercent.value = 100}>100</button>
    </p>
    <input type="number" class="form-control" min=0 bind:value={capitalGainsRatePercent.value}>
    <input type="range" class="form-range" min=0 max=100 bind:value={capitalGainsRatePercent.value}>
    <p>Initial Investment / $
      <button class="btn btn-sm btn-outline-primary" onclick={() => initialInvestment.value = 1e4}>10K</button>
    </p>
    <input type="number" class="form-control" bind:value={initialInvestment.value}>
    <div class="my-2">
      <b class="me-3">Show in cell</b>
      <label class="form-check form-check-inline">
        <input type="radio" class="form-check-input" bind:group={showResultType.value} value={1}>
        <span class="form-check-label">Difference</span>
      </label>
      <label class="form-check form-check-inline">
        <input type="radio" class="form-check-input" bind:group={showResultType.value} value={2}>
        <span class="form-check-label">Returns</span>
      </label>
      <label class="form-check form-check-inline">
        <input type="radio" class="form-check-input" bind:group={showResultType.value} value={3}>
        <span class="form-check-label">Both</span>
      </label>
    </div>
    <div class="my-2">
      <b class="me-3">Show difference as</b>
      <label class="form-check form-check-inline">
        <input type="radio" class="form-check-input" bind:group={showDiffAsMultiplier.value} value={false}>
        <span class="form-check-label">% Difference</span>
      </label>
      <label class="form-check form-check-inline">
        <input type="radio" class="form-check-input" bind:group={showDiffAsMultiplier.value} value={true}>
        <span class="form-check-label">Multiplier</span>
      </label>
    </div>
    <div class="my-2">
      <b class="me-3">Show returns as</b>
      <label class="form-check form-check-inline">
        <input type="radio" class="form-check-input" bind:group={showGainAsMultiplier.value} value={false}>
        <span class="form-check-label">% Difference</span>
      </label>
      <label class="form-check form-check-inline">
        <input type="radio" class="form-check-input" bind:group={showGainAsMultiplier.value} value={true}>
        <span class="form-check-label">Multiplier</span>
      </label>
    </div>
    <div class="my-2">
      <b class="me-3">Show start year and end year as</b>
      <label class="form-check form-check-inline">
        <input type="radio" class="form-check-input" bind:group={showStartAsRow.value} value={false}>
        <span class="form-check-label">Columns and Rows</span>
      </label>
      <label class="form-check form-check-inline">
        <input type="radio" class="form-check-input" bind:group={showStartAsRow.value} value={true}>
        <span class="form-check-label">Rows and Columns</span>
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
              <th colspan={tableSize}>{showStartAsRow.value ? 'End' : 'Start'} Year</th>
            </tr>
            <tr style="position: sticky; top: 0; z-index: 1">
              {#each outcome as [year]}
                <th>{year}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each outcome as [year], i}
              <tr>
                {#if !i}
                  <th rowspan={tableSize}><div style="writing-mode: vertical-lr; transform: rotate(180deg)">{showStartAsRow.value ? 'Start' : 'End'} Year</div></th>
                {/if}
                <th style="position: sticky; left: 0">{year}</th>
                {#if i && showStartAsRow.value}
                  <td colspan={i} class="table-secondary"></td>
                {/if}
                {#each { length: showStartAsRow.value ? outcome.length - i : i + 1 }, j}
                  {@const periodStart = showStartAsRow.value ? i : j}
                  {@const periodOffset = showStartAsRow.value ? j : i - j}
                  {@const row = outcome[periodStart][1]}
                  {@const colA = row[0]?.cols[periodOffset]}
                  {@const colB = row[1]?.cols[periodOffset]}
                  {@const formatDiff = showDiffAsMultiplier.value ? formatMultiplier : formatPercentChange}
                  {@const formatGain = showGainAsMultiplier.value ? formatMultiplier : formatPercentChange}
                  {@const resultA = colA ? formatGain(colA.value) : 'N/A'}
                  {@const resultB = colB ? formatGain(colB.value) : 'N/A'}
                  {@const resultDiff = colA && colB ? formatDiff(colA.value / colB.value) : '?'}
                  <td
                    class="ra"
                    class:table-warning={selectedPeriod?.[1] == outcomeIndex && selectedPeriod[2] == periodStart && selectedPeriod[3] == periodOffset}
                    role="button" onclick={() => selectedPeriod = [name, outcomeIndex, periodStart, periodOffset]}>
                    {#if showResultType.value & 1}<span class="{colA && colB && colA.value != colB.value ? colA.value > colB.value ? 'text-success' : 'text-danger' : ''}">{resultDiff}</span>{/if}
                    {#if showResultType.value == 3}<br>{/if}
                    {#if showResultType.value & 2}{resultA}<br>{resultB}{/if}
                  </td>
                {/each}
                {#if !showStartAsRow.value && i < outcome.length - 1}
                  <td colspan={outcome.length - 1 - i} class="table-secondary"></td>
                {/if}
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
                  <th>ACB</th>
                  <th>ACB/share</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {#each row.lines.slice(0, cell.lineCount).concat(...cell.lineAdditional ?? []) as line}
                  {@const title = line.breakdown
                    ?.map((b) => {
                      if (b) {
                        const [amount, title] = b
                        return `${formatDollarsUnrounded(amount * initialInvestment.value)} ${title}`
                      }
                      return ''
                    })
                    ?.join('\n')}
                  <tr {title}>
                    <td>{line.date}</td>
                    <td class="ra">{formatDollars(line.price)}</td>
                    <td class="ra">{formatShares(line.shares * initialInvestment.value)}</td>
                    <td class="ra">{formatDollarsUnrounded(line.shares * line.price * initialInvestment.value)}</td>
                    <td class="ra" title="Book value: {formatDollarsUnrounded(line.bookValue * initialInvestment.value)}">{formatDollarsUnrounded(line.acb * initialInvestment.value)}</td>
                    <td class="ra" title="Book value per share: {formatDollarsUnrounded(line.bookValue / line.shares)}">{formatDollarsUnrounded(line.acb / line.shares)}</td>
                    <td>{line.description}
                      {#if line.breakdown}
                        <button class="btn btn-sm btn-outline-secondary"
                          data-bs-toggle="modal" data-bs-target="#detailsModal"
                          onclick={() => modalDetails = title}>Details</button>
                      {/if}
                    </td>
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

<div class="modal fade" id="detailsModal" tabindex="-1" role="dialog" aria-labelledby="detailsModalTitle" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="detailsModalTitle">Details</h5>
        <button class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <div class="d-flex">
          <pre>{modalDetails}</pre>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-danger" data-bs-dismiss="modal">Close</button>
      </div>
    </div>
  </div>
</div>

<style>
.ra {
  font-family: monospace;
  text-align: end;
}
</style>
