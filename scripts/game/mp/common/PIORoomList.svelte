<script lang="ts">
import type { OptionsAny, OptionStoreAny } from './RoomOption'
import RoomOption from './RoomOption.svelte'
import RoomList from './RoomList.svelte'

import type { BaseGameRoom } from './remote/BaseGameRoom'
import { PIOClient } from './remote/playerio/PIOClient'
import { PIOAdapter, PIORoom } from './remote/playerio/PIORoom'
import { PIOConnectionManager } from './remote/playerio/PIOConnectionManager'

import { randomAlphaNumeric } from '@/util'
import { pState } from '@/util/svelte.svelte'

type RoomInfoFormatter = (r: PIO.roomInfo) => string

interface Props {
  gameId: string
  roomType: string
  gameRoom?: BaseGameRoom
  joinData?: object | null
  onJoinedRoom: (conn: BaseGameRoom) => void
  formatGameMode: (roomData: object) => string
  columns?: [string, RoomInfoFormatter, RoomInfoFormatter?][]
  roomCreateOptions: readonly OptionsAny[]
}

let {
  gameId,
  roomType,
  gameRoom,
  joinData = null,
  onJoinedRoom,
  formatGameMode,
  columns = [
    ['Players', (r) => formatPlayerCount(r)],
    ['ID', (r) => r.id.slice(0, 8) + '…', (r) => r.id],
    ['Game Mode', (r) => formatGameMode(r.roomData)],
  ],
  roomCreateOptions,
}: Props = $props()

function formatPlayerCount (r: PIO.roomInfo): string {
  const total = r.onlineUsers
  const active = +(r.roomData as any).activeCount || 0
  const spect = total - active
  return spect ? `${active}+${spect}` : total + ''
}

// svelte-ignore state_referenced_locally
const cm = new PIOConnectionManager(gameId)

// svelte-ignore state_referenced_locally
const roomCreateData: readonly OptionStoreAny[] = roomCreateOptions.map(o => [o, pState(`game/mp/_roomCreate/${roomType}/${o[0]}`, o[2])] as OptionStoreAny)

function getRoomData (): object | null {
  return roomCreateData.length ? Object.fromEntries(roomCreateData.map(([o, s]) => [o[0], s.value])) : null
}

function resetRoomOptions () {
  roomCreateData.forEach((s) => s[1].value = s[0][2])
}

let rooms: PIO.roomInfo[] = $state([])
let isRefreshing = $state(false)
let isConnected = $state(false)

export async function refreshRooms () {
  isRefreshing = true
  try {
    const conn = await getConnection()
    rooms = await conn.listRooms(roomType)
  } catch (err) {
    console.log(err)
    alert(err)
  } finally {
    isRefreshing = false
  }
}

async function tryConnect (makeRoom: (conn: PIOClient) => Promise<PIORoom>): Promise<PIORoom | undefined> {
  try {
    const conn = await getConnection()
    const roomConn = await makeRoom(conn)

    void refreshRooms()

    onJoinedRoom(new PIOAdapter(roomConn))
    return roomConn
  } catch (err) {
    console.log(err)
    alert(err)
    return undefined
  }
}

function getConnection (): Promise<PIOClient> {
  const conn = cm.connect()
  isConnected = true
  return conn
}

refreshRooms()
</script>

<RoomList {isRefreshing} {rooms} disableNew={!isConnected} showNewRoomFooter={roomCreateData.length > 8}
  onRefresh={refreshRooms}
  onResetRoomOptions={resetRoomOptions}
  onNewRoom={() => tryConnect(async (conn) => conn.createJoinRoom(randomAlphaNumeric(50), roomType, true, getRoomData(), joinData))}>
  {#snippet newRoom()}
    <div >
      {#each roomCreateData as optionStore}
        <RoomOption {optionStore} />
      {/each}
    </div>
  {/snippet}
  <table class="table table-sm">
    <tbody>
      <tr>
        <th scope="col">Action</th>
        {#each columns as column}
          <th scope="col">{column[0]}</th>
        {/each}
      </tr>
      {#each rooms as room}
        <tr class:table-info={room.id == (gameRoom as PIOAdapter)?.id}>
          <td><button class="btn btn-outline-primary btn-small" onclick={() => tryConnect(async (conn) => conn.joinRoom(room.id, joinData))}>Join</button></td>
          {#each columns as column}
            <td title={column[2] ? column[2](room) : ''}>{column[1](room)}</td>
          {/each}
        </tr>
      {:else}
        <tr>
          <td colspan={1 + columns.length} class="text-center">No rooms</td>
        </tr>
      {/each}
    </tbody>
  </table>
</RoomList>
