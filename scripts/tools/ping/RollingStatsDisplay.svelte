<script lang="ts">
import type RollingStats from '@/util/RollingStats'

export let stats: [name: string, stats: RollingStats][]

type Metric = [name: string, formatter: (s: RollingStats) => number | string]
const metric: Metric[] = [
  ['Last', stats => stats.getLast()],
  ['Average', stats => stats.getMean()],
  ['Min', stats => stats.getMin()],
  ['Max', stats => stats.getMax()],
  ['PopStdDev', stats => Math.sqrt(stats.getVariance())],
  ['SampleStdDev', stats => Math.sqrt(stats.getSampleVariance())],
  ['Count', stats => stats.getCount()],
]
</script>

<table class="table table-striped table-bordered table-hover w-auto">
  <thead>
    <tr>
      <th>Value</th>
      {#each stats as s}
        <th scope="col">{s[0]}</th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each metric as m}
      <tr>
        <th scope="row">{m[0]}</th>
        {#each stats as s}
          <td class="text-end">{m[1](s[1])}</td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>
