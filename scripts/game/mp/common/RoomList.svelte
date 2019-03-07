<script lang="ts">
import ProgressBar from './ProgressBar.svelte'

import { onDestroy, type Snippet } from 'svelte'

interface Props {
  onRefresh: () => void
  isRefreshing: boolean
  onNewRoom: () => void
  onResetRoomOptions: () => void
  rooms: ArrayLike<unknown>
  disableNew?: boolean
  showNewRoomFooter?: boolean
  refreshTimeoutBase?: number
  refreshTimeoutJitter?: number
  children: Snippet
  newRoom: Snippet
}

const {
  onRefresh,
  isRefreshing,
  onNewRoom,
  onResetRoomOptions,
  rooms,
  disableNew = false,
  showNewRoomFooter = false,
  refreshTimeoutBase = 15000,
  refreshTimeoutJitter = 15000,
  children,
  newRoom
}: Props = $props()

let collapsed = $state(false)

let refreshLast = $state(0)
let refreshNext = $state(1)
let refreshTimeout: ReturnType<typeof setTimeout>

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
    <h4 class="float-start">Rooms (showing {rooms.length}/{rooms.length})</h4>
    <div class="float-end">
      <button class="btn btn-sm btn-{collapsed ? 'secondary' : 'warning'}" onclick={() => collapsed = !collapsed}>{collapsed ? 'Show' : 'Hide'}</button>
      <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#newRoomModal" disabled={disableNew}>New</button>
    </div>
  </div>
  <div class="card-body" class:d-none={collapsed} style="overflow-y: scroll; height: 50vh">
    <div class="d-flex align-items-center">
      <div class="flex-grow-1 me-2">
        <ProgressBar startTime={refreshLast} endTime={refreshNext} active />
      </div>
      <button class="btn btn-sm btn-secondary" onclick={() => (setRefreshTimeout(), onRefresh())}>
        <div class="spinner-border spinner-border-sm" class:d-none={!isRefreshing}></div>
        Refresh
      </button>
    </div>
    {@render children()}
  </div>
</div>

<!-- Modal -->
<div class="modal" id="newRoomModal" tabindex="-1" role="dialog" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">New room</h5>
        <div class="ms-auto">
          <button class="btn btn-sm btn-danger" onclick={onResetRoomOptions}>Reset</button>
          <button class="btn btn-sm btn-primary" data-bs-dismiss="modal" onclick={onNewRoom}>Create</button>
          <button class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
      </div>
      <div class="modal-body">
        {@render newRoom()}
      </div>
      {#if showNewRoomFooter}
        <div class="modal-footer">
          <button class="btn btn-danger me-auto" onclick={onResetRoomOptions}>Reset</button>
          <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button class="btn btn-primary" data-bs-dismiss="modal" onclick={onNewRoom}>Create</button>
        </div>
      {/if}
    </div>
  </div>
</div>
