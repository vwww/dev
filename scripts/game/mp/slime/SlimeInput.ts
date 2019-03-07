import { KeyInputManager } from '@gmc/ui/KeyInputManager'
import { MouseInputManager } from '@gmc/ui/MouseInputManager'

export class SlimeInput {
  private readonly keyManager = new KeyInputManager()
  private keyFlags = 0
  private keyFlagsFlip = 0

  private readonly mouseManager = new MouseInputManager()

  getKeyFlags (flipP1: boolean): number {
    return flipP1 ? this.keyFlagsFlip : this.keyFlags
  }

  getMouse (): MouseInputManager { return this.mouseManager }

  attachListeners (canvas: HTMLCanvasElement): void {
    this.keyManager.attachListeners(window, () => this.updateKeyFlags())
    this.mouseManager.attachListeners(canvas)
  }

  private KeyL (): boolean { return this.keyManager.isOn(37) || this.keyManager.isOn(65) }
  private KeyU (): boolean { return this.keyManager.isOn(38) || this.keyManager.isOn(87) }
  private KeyR (): boolean { return this.keyManager.isOn(39) || this.keyManager.isOn(68) }

  private updateKeyFlags (): void {
    const L = this.KeyL() ? 1 : 0
    const R = this.KeyR() ? 1 : 0
    const U = this.KeyU() ? 1 : 0
    this.keyFlags = L | (R << 1) | (U << 2)
    this.keyFlagsFlip = R | (L << 1) | (U << 2)
  }
}
