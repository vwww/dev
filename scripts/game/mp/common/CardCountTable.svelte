<script>
export let ranks
export let counts
</script>

<div class="table-responsive">
  <table class="table table-sm">
    <thead>
      <tr>
        <th></th>
        {#each ranks as rank}
          <th scope="col">{rank}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each counts as count}
        <tr>
          <th scope="row">{count[0]}</th>
          {#each count[1] as c}
            <td>{c}</td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
