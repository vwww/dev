<script lang="ts">
export let moment: number
export let momentMax: number

$: width = Math.max(moment, 0) / momentMax * 100
$: className = width <= 20 ? 'bg-success'
  : width <= 40 ? 'bg-info'
  : width <= 60 ? ''
  : width <= 80 ? 'bg-warning'
  : 'bg-danger'
</script>

<div class="progress-bar progress-bar-striped progress-bar-animated {className}"
  role="progressbar"
  aria-valuenow={moment}
  aria-valuemin={0}
  aria-valuemax={momentMax}
  style="width: {width}%" />
