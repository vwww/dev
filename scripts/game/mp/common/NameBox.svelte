<script>
export let value
export let placeholder = 'unnamed'
export let maxlength = 20
</script>

<div class="input-group mb-3">
  <div class="input-group-prepend">
    <span class="input-group-text">Name</span>
  </div>
  <input bind:value type="text" class="form-control" {placeholder} {maxlength}>
</div>
