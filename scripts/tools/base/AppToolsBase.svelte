<script>
let inNumber = 'v1337'
let inBase = 36
let outNumber = 32
$: outValue = parseInt(inNumber, inBase).toString(outNumber)
</script>

<div class="row">
  <div class="col-md-6">
    <div class="input-group">
      <div class="input-group-prepend">
        <span class="input-group-text">Input: </span>
      </div>
      <input type="text" class="form-control" bind:value={inNumber}>
      <div class="input-group-prepend input-group-append">
        <span class="input-group-text">(base</span>
      </div>
      <input type="number" class="form-control" bind:value={inBase} min="2" max="36" style="max-width: 4em">
      <div class="input-group-append">
        <span class="input-group-text">)</span>
      </div>
    </div>
  </div>
  <div class="col-md-6">
    <div class="input-group">
        <div class="input-group-prepend">
          <span class="input-group-text">Output: </span>
        </div>
      <input type="text" class="form-control" readonly value={outValue}>
      <div class="input-group-prepend input-group-append">
        <span class="input-group-text">(base</span>
      </div>
      <input type="number" class="form-control" bind:value={outNumber} min="2" max="36" style="max-width: 4em">
      <div class="input-group-append">
        <span class="input-group-text">)</span>
      </div>
    </div>
  </div>
</div>
