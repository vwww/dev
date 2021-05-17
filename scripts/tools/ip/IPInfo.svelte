<script>
export let name
export let status = 0 // 0: fetching, 1: success, 2: failed
export let data

/*
export let data: IPInfo

type IPInfo = {
  ip: string
  port: number
  proxy: IPTransform[]
}

type IPTransform = {
  name: string
  rule: string
  Why: string
  old: string
  new: string
}
*/
</script>

<p>
  IP ({name}): <span class="badge bg-{
    status === 1 ? 'success'
      : status === 2 ? 'danger'
        : 'secondary'
  }">{
    !status ? 'fetching'
      : status === 1 ? `${data.delay} ms`
        : status === 2 ? 'failed'
          : 'unknown'
  }</span>
  {#if status === 1}
    {data.ip}
    {#if data.proxy.length}
      <span title={data.proxy.map((p) => `${p.name}: ${p.old} -> ${p.new}\n${p.rule}\n${p.Why}`).join('\n\n')}>[proxy count = {data.proxy.length}]</span>
    {/if}
  {:else if status === 2}
    {data}
  {/if}
</p>
