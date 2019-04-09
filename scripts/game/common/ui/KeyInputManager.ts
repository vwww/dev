export class KeyInputManager {
  keys: Record<number, true> = {}

  on (key: number) {
    this.keys[key] = true
  }

  off (key: number) {
    delete this.keys[key]
  }

  isOn (key: number): boolean {
    return key in this.keys
  }

  attachListeners (target: Window, extraCallback: () => void): void {
    target.addEventListener('keydown', event => {
      this.on(event.keyCode)
      extraCallback()
    })
    target.addEventListener('keyup', event => {
      this.off(event.keyCode)
      extraCallback()
    })
  }
}
