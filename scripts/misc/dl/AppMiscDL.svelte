<script lang="ts">
import { parseManifest, type NodeBrowse, type NodeDirectory } from './node'

const DOWNLOAD_PREFIX = 'https://v-dl.pages.dev/'
const MANIFEST_URL = DOWNLOAD_PREFIX + 'manifest.json'

// File browser
let fileRoot: NodeDirectory | undefined = $state()
let curPath: NodeDirectory[] = $state([])
const curNode = $derived(curPath[curPath.length - 1])

function up (count: number): void {
  count = Math.min(count, curPath.length - 1)
  if (!count) return

  curPath = curPath.slice(0, -count)

  updateLocationHash()
}

function enterChild (node: NodeDirectory): void {
  curPath = [...curPath, node]

  updateLocationHash()
}

function getPathString (path: NodeDirectory[]): string {
  return path.slice(1).map(node => node.name).join('/')
}

function getChildPath (path: NodeDirectory[], child: NodeBrowse): string {
  return `${getPathString(path)}/${child.name}`
}

function formatSize (s: number, noreduce = false): string {
  if (s < 0) return s + ''

  const p = ['', 'Ki', 'Mi'] // prefixes
  const m = noreduce ? 0 : p.length - 1 // maximum...
  let i = 0
  while (i < m && s >= 1000) {
    s /= 1024
    i++
  }
  return Math.round(s * 100) / 100 + ' ' + p[i] + 'B'
}

function formatDateTime (unixTimestamp: number): string {
  return unixTimestamp ? new Date(unixTimestamp).toISOString() : '-'
}

function ext (filename: string): string {
  const i = filename.lastIndexOf('.') + 1
  return i ? filename.slice(i) : ''
}

function getDownloadPath (path: NodeDirectory[], node: NodeBrowse): string {
  return DOWNLOAD_PREFIX + getChildPath(path, node)
}

// Sorting
let curSort = $state('name')
let curSortReverse = $state(false)

function setSort (s: string): void {
  if (curSort === s) {
    curSortReverse = !curSortReverse
    return
  }
  curSort = s
  curSortReverse = false
}

function cmp (a: number, b: number): number {
  return a < b ? -1 : a > b ? 1 : 0
}

function cmpProp(a: any, b: any, prop: string, reverse = false): number {
  return cmp(a[prop], b[prop]) * (reverse ? -1 : 1)
}

// Load from hash
function updateLocationHash (replaceHash = false) {
  const newHash = getPathString(curPath)
  if (location.hash !== newHash) {
    const url = `${location.pathname}${newHash ? '#' : ''}${newHash}`
    history[replaceHash ? 'replaceState' : 'pushState'](null, '', url)
  }
  document.title = "Victor's Downloads" + (newHash ? '/' + newHash : '')
}

function browseToPath (path: string, replaceHash = false) {
  if (!fileRoot) return

  const newPath = [fileRoot]
  let node = fileRoot
  for (const segment of path.split('/')) {
    const nextChild = node.children.find(c => c.name === segment)
    if (!nextChild || nextChild.type !== 'd') break
    newPath.push(node = nextChild)
  }

  curPath = newPath
  updateLocationHash(replaceHash)
}

function browseLocationHash () {
  browseToPath(location.hash.slice(1), true)
}

async function init () {
  try {
    const req = await fetch(MANIFEST_URL)
    const manifest = await req.json()
    fileRoot = parseManifest(manifest)

    browseLocationHash()
  } catch (e) {
    console.error(e)
  }
}

void init()
</script>

<svelte:window onhashchange={browseLocationHash} />

<nav aria-label="breadcrumb">
  <ol class="breadcrumb breadcrumb-dl">
    {#each curPath as item, index}
      {#if index + 1 === curPath.length}
        <li class="breadcrumb-item active" aria-current="page">{item.name} ({formatSize(item.size)})</li>
      {:else}
        <li class="breadcrumb-item"><a href="#{getPathString(curPath.slice(0, index + 1))}" onclick={(event) => (event.preventDefault(), up((curPath.length - 1) - index))}>{item.name}</a></li>
      {/if}
    {/each}
  </ol>
</nav>

<table class="table table-striped table-bordered table-hover">
  <thead>
    <tr>
      {#snippet fileHeader (id: string, name: string)}
        <th onclick={() => setSort(id)} class="sort-{curSort === id ? curSortReverse ? 'd' : 'a' : 'n'}">{name}</th>
      {/snippet}
      {@render fileHeader('name', 'Name')}
      {@render fileHeader('size', 'Size')}
      {@render fileHeader('remark', 'Remarks')}
      {@render fileHeader('mtime', 'Modified Time')}
    </tr>
  </thead>
  <tbody>
    {#if fileRoot}
      {#if curPath.length > 2}
        <tr class="table-success" role="button" onclick={() => up(curPath.length - 1)}>
          <!-- svelte-ignore a11y_invalid_attribute We actually want this to unset the hash -->
          <td><a onclick={(event) => event.preventDefault()} href="" class="file-root">. (root)</a></td>
          <td title={formatSize(fileRoot.size, true)}>{formatSize(fileRoot.size)}</td>
          <td>Go to the top!</td>
          <td>{formatDateTime(fileRoot.mtime)}</td>
        </tr>
      {/if}
      {#if curPath.length > 1}
        {@const curParent = curPath[curPath.length - 2]}
        <tr class="table-warning" role="button" onclick={() => up(1)}>
          <td><a onclick={(event) => event.preventDefault()} href="#{getPathString(curPath.slice(0, -1))}" class="file-up">.. (up)</a></td>
          <td title={formatSize(curParent.size, true)}>{formatSize(curParent.size)}</td>
          <td>Move up the tree!</td>
          <td>{formatDateTime(curParent.mtime)}</td>
        </tr>
      {/if}
      {#each curNode?.children.slice().sort((a, b) => cmpProp(a, b, 'type') || cmpProp(a, b, curSort, curSortReverse)) as child}
        {#if child.type === 'd'}
          <tr role="button" onclick={() => enterChild(child)}>
            <td><a onclick={(event) => event.preventDefault()} href="#{getChildPath(curPath, child)}" class="file-dir{child.name == '1337' ? '2' : ''}">{child.name}</a></td>
            <td title={formatSize(child.size, true)}>{formatSize(child.size)}</td>
            <td>{child.remark}</td>
            <td>{formatDateTime(child.mtime)}</td>
          </tr>
        {:else if child.type === 'f'}
          <tr>
            <td><a href={getDownloadPath(curPath, child)} target="_blank" class="file-file" data-ext={ext(child.name)}>{child.name}</a></td>
            <td title={formatSize(child.size, true)}>{formatSize(child.size)}</td>
            <td>{child.remark}</td>
            <td>{formatDateTime(child.mtime)}</td>
          </tr>
        {:else if child.type === 'l'}
          <tr>
            <td><a href={child.href} target="_blank" class="file-link">{child.name}</a></td>
            <td>-</td>
            <td>{child.remark}</td>
            <td>{formatDateTime(child.mtime)}</td>
          </tr>
        {/if}
      {/each}
    {:else}
      <tr class="table-danger">
        <!-- svelte-ignore a11y_invalid_attribute -->
        <td><a href="#" target="_blank" class="file-loading">[Loading]</a></td>
        <td><em>Unknown</em></td>
        <td>Possible malfunction!</td>
        <td>{formatDateTime(Date.now())}</td>
      </tr>
    {/if}
  </tbody>
</table>
