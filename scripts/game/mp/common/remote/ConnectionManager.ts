export interface Connection {
  disconnect(): void
}

export class ConnectionManager<TConn extends Connection, TConnID> {
  private curConn?: Promise<TConn>

  private curConnId?: TConnID

  private static thenDisconnect<T extends Connection> (conn: Promise<T>): void {
    // disconnects connection in background
    void conn.then((c) => c.disconnect())
  }

  async connect (makeConnection: () => Promise<TConn>, connId?: TConnID): Promise<TConn> {
    if (connId) {
      while (this.curConn && connId === this.curConnId) {
        // pool pending connects to same resource
        try {
          return await this.curConn
        } catch {
          // retry

          // If the call responsible for current connect fails,
          // another call will exit this while loop.
        }
      }
    }

    // Make a new connection
    this.curConnId = connId
    try {
      const oldConn = this.curConn
      const newConn = await (this.curConn = makeConnection())

      // disconnect old connection
      if (oldConn) {
        ConnectionManager.thenDisconnect(oldConn)
      }

      return newConn
    } catch (err) {
      this.curConn = this.curConnId = undefined
      throw err
    }
  }

  cancel (): void {
    if (this.curConn) {
      ConnectionManager.thenDisconnect(this.curConn)
      this.curConn = this.curConnId = undefined
    }
  }
}
