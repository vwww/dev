import { valueStore } from '@/util/svelte'

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

export default class ChatState {
  public readonly messages = valueStore([] as ChatEntry[])
  public readonly queueLength = valueStore(0)

  private readonly messageBuf: ChatEntry[] = []

  private readonly queue: ChatEntry[] = []
  private hold = false

  constructor (private readonly maxChatMessages = 100) { }

  clear (): void {
    this.messageBuf.splice(0)
    this.queue.splice(0, this.queue.length)
    this.queueLength.set(0)
    this.invalidate()
  }

  addEntry (obj: ChatEntry): void {
    const buf = this.hold ? this.queue : this.messageBuf

    if (buf.length >= this.maxChatMessages) {
      buf.shift()
    }

    buf.push(obj)

    if (this.hold) {
      this.queueLength.update((x) => x + 1)
    } else {
      this.invalidate()
    }
  }

  setHold (hold: boolean): void {
    this.hold = hold
    if (!hold && this.queue.length) {
      const deleteCount = Math.max(0, this.messageBuf.length + this.queue.length - this.maxChatMessages)
      if (deleteCount) this.messageBuf.splice(0, deleteCount)
      this.messageBuf.push(...this.queue)
      this.queue.length = 0

      this.invalidate()
      this.queueLength.set(0)
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
    this.messages.set(this.messageBuf)
  }
}
