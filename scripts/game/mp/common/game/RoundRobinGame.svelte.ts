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
  turnIndex = $state(0)
  playerDiscInfo: D[] = $state([])
  discIndex = 0

  canMove = $derived(this.playing && this.playerIsMe(this.playerInfo[this.turnIndex]))

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

    if ((this.playerInfo = playerInfo).length) {
      this.turnIndex = m.getInt()

      if (this.turnIndex < 0 || this.turnIndex >= playerInfo.length) {
        throw new Error('bad turnIndex')
      }
    } else {
      this.turnIndex = 0
    }
  }

  protected abstract processDiscInfo (m: ByteReader, d: D): void
  private processDiscInfos (m: ByteReader): void {
    const discInfo: D[] = []
    for (let i = 0; i <= this.clients.length; i++) {
      const ownerName = m.getString(20)
      if (!ownerName) break
      const ownerNum = m.getCN()

      const p = new this.PlayerDiscType()
      p.ownerName = `${ownerName} (${ownerNum})`

      this.processDiscInfo(m, p)

      discInfo.push(p)
    }
    if ((this.playerDiscInfo = discInfo).length) {
      this.discIndex = m.getInt()
      if (this.discIndex < 0 || this.discIndex > this.playerDiscInfo.length) {
        throw new Error('bad discIndex')
      }
    } else {
      this.discIndex = 0
    }
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
    this.turnIndex = 0
    this.discIndex = 0

    this.processRoundStartInfo(m)
  }

  protected abstract eliminatePlayer (m: ByteReader, d: D, pn: number, p: P, c: C, early: boolean): boolean
  protected processEliminateBase (m: ByteReader, early: boolean): void {
    // can't imply hand from unspectate/leave/endTurn, as
    // private info of leaving players might need to be revealed
    const pNum = m.getInt()
    const playerInfo = this.playerInfo[pNum]
    if (!playerInfo) throw new Error('invalid eliminate pn ' + pNum)

    const newDiscInfo = new this.PlayerDiscType()
    const c = this.clients[playerInfo.owner]
    if (!c) throw new Error(`invalid owner ${playerInfo.owner} of pn ${pNum}`)
    newDiscInfo.ownerName = formatClientName(c, playerInfo.owner)
    newDiscInfo.isMe = c === this.localClient

    const insertTop = this.eliminatePlayer(m, newDiscInfo, pNum, playerInfo, c, early)

    this.playerInfo.splice(pNum, 1)
    this.playerDiscInfo.splice(this.discIndex, 0, newDiscInfo)

    if (insertTop) {
      this.discIndex++
    }
  }
  protected processEliminate (m: ByteReader): void {
    this.processEliminateBase(m, false)
  }
  protected processEliminateEarly (m: ByteReader): void {
    this.processEliminateBase(m, true)
  }

  protected nextTurn (): void {
    if (++this.turnIndex == this.playerInfo.length) {
      this.turnIndex = 0
    }
  }
}
