<script>
import ProgressBar from './ProgressBar'

import { onDestroy } from 'svelte'

export let onRefresh
export let isRefreshing
export let onNewRoom
export let rooms
export let disableNew = false
export let refreshTimeoutBase = 15000
export let refreshTimeoutJitter = 15000

let collapsed = false

let refreshLast = 0
let refreshNext = 1
let refreshTimeout

function getRefreshDelay () {
  return refreshTimeoutBase + Math.random() * refreshTimeoutJitter
}

function setRefreshTimeout () {
  clearTimeout(refreshTimeout)

  const delay = getRefreshDelay()

  refreshLast = Date.now()
  refreshNext = Date.now() + delay
  refreshTimeout = setTimeout(() => {
    onRefresh()
    setRefreshTimeout()
  }, delay)
}

setRefreshTimeout()
onDestroy(() => clearTimeout(refreshTimeout))
</script>

<div class="card mb-3">
  <div class="card-header">
    <h4 class="float-left">Rooms (showing {rooms.length}/{rooms.length})</h4>
    <div class="float-right">
      <button class="btn btn-sm btn-secondary" on:click={() => (setRefreshTimeout(), onRefresh())}>
        <div class="spinner-border spinner-border-sm" class:d-none={!isRefreshing}></div>
        Refresh
      </button>
      <button class={`btn btn-sm btn-${collapsed ? 'secondary' : 'warning'}`} on:click={() => collapsed = !collapsed}>{collapsed ? 'Show' : 'Hide'}</button>
      <button class="btn btn-sm btn-primary" data-toggle="modal" data-target="#newRoomModal" disabled={disableNew}>New</button>
    </div>
  </div>
  <div class="card-body" class:d-none={collapsed} style="overflow-y: scroll; height: 50vh">
    <ProgressBar startTime={refreshLast} endTime={refreshNext} />
    <slot />
  </div>
</div>

<!-- Modal -->
<div class="modal" id="newRoomModal" tabindex="-1" role="dialog" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">New room</h5>
        <button class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <slot name="newRoom" />
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-dismiss="modal">Cancel</button>
        <button class="btn btn-primary" data-dismiss="modal" on:click={onNewRoom}>Create</button>
      </div>
    </div>
  </div>
</div>
