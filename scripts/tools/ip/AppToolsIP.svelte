<script>
import IPInfo from './IPInfo'

const LINES = [
  ['preferred', 'https://d.victorz.ca/ip.json?callback=?'],
  ['IPv4-only', 'https://d4.victorz.ca/ip.json?callback=?'],
  ['IPv6-only', 'https://d6.victorz.ca/ip.json?callback=?']
]

async function getResult (url) {
  const startTime = Date.now()
  const result = await jQuery.getJSON(url)
  result.delay = Date.now() - startTime
  console.log(result)
  return result
}
</script>

{#each LINES as LINE}
  {#await getResult(LINE[1])}
    <IPInfo name={LINE[0]} status={0} />
  {:then data}
    <IPInfo name={LINE[0]} status={1} {data} />
  {:catch error}
    <IPInfo name={LINE[0]} status={2} data={error.stack?.() ?? error} />
  {/await}
{/each}
