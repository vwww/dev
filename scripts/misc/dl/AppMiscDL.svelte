<script lang="ts">
import fileRoot from './fileList'
import { NodeBrowse, NodeDirectory } from './nodeTypes'

// File browser
let curPath = [fileRoot]
$: curNode = curPath[curPath.length - 1]
$: curParent = curPath.length > 1 ? curPath[curPath.length - 2] : fileRoot

function up (count: number): void {
  count = Math.min(count, curPath.length - 1)
  if (!count) return

  curPath = curPath.slice(0, -count)

  updateLocationHash()
}

function enterChild (node: NodeDirectory): void {
  curPath = [...curPath, (curNode = node)]

  updateLocationHash()
}

function getPathString (path: NodeDirectory[]): string {
  return path.slice(1).map(node => node.name).join('/')
}

function getChildPath (path: NodeDirectory[], child: NodeBrowse): string {
  return path.slice(1).map(node => node.name + '/').join('') + child.name
}

function formatSize (s: number, noreduce = false): string {
  if (s < 0) return s + ''

  const p = ['', 'K', 'M'] // prefixes
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
  return '../../assets/victorz/dl/' + getChildPath(path, node)
}

// Sorting
let curSort = 'name'
let curSortReverse = false

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

function sortText (isSort: boolean, reverse: boolean): string {
  return isSort
    ? reverse
      ? ' (desc)'
      : ' (asc)'
    : ''
}

// Load from hash
function updateLocationHash (replaceHash = false) {
  const newHash = getPathString(curPath)
  if (location.hash !== newHash) {
    history[replaceHash ? 'replaceState' : 'pushState'](null, '', `${location.pathname}#${newHash}`)
  }
  document.title = "Victor's Downloads" + (newHash ? '/' + newHash : '')
}

function browseToPath (path: string, replaceHash = false) {
  const newPath = [fileRoot]
  let node = fileRoot
  for (const segment of path.split('/')) {
    const nextChild = node.children.find(c => c.name === segment)
    if (!nextChild || nextChild.type !== 'dir') break
    newPath.push(node = nextChild)
  }

  curPath = newPath
  updateLocationHash(replaceHash)
}

function browseLocationHash () {
  browseToPath(location.hash.slice(1), true)
}

browseLocationHash()
</script>

<svelte:window on:hashchange={browseLocationHash} />

<nav aria-label="breadcrumb">
  <ol class="breadcrumb">
    {#each curPath as item, index}
      {#if index + 1 === curPath.length}
        <li class="breadcrumb-item active" aria-current="page">{item.name} ({formatSize(item.size)})</li>
      {:else}
        <li class="breadcrumb-item"><a href="#{getPathString(curPath.slice(0, index + 1))}" on:click|preventDefault={() => up((curPath.length - 1) - index)}>{item.name}</a></li>
      {/if}
    {/each}
  </ol>
</nav>

<table class="table table-striped table-bordered table-hover">
  <thead>
    <tr>
      <th on:click={() => setSort('name')}>Name{sortText(curSort === 'name', curSortReverse)}</th>
      <th on:click={() => setSort('size')}>Size{sortText(curSort === 'size', curSortReverse)}</th>
      <th on:click={() => setSort('remark')}>Remarks{sortText(curSort === 'remark', curSortReverse)}</th>
      <th on:click={() => setSort('mtime')}>Modified Time{sortText(curSort === 'mtime', curSortReverse)}</th>
    </tr>
  </thead>
  <tbody>
    {#if curPath.length > 2}
      <tr on:click={() => up(curPath.length - 1)}>
        <!-- svelte-ignore a11y-invalid-attribute We actually want this to set the hash to # -->
        <td><a on:click|preventDefault href="#" class="file-root">. (root)</a></td>
        <td title={formatSize(fileRoot.size, true)}>{formatSize(fileRoot.size)}</td>
        <td>Go to the top!</td>
        <td>{formatDateTime(fileRoot.mtime)}</td>
      </tr>
    {/if}
    {#if curPath.length > 1}
      <tr on:click={() => up(1)}>
        <td><a on:click|preventDefault href="#{getPathString(curPath.slice(0, -1))}" class="file-up">.. (up)</a></td>
        <td title={formatSize(curParent.size, true)}>{formatSize(curParent.size)}</td>
        <td>Move up the tree!</td>
        <td>{formatDateTime(curParent.mtime)}</td>
      </tr>
    {/if}
    {#each curNode.children.sort((a, b) => cmpProp(a, b, 'type') || cmpProp(a, b, curSort, curSortReverse)) as child}
      {#if child.type === 'dir'}
        <tr on:click={() => enterChild(child)}>
          <td><a on:click|preventDefault href="#{getChildPath(curPath, child)}" class="file-dir">{child.name}</a></td>
          <td title={formatSize(child.size, true)}>{formatSize(child.size)}</td>
          <td>{child.remark}</td>
          <td>{formatDateTime(child.mtime)}</td>
        </tr>
      {:else}
        <tr>
          <!-- svelte-ignore security-anchor-rel-noreferrer (goes to external domain but still controlled by us) -->
          <td><a href={getDownloadPath(curPath, child)} target="_blank" class="file-file" data-ext={ext(child.name)}>{child.name}</a></td>
          <td title={formatSize(child.size, true)}>{formatSize(child.size)}</td>
          <td>{child.remark}</td>
          <td>{formatDateTime(child.mtime)}</td>
        </tr>
      {/if}
    {/each}
  </tbody>
</table>

<style>
tbody tr { cursor: pointer }
</style>
