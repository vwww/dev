import { KeyInputManager } from '../../common/ui/KeyInputManager'
import { MouseInputManager } from '../../common/ui/MouseInputManager'

export class SlimeInput {
  private keyManager = new KeyInputManager()
  private keyFlags = 0
  private keyFlagsFlip = 0

  private mouseManager = new MouseInputManager()

  getKeyFlags (flipP1: boolean) {
    return flipP1 ? this.keyFlagsFlip : this.keyFlags
  }

  getMouse () { return this.mouseManager }

  private KeyL (): boolean { return this.keyManager.isOn(37) || this.keyManager.isOn(65) }
  private KeyU (): boolean { return this.keyManager.isOn(38) || this.keyManager.isOn(87) }
  private KeyR (): boolean { return this.keyManager.isOn(39) || this.keyManager.isOn(68) }

  private updateKeyFlags () {
    const L = this.KeyL() ? 1 : 0
    const R = this.KeyR() ? 1 : 0
    const U = this.KeyU() ? 1 : 0
    this.keyFlags = (L | 0) | (R << 1) | (U << 2)
    this.keyFlagsFlip = (R | 0) | (L << 1) | (U << 2)
  }

  attachListeners (target: Window): void {
    this.keyManager.attachListeners(target, () => this.updateKeyFlags())
  }
}
