<script>
export let value
export let placeholder = 'unnamed'
export let maxlength = 20
</script>

<div class="input-group mb-3">
  <span class="input-group-text">Name</span>
  <input bind:value type="text" class="form-control" {placeholder} {maxlength}>
</div>
