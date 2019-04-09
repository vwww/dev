import { formatHexColor } from '../../../util'
import { IConnector, ReadyState } from './IConnector'
import { IConnectorCallbacks } from './IConnectorCallbacks'

// const SERVER_PATH = 'wss://s-acrf.rhcloud.com:8443/s'
const SERVER_PATH = 'ws://localhost:8080/s'

export class WebSocketConnector implements IConnector {
  private sock?: WebSocket
  private lastKeySent = -1

  constructor (private game: IConnectorCallbacks) {}

  isConnected (): boolean { return !!this.sock }
  readyState (): ReadyState {
    return this.sock
      ? this.sock.readyState
      : ReadyState.Disconnected
  }

  connect (): void {
    this.disconnect()
    this.sock = new WebSocket(SERVER_PATH)
    this.sock.binaryType = 'arraybuffer'
    this.sock.onopen = () => this.connected()
    this.sock.onmessage = event => this.received(event)
    this.sock.onclose = () => this.disconnected()
    this.sock.onerror = () => this.disconnected()

    this.game.processServerConnect()
  }

  disconnect (): void {
    if (this.sock) this.sock.close()
  }

  private disconnected (): void {
    this.sock = undefined
    this.game.processServerDisconnect()
  }

  private connected (): void {
    let name = this.game.getUserName()
    let color = this.game.getUserColor()

    let buf = new ArrayBuffer(name.length + 3)
    let dv = new DataView(buf)

    dv.setUint16(0, color >> 8)
    dv.setUint8(2, color & 0xFF)
    str2buf(buf, name, 3)

    this.sock!.send(buf)
  }

  private received (event: MessageEvent): void {
    let data = event.data
    let dv = new DataView(data)

    let type = dv.getUint8(0)
    if (!type) {
      // welcome
      const color = formatHexColor(dv.getUint32(0) & 0xFFFFFF)
      const name = buf2str(data, 4)
      this.game.processServerWelcome(color, name)
    } else if (type === 1) {
      // state
      const DMF = 0xFFFF
      // const DVF = 0x3FFF

      // const keys = dv.getUint8(1)
      const p1x = dv.getUint16(2) / DMF
      const p1y = dv.getUint16(4) / DMF
      // const p1vy = dv.getInt16(6) / DMF

      const p2x = 2 - (dv.getUint16(8) / DMF)
      const p2y = dv.getUint16(10) / DMF
      // const p2vy = dv.getInt16(12) / DMF

      const bx = dv.getUint16(14) / DMF * 2
      const by = dv.getUint16(16) / DMF
      // const bvx = dv.getInt16(18) / DMF
      // const bvy = dv.getInt16(20) / DMF
      this.game.processServerState(p1x, p1y, p2x, p2y, bx, by)
    } else if (type === 2) {
      // enter
      const color = formatHexColor(dv.getUint32(0) & 0xFFFFFF)
      const name = buf2str(data, 4)
      this.game.processServerEnter(color, name)
      // start sending when opponent enters
      this.lastKeySent = -1
    } else if (type === 3) {
      // leave
      this.game.processServerLeave()
    } else if (type === 4) {
      // win
      this.game.processServerWin()
    } else if (type === 5) {
      // lose
      this.game.processServerLose()
    } else if (type === 6 || type === 7) {
      // next round
      this.game.processServerRoundStart(type === 6)
    } else if (type === 8) {
      // ping times
      this.game.processServerPingTimes(
        dv.getUint8(1) | ((dv.getUint8(2) & 0xF0) << 4),
        dv.getUint8(3) | ((dv.getUint8(2) & 0x0F) << 8),
      )
    } else if (type === 9 && data.byteLength === 9) {
      this.sock!.send(data.slice(1))
    }
  }

  public update (): void {
    if (!this.sock) return

    // don't bother to send keep-alives

    if (!this.game.shouldSendNetworkUpdate()) return

    const keyFlags = this.game.getKeyFlags()
    if (this.lastKeySent !== keyFlags) {
      let buf = new Uint8Array(1)
      buf[0] = (this.lastKeySent = keyFlags)
      this.sock.send(buf.buffer)
    }
  }
}

function buf2str (buf: ArrayBuffer, offset: number): string {
  let binaryString = ''
  const bytes = new Uint8Array(buf, offset)
  const length = bytes.length
  for (let i = 0; i < length; i++) {
    binaryString += String.fromCharCode(bytes[i])
  }
  return binaryString
}

function str2buf (buf: ArrayBuffer, str: string, offset: number): void {
  let a = new Uint8Array(buf, offset)
  const len = str.length
  for (let i = 0; i < len; ++i) {
    a[i] = str.charCodeAt(i)
  }
}
