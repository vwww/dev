<script lang="ts">
import { pStore } from '@/util/svelte'

const nRaw = pStore('tool/match_win/n', 10)
const pRaw = pStore('tool/match_win/p', 0.5)
const leadRequiredRaw = pStore('tool/match_win/l', 1)
const otRaw = pStore('tool/match_win/ot', 1)
const drawValueRaw = pStore('tool/match_win/drawValue', 0.5)

$: n = Math.max($nRaw | 0, 1)
$: p = Math.min(Math.max($pRaw, 0), 1)
$: draw = Math.min(Math.max($drawValueRaw, 0), 1)
$: leadRequired = Math.min(Math.max($leadRequiredRaw | 0, 1), n)
$: ot = leadRequired > 1 ? Math.max($otRaw | 0, 0) : 0
$: maxRound = n + ot
$: tableSize = maxRound + 1

$: memo = (() => {
    const r = Array(tableSize).fill(undefined).map(() => Array(tableSize).fill(undefined))
    const maxNoLead = maxRound - leadRequired
    for (let i = 0; i <= maxNoLead; i++) {
        const m = Math.max(n, i + leadRequired)
        r[i][m] = 1
        r[m][i] = 0
    }
    for (let i = 1; i < leadRequired; i++) {
        r[maxNoLead + i][maxNoLead + 1] = draw
        r[maxNoLead + 1][maxNoLead + i] = draw
    }
    for (let i = maxRound - 1; i >= 0; i--) {
        const a = i < n ? 0 : i - leadRequired + 1
        const b = i <= maxNoLead ? Math.max(n, i + leadRequired) - 1 : maxNoLead
        for (let j = b; j >= a; j--) {
            r[i][j] = p * r[i][j + 1] + (1 - p) * r[i + 1][j]
        }
    }
    return r
})()
</script>

<p>Minimum score to win</p>
<input type="number" class="form-control" min=1 bind:value={$nRaw}>
<input type="range" class="form-range" min=1 max=32 bind:value={$nRaw}>

<p>Lead required to win</p>
<input type="number" class="form-control" min=1 max={$nRaw} bind:value={$leadRequiredRaw}>
<input type="range" class="form-range" min=1 max={$nRaw} bind:value={$leadRequiredRaw}>

{#if leadRequired > 1}
    <p>Overtime threshold</p>
    <input type="number" class="form-control" min=0 bind:value={$otRaw}>
    <input type="range" class="form-range" min=0 max=16 bind:value={$otRaw}>

    <p>Draw value
        <button class="btn btn-outline-danger" on:click={() => $drawValueRaw = 0}>0</button>
        <button class="btn btn-outline-primary" on:click={() => $drawValueRaw = 0.5}>0.5</button>
        <button class="btn btn-outline-info" on:click={() => $drawValueRaw = 1}>1</button>
    </p>
    <input type="number" class="form-control" min=0 max=1 step=0.01 bind:value={$drawValueRaw}>
    <input type="range" class="form-range" min=0 max=1 step=0.001 bind:value={$drawValueRaw}>
{/if}

<p>Probability of winning a round
    <button class="btn btn-outline-primary" on:click={() => $pRaw = 0.5}>0.5</button>
    <button class="btn btn-outline-success" on:click={() => $pRaw = 1 - p}>Invert</button>
</p>
<input type="number" class="form-control" min=0 max=1 step=0.01 bind:value={$pRaw}>
<input type="range" class="form-range" min=0 max=1 step=0.001 bind:value={$pRaw}>

<table class="table table-bordered table-hover caption-top w-auto">
    <caption>{
        draw == 0
            ? 'Probability of winning'
            : draw == 1
                ? 'Probability of winning or drawing'
                : 'Expected value of'}
        first-to-{n}/best-of-{2*n-1}{#if leadRequired > 1}, {leadRequired} point lead, max {n + $otRaw} score{/if}
    </caption>
    <thead>
        <tr>
            <th rowspan=2 colspan=2></th>
            <th colspan={tableSize}>Player score</th>
        </tr>
        <tr style="position: sticky; top: 0; z-index: 1">
            {#each memo as _, i}
                <th>{i}</th>
            {/each}
        </tr>
    </thead>
    <tbody>
        {#each memo as row, i}
            <tr>
                {#if !i}
                    <th rowspan={tableSize}><div style="writing-mode: vertical-lr; text-align: end; transform: rotate(180deg)">Opponent score</div></th>
                {/if}
                <th style="position: sticky; left: 0">{i}</th>
                {#each row as v}
                    {#if v == undefined}
                        <td></td>
                    {:else}
                        {@const balanced = v * (1-v) * 2}
                        <td
                            title={`${v}\n${v / (1-v)}:1\n1:${1/v - 1}`}
                            style="background-color: hsl({v * v * 180} {40 + balanced * 60} {80 + balanced * 20})">
                            {v.toFixed(5)}
                        </td>
                    {/if}
                {/each}
            </tr>
        {/each}
    </tbody>
</table>
