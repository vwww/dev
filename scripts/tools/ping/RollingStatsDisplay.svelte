<script lang="ts">
import RollingStats from '@/util/RollingStats'

export let stats: RollingStats
</script>

<p>Last: {stats.getLast()}</p>
<p>Average: {stats.getMean()}</p>
<p>Min: {stats.getMin()}</p>
<p>Max: {stats.getMax()}</p>
<p>PopStdDev: {Math.sqrt(stats.getVariance())}</p>
<p>SampleStdDev: {Math.sqrt(stats.getSampleVariance())}</p>
<p>Count: {stats.getCount()}</p>
