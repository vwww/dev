<script lang="ts">
import RoomOption, { OptionsAny, OptionStoreAny } from './RoomOption.svelte'
import RoomList from './RoomList.svelte'

import { BaseGameRoom } from './remote/BaseGameRoom'
import { PIOAdapter, PIORoom } from './remote/playerio/PIORoom'
import { PIOConnectionManager } from './remote/playerio/PIOConnectionManager'

import { randomAlphaNumeric } from '@/util'
import { pStore } from '@/util/svelte'
    import { PIOClient } from './remote/playerio/PIOClient';

type RoomInfoFormatter = (r: PIO.roomInfo) => string

export let gameId: string
export let roomType: string
export let joinData: object | null = null
export let onJoinedRoom: (conn: BaseGameRoom) => void
export let formatGameMode: (roomData: object) => string
export let columns: [string, RoomInfoFormatter, RoomInfoFormatter?][] = [
  ['Players', (r) => formatPlayerCount(r)],
  ['ID', (r) => r.id.slice(0, 8) + '…', (r) => r.id],
  ['Game Mode', (r) => formatGameMode(r.roomData)],
]
export let roomCreateOptions: readonly OptionsAny[]

function formatPlayerCount (r: PIO.roomInfo): string {
  const total = r.onlineUsers
  const active = +(r.roomData as any).activeCount || 0
  const spect = total - active
  return spect ? `${active}+${spect}` : total + ''
}

const cm = new PIOConnectionManager(gameId)

const roomCreateData: readonly OptionStoreAny[] = (roomCreateOptions ?? []).map(o => [o, pStore(`game/mp/_roomCreate/${roomType}/${o[0]}`, o[2])])

function getRoomData (): object | null {
  return roomCreateData.length ? Object.fromEntries(roomCreateData.map(([o, s]) => [o[0], s.get()])) : null
}

function resetRoomOptions () {
  roomCreateData.forEach((s) => s[1].set(s[0][2]))
}

let rooms: PIO.roomInfo[] = []
let isRefreshing = false
let isConnected = false

async function refreshRooms () {
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

<RoomList {isRefreshing} {rooms} disableNew={!isConnected} onRefresh={refreshRooms}
  onResetRoomOptions={resetRoomOptions}
  onNewRoom={() => tryConnect(async (conn) => conn.createJoinRoom(randomAlphaNumeric(50), roomType, true, getRoomData(), joinData))}>
  <div slot="newRoom">
    {#each roomCreateData as optionStore}
      <RoomOption {optionStore} />
    {/each}
  </div>
  <table class="table table-sm">
    <tr>
      <th scope="col">Action</th>
      {#each columns as column}
        <th scope="col">{column[0]}</th>
      {/each}
    </tr>
    {#each rooms as room}
      <tr>
        <td><button class="btn btn-outline-primary btn-small" on:click={() => tryConnect(async (conn) => conn.joinRoom(room.id, joinData))}>Join</button></td>
        {#each columns as column}
          <td title={column[2] ? column[2](room) : ''}>{column[1](room)}</td>
        {/each}
      </tr>
    {:else}
      <tr>
        <td colspan={1 + columns.length} class="text-center">No rooms</td>
      </tr>
    {/each}
  </table>
</RoomList>
