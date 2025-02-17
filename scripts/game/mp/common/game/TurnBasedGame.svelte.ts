import { ByteReader } from './ByteReader'
import { ByteWriter } from './ByteWriter'
import { type BaseClient, CommonC2S, CommonGame, CommonS2C } from './CommonGame.svelte'

export interface TurnBasedClient extends BaseClient {
  ready: boolean
  inRound: boolean // TODO remove (not used?)
}

export const enum TurnS2C {
  ROUND_WAIT = CommonS2C.NUM,
  ROUND_INTERM,
  ROUND_START,
  READY,
  MOVE_CONFIRM,
  END_ROUND,
  END_TURN,
  NUM
}

export const enum TurnC2S {
  READY = CommonC2S.NUM,
  MOVE,
  MOVE_END,
  NUM
}

export const enum GameState {
  WAITING,
  INTERMISSION,
  ACTIVE,
}

export abstract class TurnBasedGame<C extends TurnBasedClient, G> extends CommonGame<C, G> {
  protected static override readonly DEFAULT_PLAYER: TurnBasedClient = {
    ...CommonGame.DEFAULT_PLAYER,
    ready: false,
    inRound: false,
  }

  public isReady = $state(false)

  public inRound = $state(false)

  public roundState = $state(0)
  public roundTimerStart = $state(0)
  public roundTimerEnd = $state(0)

  public roundPlayers = $state([] as C[])
  public roundPlayerQueue = $state([] as C[])

  protected INTERMISSION_TIME = 30000
  protected ROUND_TIME = 20000

  sendReady (ready: boolean): void {
    this.room?.send(new ByteWriter()
      .putInt(TurnC2S.READY)
      .putBool(ready)
      .toArray()
    )
  }

  sendMoveEnd (): void {
    this.room?.send(new ByteWriter()
      .putInt(TurnC2S.MOVE_END)
      .toArray()
    )
  }

  protected roundWait (): void {
    this.roundState = GameState.WAITING
    this.unsetReady()
  }

  protected roundIntermission (remain: number): void {
    this.roundState = GameState.INTERMISSION
    this.setTimer(remain)
    this.unsetReady()
    this.isReady = false
  }

  protected roundStart (remain: number): void {
    this.roundState = GameState.ACTIVE
    this.setTimer(remain)
    this.unsetReady()
  }

  protected roundSetPlayers (playerList: C[]): void {
    this.roundPlayers = playerList
  }

  protected roundSetPlayerQueue (playerList: C[]): void {
    this.roundPlayerQueue = playerList
  }

  protected setTimer (remain: number): void {
    this.roundTimerStart = Date.now()
    this.roundTimerEnd = Date.now() + remain
  }

  protected processWelcomeGame (m: ByteReader): void {
    const roundState = m.getInt()
    if (roundState === 0) {
      this.roundWait()
    } else if (roundState === 1) {
      this.roundIntermission(m.getInt())
      for (let i = 0; i <= this.clients.size; i++) {
        const cn = m.getInt()
        if (cn < 0) break
        const p = this.clients.get(cn)
        if (!p) continue
        p.ready = true
      }
    } else if (roundState === 2) {
      this.roundStart(m.getInt())
    }

    const curRoundPlayers = []
    for (let i = 0; i <= this.clients.size; i++) {
      const cn = m.getInt()
      if (cn < 0) break
      const p = this.clients.get(cn)
      if (!p) continue
      p.inRound = true
      curRoundPlayers.push(p)
    }
    this.roundSetPlayers(curRoundPlayers)

    const curRoundQueue = []
    for (let i = 0; i <= this.clients.size; i++) {
      const cn = m.getInt()
      if (cn < 0) break
      const p = this.clients.get(cn)
      if (!p) continue
      curRoundQueue.push(p)
    }
    this.roundSetPlayerQueue(curRoundQueue)

    this.processWelcomeGame2(m)
  }

  protected processWelcomeGame2 (m: ByteReader): void { /* ignore */ }

  protected playerActivated (player: C): void {
    this.roundPlayerQueue.push(player)
  }

  protected playerDeactivated (player: C): void {
    this.roundPlayers = this.roundPlayers.filter((p) => p !== player)
    this.roundPlayerQueue = this.roundPlayerQueue.filter((p) => p !== player)
    player.inRound = false
    if (player.isMe) this.inRound = false
  }

  protected processMessage2 (type: number, m: ByteReader): boolean {
    switch (type) {
      case TurnS2C.ROUND_WAIT:
        this.roundWait()
        break
      case TurnS2C.ROUND_INTERM:
        this.roundIntermission(this.INTERMISSION_TIME)
        break
      case TurnS2C.ROUND_START: {
        const curRoundPlayers = []
        for (const p of this.clients.values()) {
          p.inRound = false
        }
        for (let i = 0; i <= this.clients.size; i++) {
          const cn = m.getInt()
          if (cn < 0) break
          const p = this.clients.get(cn)
          if (!p) continue
          p.inRound = true
          curRoundPlayers.push(p)
        }
        this.inRound = this.clients.get(this.myCn)?.inRound ?? false

        this.roundSetPlayers(curRoundPlayers)
        this.roundSetPlayerQueue([])
        this.roundStart(this.ROUND_TIME)
        this.processRoundStart(m)
        break
      }
      case TurnS2C.READY: {
        const cn = m.getInt()
        const ready = m.getBool()
        const p = this.clients.get(cn)
        if (p) {
          p.ready = ready
          if (cn === this.myCn) {
            this.isReady = ready
          }
          this.updatePlayers(true)
        }
        break
      }
      case TurnS2C.MOVE_CONFIRM:
        this.processMoveConfirm(m)
        break
      case TurnS2C.END_TURN:
        this.processEndTurn(m)
        break
      case TurnS2C.END_ROUND:
        this.processEndRound(m)
        break
      default:
        return this.processMessage3(type, m)
    }
    return true
  }

  protected abstract processMoveConfirm (m: ByteReader): void
  protected processRoundStart (m: ByteReader): void { /* ignore */ }
  protected abstract processEndTurn (m: ByteReader): void
  protected abstract processEndRound (m: ByteReader): void

  protected processMessage3 (type: number, m: ByteReader): boolean { return false }

  private unsetReady (): void {
    for (const c of this.clients.values()) {
      c.ready = false
    }
  }
}
