import type { BaseGameRoom, DiscCallback, MsgCallback } from '../BaseGameRoom'
import type { Connection } from '../ConnectionManager'

/**
 * Wrapper for PlayerIO.connection with promises.
 */
export class PIORoom implements Connection {
  constructor (public readonly c: PIO.connection, public readonly id: string) { }

  get connected (): boolean { return this.c.connected }

  disconnect (): void {
    this.c.disconnect()
  }
}

export class PIOAdapter implements BaseGameRoom {
  private readonly msgCallbacks: MsgCallback[] = []
  private readonly discCallbacks: DiscCallback[] = []

  constructor (private readonly room: PIORoom) {
    const msgCb = (message: PIO.message): void => {
      if (!message.length) {
        console.log('neterr: empty message', message)
        room.disconnect()
        return
      }

      let byteArray: PIO.ByteArray | undefined
      try {
        byteArray = message.getByteArray(0)
      } catch {
        console.log('neterr: first item is not byte array', message)
        room.disconnect()
        return
      }

      // console.log('recv', byteArray)

      const byteArrayTyped = Uint8Array.from(byteArray)
      this.msgCallbacks.forEach((c) => c(byteArrayTyped))
    }
    const discCb = (): void => {
      this.discCallbacks.forEach((c) => c())

      room.c.removeMessageCallback(msgCb)
      // the library has a bug if this callback is removed immediately
      setTimeout(() => room.c.removeDisconnectCallback(discCb), 1)
    }
    room.c.addMessageCallback('', msgCb)
    room.c.addDisconnectCallback(discCb)
  }

  get id (): string { return this.room.id }
  get connected (): boolean { return this.room.connected }

  disconnect (): void {
    this.room.disconnect()
  }

  send (msg: Uint8Array): void {
    // console.log('send', msg)
    this.room.c.send('', msg)
  }

  registerRecv (cb: MsgCallback): void {
    this.msgCallbacks.push(cb)
  }

  registerDisc (cb: DiscCallback): void {
    this.discCallbacks.push(cb)
  }
}
