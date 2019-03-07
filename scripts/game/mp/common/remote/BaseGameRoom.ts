export type MsgCallback = (msg: Uint8Array) => void

export type DiscCallback = () => void

export interface BaseGameRoom {
  connected: boolean
  disconnect (): void
  send (msg: Uint8Array): void
  registerRecv (cb: MsgCallback): void
  registerDisc (cb: DiscCallback): void
}
