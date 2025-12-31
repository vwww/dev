import type ChatState from '@gmc/ChatState.svelte'
import { filterName, formatClientName, logBugReportInstructions, MAX_PLAYERS, sortAndRankPlayers } from './common'
import { ByteReader } from './ByteReader'
import { ByteWriter, type FmtArgs } from './ByteWriter'
import type { BaseGameRoom } from '@gmc/remote/BaseGameRoom'

const MAX_NAME_LEN = 20
const MAX_CHAT_LEN = 100

export abstract class CommonClient {
  cn = $state(-1)
  name = $state('unnamed')
  active = $state(false)
  rank = $state(0)
  ping = $state(-1)

  formatName () {
    return `${this.name} (${this.cn})`
  }

  processJoin (cn: number, m: ByteReader) {
    this.cn = cn
    this.ping = m.getInt()
    this.name = filterName(m.getString(MAX_NAME_LEN))
  }

  readWelcome (m: ByteReader): void {
    const flags = m.getInt()
    this.active = !!(flags & 1)
    this.name = filterName(m.getString(MAX_NAME_LEN))
    this.ping = flags >> 1
  }

  abstract resetScore (): void
}

export abstract class CommonGame<C extends CommonClient> {
  PROTOCOL_VERSION = 0

  room?: BaseGameRoom = $state()

  localClient: C
  clients: C[] = []
  leaderboard: C[] = $state([])

  protected abstract playersSortProps: ((p: C) => (number | bigint | string))[]

  abstract newClient (): C

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
            const type = m.getInt()

            const handler = this.MESSAGE_HANDLERS[type]
            if (!handler) throw new Error('tag type ' + type)
            handler.call(this, m)
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

  sendf <Fmt extends string> (fmt: Fmt, ...args: FmtArgs<Fmt>) {
    this.room?.send(new ByteWriter().putFmt(fmt, ...args).toArray())
  }

  protected updatePlayers (): void {
    this.leaderboard = sortAndRankPlayers(this.clients, this.playersSortProps)
  }

  // #region Receive
  abstract MESSAGE_HANDLERS: Record<number, (this: this, m: ByteReader) => void>

  protected abstract processWelcomeMode (m: ByteReader): void
  protected abstract processWelcomeGame (m: ByteReader): void

  protected processWelcome (m: ByteReader): void {
    const protocol = m.getInt()
    if (protocol !== this.PROTOCOL_VERSION) {
      alert(`different protocol version (client: ${this.PROTOCOL_VERSION}, server: ${protocol})\nrefresh the page for updates?`)
    }

    this.clients.length = 0

    const myCn = m.getCN()

    this.processWelcomeMode(m)

    for (let i = 0; i <= MAX_PLAYERS; i++) {
      const cn = m.getCN()
      if (cn < 0) break

      const isMe = cn === myCn
      const player = isMe ? this.localClient : this.newClient()
      player.cn = cn
      player.readWelcome(m)
      this.clients[cn] = player
    }

    this.processWelcomeGame(m)

    this.updatePlayers()
  }

  protected processJoin (m: ByteReader): void {
    const cn = m.getCN()
    if (this.clients[cn]) throw new Error('invalid join cn ' + cn)

    const newPlayer = this.newClient()
    newPlayer.processJoin(cn, m)

    this.clients[cn] = newPlayer

    this.chat.playerJoined(newPlayer.formatName())
    this.updatePlayers()
  }

  protected processLeave (m: ByteReader): void {
    const cn = m.getCN()
    const player = this.clients[cn]
    if (!player) throw new Error('invalid leave cn ' + cn)

    if (player.active) {
      this.playerDeactivated(player)
    }
    this.chat.playerLeft(player.formatName())
    delete this.clients[cn]
    this.updatePlayers()
  }

  protected processReset (m: ByteReader): void {
    const cn = m.getCN()
    const player = this.clients[cn]
    if (!player) throw new Error('invalid reset cn ' + cn)

    player.resetScore()
    this.updatePlayers()
    this.chat.playerReset(player.formatName())
  }

  protected processRename (m: ByteReader) {
    const cn = m.getCN()
    const newName = filterName(m.getString(MAX_NAME_LEN))
    const player = this.clients[cn]
    if (!player) throw new Error('invalid rename cn ' + cn)

    this.chat.playerRename(player.formatName(), newName)
    player.name = newName
  }

  protected processPing (m: ByteReader): void {
    this.sendPong(m.getInt())
  }

  protected processPingTime (m: ByteReader): void {
    for (let i = 0; i <= MAX_PLAYERS; i++) {
      const cn = m.getCN()
      if (cn < 0) break

      const ping = m.getInt()
      const player = this.clients[cn]
      if (!player) throw new Error('invalid ping cn ' + cn)

      player.ping = ping
    }
  }

  protected processChat (m: ByteReader): void {
    const cn = m.getCN()
    const flags = m.getInt()
    const target = m.getInt()
    const msg = m.getString(MAX_CHAT_LEN)

    const player = this.clients[cn]
    const playerName = formatClientName(player, cn)
    const targetPlayer = this.clients[target]
    const targetName = targetPlayer
      ? player === this.localClient
        ? 'you'
        : formatClientName(targetPlayer, target)
      : undefined
    this.chat.addChatMessage(playerName, msg, flags, targetName)
  }

  protected abstract playerActivated (player: C): void
  protected abstract playerDeactivated (player: C): void

  protected processActive (m: ByteReader): void {
    const cn = m.getCN()
    const p = this.clients[cn]
    if (!p) throw new Error('invalid active cn ' + cn)

    if ((p.active = !p.active)) {
      this.playerActivated(p)
    } else {
      this.playerDeactivated(p)
    }
    this.updatePlayers()
  }
  // #endregion

  // #region Send
  abstract sendReset (): void
  abstract sendRename (newName: string): void
  abstract sendPong (t: number): void
  abstract sendChat (s: string, flags: number, target?: number): void
  abstract sendActive (): void
  abstract sendReady (): void
  // #endregion
}

export function filterChat (s: string): string {
  return s.slice(0, MAX_CHAT_LEN)
}
