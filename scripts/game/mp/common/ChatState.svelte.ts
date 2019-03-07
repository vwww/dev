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
        this.invalidate()
      }
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
