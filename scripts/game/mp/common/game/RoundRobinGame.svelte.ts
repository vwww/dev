import { ByteReader } from './ByteReader'
import { CommonGame } from './CommonGame.svelte'
import { type TurnBasedClient, TurnBasedGame, TurnC2S, TurnS2C } from './TurnBasedGame.svelte'

export interface RRTurnClient extends TurnBasedClient {
}

export interface RRTurnPlayerInfo {
  owner: number
}

export interface RRTurnDiscInfo {
  ownerName: string
}

export const enum RRTurnS2C {
  PLAYER_ELIMINATE = TurnS2C.NUM,
  PLAYER_PRIVATE_INFO,
  NUM
}

export const enum RRTurnC2S {
  NUM = TurnC2S.NUM,
}

export abstract class RRTurnGame<
  C extends RRTurnClient,
  P extends RRTurnPlayerInfo,
  D extends RRTurnDiscInfo,
  G>
  extends TurnBasedGame<C, G> {
  protected static override readonly DEFAULT_PLAYER: RRTurnClient = TurnBasedGame.DEFAULT_PLAYER

  protected static DEFAULT_PLAYER_INFO: RRTurnPlayerInfo = {
    owner: -1,
  }

  protected static DEFAULT_DISC_INFO: RRTurnDiscInfo = {
    ownerName: '',
  }

  public playerInfo = $state([] as P[])
  public playerDiscInfo = $state([] as D[])

  getClientFromPlayer (p?: RRTurnPlayerInfo): C | undefined {
    return p && this.clients.get(p.owner)
  }

  getNameFromPlayer (player?: RRTurnPlayerInfo, pn?: number): string {
    return player ? CommonGame.formatPlayerName(this.getClientFromPlayer(player), player.owner) : `<unknown${pn === undefined ? '' : (' pn#' + pn)}>`
  }

  playerIsMe (player?: RRTurnPlayerInfo): boolean {
    return !!this.getClientFromPlayer(player)?.isMe
  }

  getPlayerInfo (pn: number): P | undefined {
    const playerInfos = this.playerInfo
    return (0 <= pn && pn <= playerInfos.length) ? playerInfos[pn] : undefined
  }

  protected updatePlayerInfo (): void {
    this.playerInfo = this.playerInfo
  }

  protected override processRoundStart (m: ByteReader): void {
    const playerInfo: P[] = []
    for (let i = 0; i <= this.clients.size; i++) {
      const owner = m.getInt()
      if (owner < 0) break

      const p = this.makePlayerInfo()
      p.owner = owner
      playerInfo.push(p)
    }
    this.playerInfo = playerInfo
    this.playerDiscInfo = []

    this.processRoundStartInfo(m)
  }

  protected override processWelcomeGame2 (m: ByteReader): void {
    this.processPlayerInfos(m)
    this.processDiscInfos(m)
    this.processRoundInfo(m)
  }

  protected processEndTurn (m: ByteReader): void {
    this.setTimer(this.processEndTurn2(m) ?? this.ROUND_TIME)

    if (this.playerInfo.length) {
      this.playerInfo.push(this.playerInfo.shift()!)
    }
  }

  protected abstract processEndTurn2 (m: ByteReader): number | undefined

  protected abstract processRoundStartInfo (m: ByteReader): void
  protected abstract processRoundInfo (m: ByteReader): void
  protected abstract processPlayerInfo (m: ByteReader, p: P): void
  protected abstract processDiscInfo (m: ByteReader, d: D): void

  protected override processMessage3 (type: number, m: ByteReader): boolean {
    switch (type) {
      case RRTurnS2C.PLAYER_ELIMINATE: {
        // can't imply from unspectate/leave/endTurn, as
        // private info of leaving players might need to be revealed
        const pNum = m.getInt()
        const playerInfo = this.getPlayerInfo(pNum)
        if (!playerInfo) {
          // should not happen
          this.room?.disconnect()
          break
        }

        const newDiscInfo = this.makeDiscInfo()
        const c = this.clients.get(playerInfo.owner)
        newDiscInfo.ownerName = CommonGame.formatPlayerName(c, playerInfo.owner)

        const isFirst = this.processEliminate(m, newDiscInfo, playerInfo)
        this.playerInfo.splice(pNum, 1)
        if (isFirst) {
          // TODO
        } else {
          this.playerDiscInfo.push(newDiscInfo)
        }
        break
      }
      case RRTurnS2C.PLAYER_PRIVATE_INFO:
        this.processPrivateInfo(m)
        break
      default:
        return false
    }
    return true
  }

  protected abstract processEliminate (m: ByteReader, d: D, p: P): boolean

  protected abstract processPrivateInfo (m: ByteReader): void

  protected abstract makePlayerInfo (): P
  protected abstract makeDiscInfo (): D

  private processPlayerInfos (m: ByteReader): void {
    const playerInfo: P[] = []
    for (let i = 0; i <= this.clients.size; i++) {
      const owner = m.getInt()
      if (owner < 0) break

      const p = this.makePlayerInfo()
      p.owner = owner
      this.processPlayerInfo(m, p)
      playerInfo.push(p)
    }
    this.playerInfo = playerInfo
  }

  private processDiscInfos (m: ByteReader): void {
    const discInfo: D[] = []
    for (let i = 0; i <= this.clients.size; i++) {
      const ownerName = m.getString(32)
      if (!ownerName) break

      const p = this.makeDiscInfo()
      p.ownerName = ownerName
      this.processDiscInfo(m, p)
      discInfo.push(p)
    }
    this.playerDiscInfo = discInfo
  }
}
