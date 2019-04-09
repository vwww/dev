export interface IConnectorCallbacks {
  getUserName (): string
  getUserColor (): number
  getKeyFlags (): number

  shouldSendNetworkUpdate (): boolean

  processServerConnect (): void
  processServerDisconnect (): void
  processServerWelcome (color: string, name: string): void
  processServerState (p1x: number, p1y: number, p2x: number, p2y: number, bx: number, by: number): void
  processServerEnter (color: string, name: string): void
  processServerLeave (): void
  processServerWin (): void
  processServerLose (): void
  processServerRoundStart (p1Serves: boolean): void
  processServerPingTimes (p1: number, p2: number): void
}
