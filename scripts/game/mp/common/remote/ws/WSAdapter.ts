import type { BaseGameRoom, DiscCallback, MsgCallback } from '../BaseGameRoom'
import type { Connection } from '../ConnectionManager'

export class WSAdapter implements BaseGameRoom, Connection {
  private readonly msgCallbacks: MsgCallback[] = []
  private readonly discCallbacks: DiscCallback[] = []

  constructor (private readonly ws: WebSocket) {
    ws.onclose = () => this.discCallbacks.forEach((c) => c())
    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        const b = new Uint8Array(event.data)
        this.msgCallbacks.forEach((c) => c(b))
      }
    }
  }

  get connected (): boolean { return this.ws.readyState === WebSocket.OPEN }

  disconnect (): void {
    this.ws.close()
  }

  send (msg: Uint8Array): void {
    this.ws.send(msg)
  }

  registerRecv (cb: MsgCallback): void {
    this.msgCallbacks.push(cb)
  }

  registerDisc (cb: DiscCallback): void {
    this.discCallbacks.push(cb)
  }
}
