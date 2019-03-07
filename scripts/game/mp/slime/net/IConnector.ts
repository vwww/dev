export const enum ReadyState {
  Connecting,
  Connected,
  Disconnecting,
  Disconnected,
}

export interface IConnector {
  isConnected (): boolean
  readyState (): ReadyState

  connect (): void
  disconnect (): void
  update (): void
}
