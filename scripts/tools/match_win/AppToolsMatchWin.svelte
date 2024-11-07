<script lang="ts">
import { pStore } from '@/util/svelte'

const n = pStore('tool/match_win/n', 10)
const p = pStore('tool/match_win/p', 0.5)

$: memo = ((n, p) => {
    const r = Array(n).fill(undefined).map(() => Array(n).fill(undefined))
    for (let i = n-1; i >= 0; i--) {
        for (let j = n-1; j >= 0; j--) {
            const i1 = i + 1
            const j1 = j + 1
            r[i][j] = p * (j1 == n ? 1 : r[i][j1]) + (i1 == n ? 0 : (1 - p) * r[i1][j])
        }
    }
    return r
})($n, $p)
</script>

<p>N (number of rounds to win)</p>
<input type="number" class="form-control" min=1 bind:value={$n}>
<input type="range" class="form-range" min=1 max=32 bind:value={$n}>

<p>P (probability of winning a round)</p>
<input type="number" class="form-control" min=0 max=1 step=0.01 bind:value={$p}>
<input type="range" class="form-range" min=0 max=1 step=0.001 bind:value={$p} on:dblclick={() => $p = 0.5}>

<table class="table table-striped table-bordered table-hover caption-top w-auto">
    <caption>Probability of winning first-to-{$n}/best-of-{2*$n-1}</caption>
    <thead>
        <tr>
            <th rowspan=2 colspan=2></th>
            <th colspan={$n}>Player score</th>
        </tr>
        <tr>
            {#each memo as _, i}
                <th>{i}</th>
            {/each}
        </tr>
    </thead>
    <tbody>
        {#each memo as row, i}
            <tr>
                {#if !i}
                    <th rowspan={$n}><div style="writing-mode: vertical-lr; text-align: end; transform: rotate(180deg)">Opponent score</div></th>
                {/if}
                <th>{i}</th>
                {#each row as v}
                    {@const balanced = v * (1-v) * 2}
                    <td
                        title={`${v}\n${v / (1-v)}:1\n1:${1/v - 1}`}
                        style="background-color: hsl({v * v * 180} {40 + balanced * 60} {80 + balanced * 20})">
                        {v.toFixed(5)}
                    </td>
                {/each}
            </tr>
        {/each}
    </tbody>
</table>
