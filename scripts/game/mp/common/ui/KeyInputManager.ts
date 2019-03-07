export class KeyInputManager {
  keys = new Set<number>()

  on (key: number): void {
    this.keys.add(key)
  }

  off (key: number): void {
    this.keys.delete(key)
  }

  isOn (key: number): boolean {
    return this.keys.has(key)
  }

  attachListeners (target: Window, extraCallback: () => void): void {
    target.addEventListener('keydown', (event) => {
      this.on(event.keyCode)
      extraCallback()
    })
    target.addEventListener('keyup', (event) => {
      this.off(event.keyCode)
      extraCallback()
    })
  }
}
