<script lang="ts">
import jQuery from 'jquery'

const LINES = [
  ['preferred', 'https://d.victorz.ca/ip.json?callback=?'],
  ['IPv4-only', 'https://d4.victorz.ca/ip.json?callback=?'],
  ['IPv6-only', 'https://d6.victorz.ca/ip.json?callback=?']
]

type IPInfo = {
  ip: string
  port: number
  proxy: IPTransform[]
  delay: number
}

type IPTransform = {
  name: string
  rule: string
  Why: string
  old: string
  new: string
}

async function getResult (url: string) {
  const startTime = Date.now()
  const result: IPInfo = await jQuery.getJSON(url)
  result.delay = Date.now() - startTime
  console.log(result)
  return result
}
</script>

{#each LINES as [name, url]}
  <p>
    IP ({name}):
    {#await getResult(url)}
      <span class="badge text-bg-secondary">fetching</span>
    {:then data}
      <span class="badge text-bg-success">{data.delay} ms</span>
      {data.ip}
      {#if data.proxy.length}
        <span title={data.proxy.map((p) => `${p.name}: ${p.old} -> ${p.new}\n${p.rule}\n${p.Why}`).join('\n\n')}>[proxy count = {data.proxy.length}]</span>
      {/if}
    {:catch error}
      <span class="badge text-bg-danger">failed</span>
      {error.stack ?? error}
    {/await}
  </p>
{/each}
