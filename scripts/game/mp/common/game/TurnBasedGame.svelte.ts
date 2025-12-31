import type { ByteReader } from './ByteReader'
import { MAX_PLAYERS } from './common'
import { CommonClient, CommonGame } from './CommonGame.svelte'

export const enum GameState {
  WAITING,
  INTERMISSION,
  ACTIVE,
}

export abstract class TurnBasedClient extends CommonClient {
  ready = $state(false)
  inRound = $state(false)

  override readWelcome (m: ByteReader): void {
    super.readWelcome(m)

    this.ready = false
    this.inRound = false
  }
}

const MAX_HISTORY_LEN = 100

export abstract class TurnBasedGame<C extends TurnBasedClient, H> extends CommonGame<C> {
  abstract INTERMISSION_TIME: number
  abstract ROUND_TIME: number

  roundState = $state(GameState.WAITING)
  roundTimerStart = $state(0)
  roundTimerEnd = $state(0)

  playing = $derived(this.localClient.active && this.roundState == GameState.ACTIVE && this.localClient.inRound)

  roundPlayers: C[] = $state([])
  roundPlayerQueue: C[] = $state([])

  pastGames: H[] = $state([])

  addHistory (history: H): void {
    if (this.pastGames.length >= MAX_HISTORY_LEN)
      this.pastGames.pop()
    this.pastGames.unshift(history)
  }

  clearHistory (): void {
    this.pastGames = []
  }

  protected processWelcomeGame (m: ByteReader): void {
    const roundState = m.getInt()
    if (roundState === 0) {
      this.roundWait()
    } else if (roundState === 1) {
      this.roundIntermission(m.getInt(), this.INTERMISSION_TIME)
      for (let i = 0; i <= MAX_PLAYERS; i++) {
        const cn = m.getCN()
        if (cn < 0) break
        const p = this.clients[cn]
        if (!p) throw new Error('invalid welcome round ready cn ' + cn)
        p.ready = true
      }
    } else if (roundState === 2) {
      this.roundStart(m.getInt(), this.ROUND_TIME)
    }

    const curRoundPlayers = []
    for (let i = 0; i <= MAX_PLAYERS; i++) {
      const cn = m.getCN()
      if (cn < 0) break
      const p = this.clients[cn]
      if (!p) throw new Error('invalid welcome round player cn ' + cn)
      p.inRound = true
      curRoundPlayers.push(p)
    }
    this.roundPlayers = curRoundPlayers

    const curRoundQueue = []
    for (let i = 0; i <= MAX_PLAYERS; i++) {
      const cn = m.getCN()
      if (cn < 0) break
      const p = this.clients[cn]
      if (!p) throw new Error('invalid welcome round queue cn ' + cn)
      curRoundQueue.push(p)
    }
    this.roundPlayerQueue = curRoundQueue
  }

  protected processRoundWait (m: ByteReader): void {
    this.roundWait()
  }

  protected processRoundInterm (m: ByteReader): void {
    this.roundIntermission(this.INTERMISSION_TIME)
  }

  protected processRoundStart (m: ByteReader): void {
    this.unsetInRound()
    const curRoundPlayers = []
    for (let i = 0; i <= MAX_PLAYERS; i++) {
      const cn = m.getCN()
      if (cn < 0) break
      const p = this.clients[cn]
      if (!p) throw new Error('invalid round start player cn ' + cn)
      p.inRound = true
      curRoundPlayers.push(p)
    }

    this.roundPlayers = curRoundPlayers
    this.roundPlayerQueue = []
    this.roundStart(this.ROUND_TIME)
  }

  protected processReady (m: ByteReader): void {
    const cn = m.getCN()
    const p = this.clients[cn]
    if (!p) throw new Error('invalid ready cn ' + cn)

    p.ready = !p.ready
  }

  protected abstract processEndRound (m: ByteReader): void

  protected roundWait (): void {
    this.roundState = GameState.WAITING
    this.unsetReady()
  }

  protected roundIntermission (remain: number, base?: number): void {
    this.roundState = GameState.INTERMISSION
    this.setTimer(remain, base)
    this.unsetReady()
  }

  protected roundStart (remain: number, base?: number): void {
    this.roundState = GameState.ACTIVE
    this.setTimer(remain, base)
    this.unsetReady()
  }

  protected setTimer (remain: number, base = remain): void {
    const end = Date.now() + remain
    this.roundTimerStart = end - Math.max(base, remain)
    this.roundTimerEnd = end
  }

  protected unsetReady (): void {
    this.clients.forEach((c) => c.ready = false)
  }

  protected unsetInRound (): void {
    this.clients.forEach((c) => c.inRound = false)
  }

  protected playerActivated (player: C): void {
    this.roundPlayerQueue.push(player)
  }

  protected playerDeactivated (player: C): void {
    this.roundPlayers = this.roundPlayers.filter((p) => p !== player)
    this.roundPlayerQueue = this.roundPlayerQueue.filter((p) => p !== player)
    player.inRound = false
  }
}
