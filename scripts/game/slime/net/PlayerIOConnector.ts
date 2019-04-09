import { formatHexColor } from '../../../util'
import { IConnector, ReadyState } from './IConnector'
import { IConnectorCallbacks } from './IConnectorCallbacks'

declare var PlayerIO: PlayerIO.PlayerIO

const GAME_ID = 'slime-fd3iliszksmlav83stww'
const CONNECTION_ID = 'public'
const DEVELOPMENT_SERVER = 'localhost:8184'

export class PlayerIOConnector implements IConnector {
  private state = ReadyState.Disconnected
  private connection?: PlayerIO.connection
  private lastKeySent = -1

  constructor (private game: IConnectorCallbacks) {}

  isConnected (): boolean { return this.readyState() !== ReadyState.Disconnected }
  readyState (): ReadyState { return this.state }

  connect (): void {
    this.disconnect()

    this.state = ReadyState.Connecting

    const errorHandler = (error: any) => {
      console.log(error)
      this.disconnected()
    }

    PlayerIO.authenticate(GAME_ID, CONNECTION_ID, { userId: 'guest' }, {},
      client => {
        this.state = ReadyState.Connected

        client.multiplayer.developmentServer = DEVELOPMENT_SERVER

        const joinMatchMakingRoom = () => {
          client.multiplayer.createJoinRoom('$service-room$', 'match', false, null, null, connection => {
            this.connection = connection
            connection.addMessageCallback('m', message => {
              playGameRoom(message.getString(0))
              connection.disconnect()
            })
          }, errorHandler)
        }

        const playGameRoom = (roomId: string) => {
          client.multiplayer.createJoinRoom(roomId, 'slime', true, null, null, connection => {
            this.connection = connection
            connection.addDisconnectCallback(() => {
              this.game.processServerLeave()
              joinMatchMakingRoom()
            })
            connection.addMessageCallback('welcome', message => {
              const color = formatHexColor(message.getUInt(0) & 0xFFFFFF)
              const name = message.getString(1)
              this.game.processServerWelcome(color, name)
            })
            connection.addMessageCallback('s', message => {
              // state
              const DMF = 0xFFFF
              // const DVF = 0x3FFF

              const b = message.getByteArray(0)
              // const keys = b[0]
              const p1x = (b[1] << 8 | b[2]) / DMF
              const p1y = (b[3] << 8 | b[4]) / DMF
              // const p1vy = (b[5] << 8 | b[6]) / DMF

              const p2x = 2 - ((b[7] << 8 | b[8]) / DMF)
              const p2y = (b[9] << 8 | b[10]) / DMF
              // const p2vy = (b[11] << 8 | b[12]) / DMF

              const bx = (b[13] << 8 | b[14]) / DMF * 2
              const by = (b[15] << 8 | b[16]) / DMF
              // const bvx = (b[17] << 8 | b[18]) / DMF
              // const bvy = (b[19] << 8 | b[20]) / DMF
              this.game.processServerState(p1x, p1y, p2x, p2y, bx, by)
            })
            connection.addMessageCallback('enter', message => {
              const color = formatHexColor(message.getUInt(0) & 0xFFFFFF)
              const name = message.getString(1)
              this.game.processServerEnter(color, name)
              // start sending when opponent enters
              this.lastKeySent = -1
            })
            connection.addMessageCallback('win', () => this.game.processServerWin())
            connection.addMessageCallback('lose', () => this.game.processServerLose())
            connection.addMessageCallback('nextRound', message => this.game.processServerRoundStart(message.getBoolean(0)))
            connection.addMessageCallback('t', message => {
              // ping times
              this.game.processServerPingTimes(
                message.getUInt(0),
                message.getUInt(1),
              )
            })
            connection.addMessageCallback('p', message => connection.sendMessage(message)) // ping probe

            // send init
            let name = this.game.getUserName()
            let color = this.game.getUserColor()
            connection.send('init', color, name)
          }, errorHandler)
        }

        joinMatchMakingRoom()
      },
      errorHandler,
    )

    this.game.processServerConnect()
  }

  disconnect (): void {
    if (this.connection) {
      this.state = ReadyState.Disconnecting
      this.connection.addDisconnectCallback(() => this.disconnected())
      this.connection.disconnect()
    }
  }

  private disconnected (): void {
    this.state = ReadyState.Disconnected
    this.connection = undefined
    this.game.processServerDisconnect()
  }

  public update (): void {
    if (!this.connection) return

    // don't bother to send keep-alives

    if (!this.game.shouldSendNetworkUpdate()) return

    const keyFlags = this.game.getKeyFlags()
    if (this.lastKeySent !== keyFlags) {
      this.connection.send('k', keyFlags)
    }
  }
}
