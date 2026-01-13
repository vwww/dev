type ChatJoin = {
  type: 'join'
  name: string
}

type ChatLeft = {
  type: 'left'
  name: string
}

type ChatReset = {
  type: 'reset'
  name: string
}

type ChatRename = {
  type: 'rename'
  oldName: string
  newName: string
}

type ChatMessage = {
  type: 'chat'
  name: string
  msg: string
  flags: number
  targetName?: string
}

type SysMessage = {
  type: 'sys'
  msg: string
}

type ChatEntry = ChatJoin | ChatLeft | ChatReset | ChatRename | ChatMessage | SysMessage

export const enum HoldMode {
  None,
  AfterNext,
  All,
}

export default class ChatState {
  private readonly messageBuf: ChatEntry[] = []

  private readonly queue: ChatEntry[] = []
  private holdMode = HoldMode.None

  public messages = $state(this.messageBuf)
  public queueLength = $state(0)

  constructor (private readonly maxChatMessages = 100) { }

  clear (): void {
    this.messageBuf.length = 0
    this.queue.length = 0
    this.holdMode = HoldMode.None
    this.queueLength = 0
    this.invalidate()
  }

  addEntry (obj: ChatEntry): void {
    switch (this.holdMode) {
      case HoldMode.None:
        if (this.messageBuf.length >= this.maxChatMessages) {
          this.messageBuf.shift()
        }
        this.messageBuf.push(obj)
        this.invalidate()
        break
      case HoldMode.AfterNext:
        this.messageBuf.push(obj)
        this.invalidate()
        this.holdMode = HoldMode.All
        break
      case HoldMode.All:
        if (this.queue.length >= this.maxChatMessages) {
          this.queue.shift()
        }
        this.queue.push(obj)
        this.queueLength++
    }
  }

  setHoldMode (holdMode: number): void {
    if (holdMode === HoldMode.AfterNext && this.queueLength > this.maxChatMessages) {
      // queue overflowed
      holdMode = HoldMode.All
    }

    this.holdMode = holdMode

    if (this.queue.length) {
      if (holdMode === HoldMode.None) {
        // load all messages
        const deleteCount = Math.max(0, this.messageBuf.length + this.queue.length - this.maxChatMessages)
        if (deleteCount) this.messageBuf.splice(0, deleteCount)
        this.messageBuf.push(...this.queue)
        this.queue.length = 0

        this.invalidate()
        this.queueLength = 0
      } else if (holdMode === HoldMode.AfterNext) {
        // load one message, allowing temporary oversizing
        this.messageBuf.push(this.queue.shift()!)

        this.invalidate()
        this.queueLength--
      }
    } else if (holdMode === HoldMode.None) {
      // fix oversized message buffer
      const deleteCount = this.messageBuf.length - this.maxChatMessages
      if (deleteCount > 0) {
        this.messageBuf.splice(0, deleteCount)
      }
      this.invalidate()
    }
  }

  playerJoined (playerName: string): void {
    this.addEntry({
      type: 'join',
      name: playerName,
    })
  }

  playerLeft (playerName: string): void {
    this.addEntry({
      type: 'left',
      name: playerName,
    })
  }

  playerReset (playerName: string): void {
    this.addEntry({
      type: 'reset',
      name: playerName,
    })
  }

  playerRename (playerName: string, newName: string): void {
    this.addEntry({
      type: 'rename',
      oldName: playerName,
      newName,
    })
  }

  addChatMessage (playerName: string, message: string, flags: number, targetName?: string): void {
    this.addEntry({
      type: 'chat',
      name: playerName,
      msg: message,
      flags,
      targetName,
    })
  }

  addSysMessage (message: string): void {
    this.addEntry({
      type: 'sys',
      msg: message,
    })
  }

  private invalidate (): void {
    this.messages = this.messageBuf
  }
}

interface ChatGameInterface {
  sendChat(s: string, flags: number, target?: number): void
  leaveGame(): void

  room?: object
  chat: ChatState
}

export function processChat (g: ChatGameInterface, s: string): void {
  const SAY_TARGET_ALL = 0
  const SAY_TARGET_WHISPER = 1
  const SAY_TARGET_TEAM = 2
  // const SAY_TARGET_RESERVED = 3
  // const SAY_TARGET = 3
  const SAY_ACTION = 1 << 2
  // const SAY_CLIENT = (1 << 3) - 1
  // const SAY_SPAM = 1 << 3

  function sendChat (s: string, flags: number, target?: number): void {
    if (!g.room) {
      g.chat.addSysMessage('cannot send chat message: not connected to game room')
      return
    }
    g.sendChat(s, flags, target)
  }

  if (s.length > 0 && s[0] === '/') {
    const firstSpace = s.indexOf(' ', 1)
    const [cmd, text] = firstSpace < 0 ? [s.slice(1), ''] : [s.slice(1, firstSpace), s.slice(firstSpace + 1)]
    let me = false
    switch (cmd) {
      case 'me':
        me = true
        // fallthrough
      case 'say':
        if (text) sendChat(text, (me ? SAY_ACTION : 0) | SAY_TARGET_ALL)
        break

      case 'meteam':
        me = true
        // fallthrough
      case 'sayteam':
        if (text) sendChat(text, (me ? SAY_ACTION : 0) | SAY_TARGET_TEAM)
        break

      case 'mew':
      case 'mewhisper':
      case 'mepm':
        me = true
        // fallthrough
      case 'w':
      case 'whisper':
      case 'pm': {
        if (!text) break
        let target = -1
        let i = 0
        const matches = /^(\d+)\s+/.exec(text)
        if (matches) {
          const match = matches[1]
          target = +match
          i = match.length
        }
        if (text.length > i) sendChat(text.slice(i), (me ? SAY_ACTION : 0) | SAY_TARGET_WHISPER, target)
        break
      }

      case 'leave':
      case 'disconnect':
        g.leaveGame()
        break

      case '':
      case 'help':
        switch (text) {
          case 'say':
            g.chat.addSysMessage('without / prefix, use shorthand prefixes: *?(@\\d+|%|) say (*me) @pm|%team|all')
            break
          default:
            g.chat.addSysMessage('supported commands: say, me, sayteam, meteam, w, whisper, pm, mew, mewhisper, mepm, leave, disconnect, help')
        }
        break

      default:
        g.chat.addSysMessage(`command not recognized: ${s}`)
    }
  } else {
    let flags = 0
    let target = -1
    let i = 0
    if (s.length > 1 && s[0] === '*') {
      i++
      flags |= SAY_ACTION
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
    if (s.length > i) sendChat(s.slice(i), flags, target)
  }
}
