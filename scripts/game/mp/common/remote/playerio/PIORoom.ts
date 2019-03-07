import { BaseGameRoom, DiscCallback, MsgCallback } from '../BaseGameRoom'
import { Connection } from '../ConnectionManager'

/**
 * Wrapper for PlayerIO.connection with promises.
 */
export class PIORoom implements Connection {
  // forward
  addMessageCallback = this.c.addMessageCallback.bind(this)
  addDisconnectCallback = this.c.addDisconnectCallback.bind(this)
  removeMessageCallback = this.c.removeMessageCallback.bind(this)
  removeDisconnectCallback = this.c.removeDisconnectCallback.bind(this)
  createMessage = this.c.createMessage.bind(this)
  send = this.c.send.bind(this)
  sendMessage = this.c.sendMessage.bind(this)

  constructor (private readonly c: PlayerIO.connection) { }

  get connected (): boolean { return this.c.connected }

  disconnect (): void {
    this.c.disconnect()
  }
}

export class PIOAdapter implements BaseGameRoom {
  private readonly msgCallbacks: MsgCallback[] = []
  private readonly discCallbacks: DiscCallback[] = []

  constructor (private readonly room: PIORoom) {
    const msgCb = (message: PlayerIO.message): void => {
      if (!message.length) {
        console.log('neterr: empty message', message)
        room.disconnect()
        return
      }

      let byteArray: PlayerIO.ByteArray | undefined
      try {
        byteArray = message.getByteArray(0)
      } catch {
        console.log('neterr: first item is not byte array', message)
        room.disconnect()
        return
      }

      // console.log('recv', byteArray)

      const byteArrayTyped = new Uint8Array(byteArray)
      this.msgCallbacks.forEach((c) => c(byteArrayTyped))
    }
    const discCb = (): void => {
      this.discCallbacks.forEach((c) => c())

      room.removeMessageCallback(msgCb)
      // the library has a bug if this callback is removed immediately
      setTimeout(() => room.removeDisconnectCallback(discCb), 1)
    }
    room.addMessageCallback('', msgCb)
    room.addDisconnectCallback(discCb)
  }

  get connected (): boolean { return this.room.connected }

  disconnect (): void {
    this.room.disconnect()
  }

  send (msg: Uint8Array): void {
    // console.log('send', msg)
    this.room.send('', msg)
  }

  registerRecv (cb: MsgCallback): void {
    this.msgCallbacks.push(cb)
  }

  registerDisc (cb: DiscCallback): void {
    this.discCallbacks.push(cb)
  }
}
