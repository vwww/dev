import { valueStore } from '../../../../util/svelte'
import ChatState from '../ChatState'
import { BaseGameRoom } from '../remote/BaseGameRoom'
import { ByteReader } from './ByteReader'
import { ByteWriter } from './ByteWriter'

const MAX_NAME_LEN = 20
const MAX_CHAT_LEN = 100

const MAX_PLAYERS = 128

const MAX_HISTORY_LEN = 100

export interface BaseClient {
  cn: number
  name: string
  active: boolean
  rank: number
  ping: number

  isMe?: true
}

export abstract class CommonGame<C extends BaseClient, G> {
  protected static DEFAULT_PLAYER: BaseClient = {
    cn: -1,
    name: 'unnamed',
    active: false,
    rank: 0,
    ping: -1,
  }

  public readonly inGame = valueStore(false)
  public readonly isActive = valueStore(false)
  public readonly pastGames = valueStore([] as G[])

  public readonly clientsSorted = valueStore([] as C[])

  protected myCn = -1
  protected clients = new Map<number, C>()
  protected readonly playersSortProps: ((p: C) => (number | string))[] = []

  protected room?: BaseGameRoom

  protected PROTOCOL_VERSION = 0

  constructor (protected chat: ChatState) {
    setTimeout(() => {
      const sampleMsg = new ByteReader(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]))

      console.log('%cMultiplayer Game Bug Report Guide', 'font-family:helvetica; font-size:20px')
      console.log("You're probably trying to debug a network error or file a bug report for it.")
      console.log('If you see an error like this, your report must contain the packet values:')
      console.log('example', sampleMsg.debugBuf, sampleMsg)
      console.log('In the example above, you would have to submit at least [0, 1, 2, 3, 4, 5, 6, 7] (expand stuff as needed)')
    }, 100)
  }

  static formatPlayerName (client?: BaseClient, cn?: number): string {
    return client ? `${client.name} (${client.cn})` : ('<unknown>' + (cn === undefined ? '' : ` (${cn})`))
  }

  filterName (name: string): string {
    name = name.replace(/[^a-zA-Z_ ]/, '').replace(/ {2,}/, ' ').trim().slice(0, 20)
    return name || 'unnamed'
  }

  enterGame (room: BaseGameRoom, name: string): void {
    if (!room?.connected) return

    if (this.room) {
      this.room.disconnect()
    }

    this.room = room
    room.registerRecv((msg) => {
      if (room === this.room) {
        this.processMessages(new ByteReader(msg))
      }
    })
    room.registerDisc(() => {
      if (room === this.room) {
        this.chat.addSysMessage('You disconnected.')
        this.inGame.set(false)
      } else {
        this.chat.addSysMessage('You disconnected from the old room.')
      }
    })

    const welcomeBuf = new ByteWriter()
    welcomeBuf.putInt(this.PROTOCOL_VERSION)
    welcomeBuf.putString(name)
    room.send(welcomeBuf.toArray())

    this.inGame.set(true)

    this.chat.addSysMessage('You are joining the game.')
  }

  leaveGame (): void {
    if (!this.room) return
    this.room.disconnect()
  }

  sendReset (): void {
    this.room?.send(new ByteWriter()
      .putInt(CommonC2S.RESET)
      .toArray()
    )
  }

  sendActive (active: boolean): void {
    this.room?.send(new ByteWriter()
      .putInt(CommonC2S.ACTIVE)
      .putBool(active)
      .toArray()
    )
  }

  sendChat (s: string, flags: number, target = -1): void {
    if (!this.room) {
      this.chat.addSysMessage('cannot send chat message: not connected to game room')
      return
    }
    this.room.send(new ByteWriter()
      .putInt(CommonC2S.CHAT)
      .putInt(flags)
      .putInt(target)
      .putString(s.slice(0, MAX_CHAT_LEN))
      .toArray()
    )
  }

  processCommand (s: string): void {
    const SAY_TARGET_ALL = 0
    const SAY_TARGET_WHISPER = 1
    const SAY_TARGET_TEAM = 2
    // const SAY_TARGET_RESERVED = 3
    // const SAY_TARGET = 3
    const SAY_ACTION = 1 << 2
    // const SAY_CLIENT = (1 << 3) - 1
    // const SAY_SPAM = 1 << 3

    if (s.length > 0 && s[0] === '/') {
      const [cmd, text] = s.slice(1).split(' ', 2)
      let me = false
      switch (cmd) {
        case 'me':
          me = true
          // fallthrough
        case 'say':
          if (text) this.sendChat(text, (me ? SAY_ACTION : 0) | SAY_TARGET_ALL)
          break

        case 'meteam':
          me = true
          // fallthrough
        case 'sayteam':
          if (text) this.sendChat(text, (me ? SAY_ACTION : 0) | SAY_TARGET_TEAM)
          break

        case 'mew':
        case 'mewhisper':
        case 'mepm':
          me = false
          // fallthrough
        case 'w':
        case 'whisper':
        case 'pm': {
          if (!text) break
          let target = -1
          let i = 0
          const matches = /^(\d+)\s+/.exec(s)
          if (matches) {
            const match = matches[1]
            target = +match
            i = match.length
          }
          if (text.length > i) this.sendChat(text.slice(i), (me ? SAY_ACTION : 0) | SAY_TARGET_WHISPER, target)
          break
        }

        case 'leave':
        case 'disconnect':
          this.leaveGame()
          break

        case '':
        case 'help':
          switch (text) {
            case 'say':
              this.chat.addSysMessage('without / prefix, use shorthand prefixes: *?(@\\d+|%|) say (*me) @pm|%team|all')
              break
            default:
              this.chat.addSysMessage('supported commands: say, me, sayteam, meteam, w, whisper, pm, mew, mewhisper, mepm, leave, disconnect, help')
          }
          break

        default:
          this.chat.addSysMessage(`command not recognized: ${s}`)
      }
    } else {
      let flags = 0
      let target = -1
      let i = 0
      if (s.length > 1 && s[0] === '*') {
        i++
        flags |= 4
      }
      if (s.length > i) {
        switch (s[i]) {
          case '@':
            if (s.length > i + 1) {
              const matches = /^(\d+)\s+/.exec(s.slice(i + 1))
              if (matches) {
                const match = matches[1]
                target = +match
                i = i + 1 + match.length
                flags |= SAY_TARGET_WHISPER
              }
            }
            break

          case '%':
            flags |= SAY_TARGET_TEAM
            i++
        }
      }
      if (s.length > i) this.sendChat(s.slice(i), flags, target)
    }
  }

  addHistory (history: G): void {
    this.pastGames.update((v) => [history, ...v.slice(0, MAX_HISTORY_LEN - 1)])
  }

  clearHistory (): void {
    this.pastGames.set([])
  }

  protected processMessages (m: ByteReader): void {
    if (!this.room) return
    let error: string | undefined
    while (m.remaining > 0) {
      const type = m.getInt()
      if (!this.processMessage(type, m)) {
        error = 'tag type'
        break
      }
    }
    if (m.overread) {
      error = 'overread'
    }
    if (error) {
      console.log(`neterr: ${error}`, m.debugBuf, m)
      this.room.disconnect()
    }
  }

  protected processMessage (type: number, m: ByteReader): boolean {
    switch (type) {
      case CommonS2C.RESET: {
        const cn = m.getInt()
        const player = this.clients.get(cn)
        if (player) {
          this.playerResetStats(player)
          this.updatePlayers()
        }
        this.chat.playerReset(CommonGame.formatPlayerName(player))
        break
      }

      case CommonS2C.WELCOME: {
        const protocol = m.getInt()
        if (protocol !== this.PROTOCOL_VERSION) {
          alert(`different protocol version (client: ${this.PROTOCOL_VERSION}, server: ${protocol})\nrefresh the page for updates?`)
        }

        this.clients.clear()

        this.isActive.set(false)
        this.myCn = m.getInt()

        this.processWelcomeMode(m)

        for (let i = 0; i < MAX_PLAYERS + 1; i++) {
          const cn = m.getInt()
          if (cn < 0) break
          const player = this.makePlayer()
          player.cn = cn
          player.active = m.getBool()
          player.name = this.filterName(m.getString(MAX_NAME_LEN))
          player.ping = m.getInt()
          if (cn === this.myCn) player.isMe = true
          this.processWelcomePlayer(m, player)
          this.addPlayer(player)
        }

        this.processWelcomeGame(m)

        this.updatePlayers()
        break
      }
      case CommonS2C.JOIN: {
        const newPlayer = this.processJoin(m)
        this.updatePlayers()
        this.chat.playerJoined(CommonGame.formatPlayerName(newPlayer))
        break
      }
      case CommonS2C.LEAVE: {
        const cn = m.getInt()
        const player = this.clients.get(cn)
        if (player) {
          if (player.active) {
            this.playerDeactivated(player)
          }
          this.chat.playerLeft(CommonGame.formatPlayerName(player))
          this.clients.delete(cn)
          this.updatePlayers()
        }
        break
      }
      case CommonS2C.CHAT: {
        const cn = m.getInt()
        const flags = m.getInt()
        const target = m.getInt()
        const msg = m.getString(MAX_CHAT_LEN)

        const player = this.clients.get(cn)
        const playerName = CommonGame.formatPlayerName(player, cn)
        const targetName = target < 0
          ? undefined
          : target === this.myCn
            ? 'you'
            : CommonGame.formatPlayerName(this.clients.get(target), target)
        this.chat.addChatMessage(playerName, msg, flags, targetName)
        break
      }
      case CommonS2C.ACTIVE: {
        // active
        const cn = m.getInt()
        const active = m.getBool()
        const p = this.clients.get(cn)
        if (p) {
          p.active = active
          if (cn === this.myCn) {
            this.isActive.set(active)
          }
          if (active) {
            this.playerActivated(p)
          } else {
            this.playerDeactivated(p)
          }
          this.updatePlayers()
        }
        break
      }
      case CommonS2C.PING: {
        // send pong
        this.room?.send(new ByteWriter()
          .putInt(CommonC2S.PONG)
          .putInt(m.getInt())
          .toArray()
        )
        break
      }
      case CommonS2C.PING_TIME: {
        // ping times
        for (let i = 0; i <= this.clients.size; i++) {
          const cn = m.getInt()
          if (cn < 0) break
          const ping = m.getInt()
          const player = this.clients.get(cn)
          if (player) {
            player.ping = ping
            this.updatePlayers(true)
          }
        }
        break
      }
      default:
        return this.processMessage2(type, m)
    }
    return true
  }

  protected abstract processMessage2 (type: number, m: ByteReader): boolean
  protected abstract processWelcomeMode (m: ByteReader): void
  protected abstract processWelcomeGame (m: ByteReader): void
  protected abstract processWelcomePlayer (m: ByteReader, player: C): void
  protected abstract playerResetStats (player: C): void
  protected abstract playerActivated (player: C): void
  protected abstract playerDeactivated (player: C): void

  protected updatePlayers (noRebuild?: boolean): void {
    if (noRebuild) {
      this.clientsSorted.update((v) => v)
      return
    }

    const cmpPlayers = (a: C, b: C): number => {
      for (const prop of [(p: C) => p.active, ...this.playersSortProps]) {
        const aV = prop(a)
        const bV = prop(b)
        if (aV < bV) {
          return 1
        } else if (aV > bV) {
          return -1
        }
      }
      return a.cn - b.cn
    }

    // Sort players
    const sortedPlayers = [...this.clients.values()].sort(cmpPlayers)

    // Update ranks
    let rank = 1
    sortedPlayers.forEach((p, i) => {
      if (i) {
        // standard competition ranking
        const prevPlayer = sortedPlayers[i - 1]
        if (this.playersSortProps.some((prop) => prop(p) !== prop(prevPlayer))) {
          rank = i + 1
        }
      }
      sortedPlayers[i].rank = rank
    })

    // Update player store
    this.clientsSorted.set(sortedPlayers)
  }

  protected addPlayer (p: C): void {
    this.clients.set(p.cn, p)
  }

  protected processJoin (m: ByteReader): C {
    const newPlayer = this.makePlayer()
    newPlayer.cn = m.getInt()
    newPlayer.name = this.filterName(m.getString(MAX_NAME_LEN))
    // process more from the join message?
    this.addPlayer(newPlayer)
    return newPlayer
  }

  protected abstract makePlayer (): C
}

export const enum CommonS2C {
  WELCOME,
  JOIN,
  LEAVE,
  RESET,
  RENAME,
  PING,
  PING_TIME,
  CHAT,
  ACTIVE,
  NUM
}

export const enum CommonC2S {
  RESET,
  RENAME,
  PONG,
  CHAT,
  ACTIVE,
  NUM,
}
