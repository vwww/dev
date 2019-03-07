import { clamp } from '@/util'
import { isNearWin, isWin } from '@gc/t3/game'
import { ByteReader } from '@gmc/game/ByteReader'
import { filterChat } from '@gmc/game/CommonGame.svelte'
import { TwoPlayerTurnGame } from '@gmc/game/TwoPlayerTurnGame.svelte'
import type { BaseGameRoom } from '@gmc/remote/BaseGameRoom'

import { defaultMode, type T3Mode } from './gamemode'

const enum S2C {
  WELCOME,
  JOIN,
  LEAVE,
  RESET,
  RENAME,
  PING,
  PING_TIME,
  CHAT,
  ACTIVE,
  ROUND_WAIT,
  ROUND_INTERM,
  ROUND_START,
  READY,
  END_ROUND,
  MOVE_CONFIRM,
  END_TURN,
  OFFER_DRAW,
}

const enum C2S {
  RESET,
  RENAME,
  PONG,
  CHAT,
  ACTIVE,
  READY,
  MOVE,
  MOVE_END,
  FORFEIT,
  OFFER_DRAW,
  REJECT_DRAW,
}

const MAX_TURNS = 9

export class T3Game extends TwoPlayerTurnGame {
  mode: T3Mode = $state(defaultMode())

  boardState = $state(0)
  boardBad = $state(0)
  moveHistory = $state([] as number[])

  get ROUND_TIME () { return this.mode.optTurnTime }
  INTERMISSION_TIME = 30000

  enterGame (room: BaseGameRoom, name: string): void {
    this.setupGame(room)
    this.sendf('is', this.PROTOCOL_VERSION, name)
  }

  sendReset (): void { this.sendf('i', C2S.RESET) }
  sendRename (newName: string): void { this.sendf('is', C2S.RENAME, newName) }
  sendPong (t: number): void { this.sendf('i2', C2S.PONG, t) }
  sendChat (s: string, flags: number, target = -1): void { this.sendf('i3s', C2S.CHAT, flags, target, filterChat(s)) }
  sendActive (): void { this.sendf('i', C2S.ACTIVE) }
  sendReady (): void { this.sendf('i', C2S.READY) }
  sendMove (n: number): void { this.sendf('i2', C2S.MOVE, n) }
  sendMoveEnd (): void { this.sendf('i', C2S.MOVE_END) }
  sendResign (): void { this.sendf('i', C2S.FORFEIT) }
  sendDrawOffer (): void { this.sendf('i', C2S.OFFER_DRAW) }
  sendDrawReject (): void { this.sendf('i', C2S.REJECT_DRAW) }

  MESSAGE_HANDLERS: Record<number, (this: this, m: ByteReader) => void> = {
    [S2C.WELCOME]: this.processWelcome,
    [S2C.JOIN]: this.processJoin,
    [S2C.LEAVE]: this.processLeave,
    [S2C.RESET]: this.processReset,
    [S2C.RENAME]: this.processRename,
    [S2C.PING]: this.processPing,
    [S2C.PING_TIME]: this.processPingTime,
    [S2C.CHAT]: this.processChat,
    [S2C.ACTIVE]: this.processActive,
    [S2C.ROUND_WAIT]: this.processRoundWait,
    [S2C.ROUND_INTERM]: this.processRoundInterm,
    [S2C.ROUND_START]: this.processRoundStart,
    [S2C.READY]: this.processReady,
    [S2C.END_ROUND]: this.processEndRound,
    [S2C.MOVE_CONFIRM]: this.processMoveConfirm,
    [S2C.END_TURN]: this.processEndTurn,
    [S2C.OFFER_DRAW]: this.processOfferDraw,
  }

  protected processWelcomeMode (m: ByteReader): void {
    this.mode.optTurnTime = m.getInt()
    const modeFlags = m.get()
    this.mode.optInverted = !!(modeFlags & (1 << 0))
    this.mode.optChecked = !!(modeFlags & (1 << 1))
    this.mode.optQuick = !!(modeFlags & (1 << 2))
  }

  protected processMoveConfirm (m: ByteReader) {
    m.getInt() // pendingMoveAck
  }

  private processEndTurn (m: ByteReader): void {
    const move = clamp(m.getInt(), 0, 9 - 1)
    this.applyMove(move)

    this.nextTurn()
    this.setTimer(this.mode.optTurnTime)
  }

  protected processRoundInfo (m: ByteReader): void {
    this.reset()
    for (let i = 0; i <= MAX_TURNS; i++) {
      this.ply = i // applyMove needs correct ply
      const move = m.getInt()
      if (move < 0) {
        break
      }
      this.applyMove(move)
    }
  }

  protected processRoundStartInfo (m: ByteReader): void {
    this.reset()
  }

  private reset (): void {
    this.boardState = 0
    this.boardBad = 0
    this.moveHistory = []
  }

  private applyMove (move: number): void {
    const mark = 1 << (this.ply & 1)

    const board = this.boardState | (mark << (move << 1))
    this.boardState = board
    this.boardBad = calcBoardBadMoves(this.mode, board, this.ply + 1)

    this.moveHistory.push(move)
  }
}

function calcBoardBadMoves (mode: T3Mode, board: number, ply: number): number {
  let bad = 0
  if (mode.optChecked) {
    const parity = ply & 1
    const mark = 1 << parity
    for (let i = 0; i < 9; i++) {
      const boardNext = board | (mark << (i << 1))
      if (mode.optInverted ? isWin(boardNext, !!parity) : isNearWin(boardNext, !parity)) {
        bad |= 1 << i
      }
    }
  }
  return bad
}
