import '@/vendor/PlayerIOClient.js'

import { ConnectionManager } from '../ConnectionManager'
import { PIOClient } from './PIOClient'

export class PIOConnectionManager {
  private readonly cm = new ConnectionManager<PIOClient, void>()

  constructor (private readonly gameId: string, private readonly defaultConnectionID = 'public') {
    PlayerIO.useSecureApiRequests = true
  }

  async connect (connectionId = this.defaultConnectionID, authArgs = { userId: 'guest' }, playerInsightSegments = {}): Promise<PIOClient> {
    const makeConnect = (): Promise<PIOClient> =>
      new Promise<PIOClient>((resolve, reject) =>
        PlayerIO.authenticate(this.gameId,
          connectionId,
          authArgs,
          playerInsightSegments,
          (c) => resolve(new PIOClient(c)),
          reject))
    return await this.cm.connect(makeConnect, undefined)
  }

  cancel (): void {
    this.cm.cancel()
  }
}
