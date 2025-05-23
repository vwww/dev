import type { ByteReader } from './ByteReader'
import { formatClientName } from './common'
import { TurnBasedClient, TurnBasedGame } from './TurnBasedGame.svelte'

export abstract class RoundRobinClient extends TurnBasedClient {}

export class RRTurnPlayerInfo {
  owner = $state(-1)
}

export class RRTurnDiscInfo {
  isMe?: boolean
  ownerName = ''
}

export abstract class RoundRobinGame<
  C extends RoundRobinClient,
  P extends RRTurnPlayerInfo,
  D extends RRTurnDiscInfo,
  H> extends TurnBasedGame<C, H> {
  playerInfo: P[] = $state([])
  playerDiscInfo: D[] = $state([])

  abstract PlayerInfoType: { new(): P }
  abstract PlayerDiscType: { new(): D }

  formatPlayerName (player?: RRTurnPlayerInfo, pn?: number): string {
    if (!player) {
      return `<unknown${pn === undefined ? '' : (' pn#' + pn)}>`
    }
    return formatClientName(this.clients[player.owner], player.owner)
  }

  playerIsMe (player?: RRTurnPlayerInfo): boolean {
    return player?.owner === this.localClient.cn
  }

  protected abstract processRoundInfo (m: ByteReader): void
  protected override processWelcomeGame (m: ByteReader): void {
    super.processWelcomeGame(m)

    this.processPlayerInfos(m)
    this.processDiscInfos(m)
    this.processRoundInfo(m)
  }

  protected abstract processPlayerInfo (m: ByteReader, p: P): void
  private processPlayerInfos (m: ByteReader): void {
    const playerInfo: P[] = []
    for (let i = 0; i <= this.clients.length; i++) {
      const owner = m.getCN()
      if (owner < 0) break

      const p = new this.PlayerInfoType()
      p.owner = owner

      this.processPlayerInfo(m, p)

      playerInfo.push(p)
    }
    this.playerInfo = playerInfo
  }

  protected abstract processDiscInfo (m: ByteReader, d: D): void
  private processDiscInfos (m: ByteReader): void {
    const discInfo: D[] = []
    for (let i = 0; i <= this.clients.length; i++) {
      const ownerName = m.getString(32)
      if (!ownerName) break

      const p = new this.PlayerDiscType()
      p.ownerName = ownerName

      this.processDiscInfo(m, p)

      discInfo.push(p)
    }
    this.playerDiscInfo = discInfo
  }

  protected abstract processRoundStartInfo (m: ByteReader): void
  protected override processRoundStart (m: ByteReader): void {
    super.processRoundStart(m)

    const playerInfo: P[] = []
    for (let i = 0; i <= this.clients.length; i++) {
      const owner = m.getCN()
      if (owner < 0) break

      const p = new this.PlayerInfoType()
      p.owner = owner
      playerInfo.push(p)
    }
    this.playerInfo = playerInfo
    this.playerDiscInfo = []

    this.processRoundStartInfo(m)
  }

  protected abstract eliminatePlayer (m: ByteReader, d: D, p: P, C?: C): void
  protected processEliminate (m: ByteReader): void {
    // can't imply hand from unspectate/leave/endTurn, as
    // private info of leaving players might need to be revealed
    const pNum = m.getInt()
    const playerInfo = this.playerInfo[pNum]
    if (!playerInfo) throw new Error('invalid eliminate pn ' + pNum)

    const newDiscInfo = new this.PlayerDiscType()
    const c = this.clients[playerInfo.owner]
    newDiscInfo.ownerName = formatClientName(c, playerInfo.owner)
    newDiscInfo.isMe = c === this.localClient

    this.eliminatePlayer(m, newDiscInfo, playerInfo, c)

    this.playerInfo.splice(pNum, 1)
    this.playerDiscInfo.push(newDiscInfo) // TODO playerDiscInfo index
  }

  protected nextTurn (): void {
    if (this.playerInfo.length) {
      this.playerInfo.push(this.playerInfo.shift()!)
    }
  }
}
