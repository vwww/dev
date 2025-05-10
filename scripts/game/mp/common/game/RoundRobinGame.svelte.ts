import { formatClientName } from './common'
import { TurnBasedClient, TurnBasedGame } from './TurnBasedGame.svelte'

export class RoundRobinClient extends TurnBasedClient {}

export class RRTurnPlayerInfo {
  owner = $state(-1)
}

export class RRTurnDiscInfo {
  ownerName = ''
}

export abstract class RoundRobinGame<
  C extends RoundRobinClient,
  P extends RRTurnPlayerInfo,
  D extends RRTurnDiscInfo,
  H> extends TurnBasedGame<C, H> {
  playerInfo: P[] = $state([])
  playerDiscInfo: D[] = $state([])

  formatPlayerName (player?: RRTurnPlayerInfo, pn?: number): string {
    if (!player) {
      return `<unknown${pn === undefined ? '' : (' pn#' + pn)}>`
    }
    return formatClientName(this.clients[player.owner], player.owner)
  }

  playerIsMe (player?: RRTurnPlayerInfo): boolean {
    return player?.owner === this.localClient.cn
  }
}
