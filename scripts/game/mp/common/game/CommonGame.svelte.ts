import type ChatState from '@gmc/ChatState.svelte'
import { logBugReportInstructions } from '@gmc/game/common'
import { ByteReader } from '@gmc/game/ByteReader'
import { ByteWriter, type FmtArgs } from '@gmc/game/ByteWriter'
import type { BaseGameRoom } from '@gmc/remote/BaseGameRoom'

export class CommonClient {
  cn = $state(-1)
  name = $state('unnamed')
  active = $state(false)
  rank = $state(0)
  ping = $state(-1)

  formatName () {
    return `${this.name} (${this.cn})`
  }
}

export abstract class CommonGame<C> {
  room?: BaseGameRoom = $state()

  localClient: C
  clients: C[] = []
  clientsNonNull: C[] = []
  leaderboard: C[] = $state([])

  abstract newClient (): C
  abstract processMessage (m: ByteReader): void

  constructor (public chat: ChatState) {
    this.localClient = this.newClient()
    setTimeout(logBugReportInstructions, 100)
  }

  setupGame (room: BaseGameRoom): void {
    this.room?.disconnect()
    this.room = room
    room.registerRecv((msg) => {
      if (this.room === room) {
        const m = new ByteReader(msg)
        try {
          while (m.remaining > 0) {
            this.processMessage(m)
          }
          if (m.overread) {
            throw new Error('overread')
          }
        } catch (error) {
          console.error('neterr', error)
          console.log(m.debugBuf, m)
          this.room.disconnect()
        }
      }
    })
    room.registerDisc(() => {
      if (this.room === room) {
        this.chat.addSysMessage('You disconnected.')
        this.room = undefined
      } else {
        this.chat.addSysMessage('You disconnected from the old room.')
      }
    })

    this.chat.addSysMessage('You are joining the game.')
  }

  leaveGame (): void {
    this.room?.disconnect()
  }

  sendf<Fmt extends string>(fmt: Fmt, ...args: FmtArgs<Fmt>) {
    this.room?.send(ByteWriter.f(fmt, ...args))
  }
}
