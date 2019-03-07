import { ConnectionManager } from '../ConnectionManager'
import { PIORoom } from './PIORoom'

/**
 * Wrapper for PlayerIO.client with promises.
 */
export class PIOClient {
  private readonly cm = new ConnectionManager<PIORoom, never>()

  constructor (private readonly client: PIO.client, devServer?: string) {
    this.client.multiplayer.useSecureConnections = true
    if (devServer) {
      this.client.multiplayer.developmentServer = devServer
    }
  }

  createRoom (roomId: string, roomType: string, visible = true, roomData: object | null = null): Promise<string> {
    return new Promise<string>(
      (resolve, reject) =>
        this.client.multiplayer.createRoom(roomId, roomType, visible, roomData, resolve, reject))
  }

  createJoinRoom (roomId: string, roomType: string,
    visible = true, roomData: object | null = null, joinData: object | null = null): Promise<PIORoom> {
    return this.cm.connect(() => new Promise<PIORoom>(
      (resolve, reject) =>
        this.client.multiplayer.createJoinRoom(roomId, roomType, visible, roomData, joinData,
          (c) => resolve(new PIORoom(c, roomId)), reject)))
  }

  joinRoom (roomId: string, joinData: object | null = null): Promise<PIORoom> {
    return this.cm.connect(() => new Promise<PIORoom>(
      (resolve, reject) =>
        this.client.multiplayer.joinRoom(roomId, joinData, (c) => resolve(new PIORoom(c, roomId)), reject)))
  }

  listRooms (roomType: string, searchCriteria = {}, resultLimit = 0, resultOffset = 0): Promise<PIO.roomInfo[]> {
    return new Promise(
      (resolve, reject) =>
        this.client.multiplayer.listRooms(roomType, searchCriteria, resultLimit, resultOffset, resolve, reject))
  }

  async disconnect (): Promise<void> {
    // do nothing
  }
}
