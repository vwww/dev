import { $idA, formatHexColor } from '../../../util'
import { CanvasGame } from '../../common/ui/CanvasGame'
import { ISlimeUICallbacks } from './IConnectorCallbacks'
import { SlimeInput } from './SlimeInput'

export class SlimeUI {
  private $canvas = $idA<HTMLCanvasElement>('gameCanvas')
  private $pName = $idA<HTMLInputElement>('pName')
  private $pColor = $idA<HTMLInputElement>('pColor')
  private $connect = $idA('connect')
  private $flipP1 = $idA<HTMLInputElement>('flipP1')
  private $notFlipP1 = $idA<HTMLInputElement>('notFlipP1')
  private $background = $idA<HTMLInputElement>('background')
  private $devMode = $idA<HTMLInputElement>('devMode')
  private $fullscreen = $idA<HTMLInputElement>('fullscreen')

  private canvasGame = new CanvasGame(this.$canvas, dt => this.game.processUIupdate(dt))
  private input = new SlimeInput()

  constructor (private game: ISlimeUICallbacks) {
    // event listeners
    this.input.attachListeners(window)
    $idA('connect').addEventListener('click', () => this.game.processUIconnect())
    $idA('fullscreen').addEventListener('click', () => {
      // checkbox for fullscreen will be invisible until user exits
      this.$fullscreen.checked = false
      this.canvasGame.getCanvas().requestFullscreen().then().catch()
    })
    this.$pName.addEventListener('change', () => {
      const name = this.$pName.value
      this.game.processUIchangeName(name)
      window.localStorage.n = name
    })
    this.$pColor.addEventListener('change', () => {
      const color = this.$pColor.value
      this.game.processUIchangeColor(formatHexColor(parseInt(color, 16)))
      window.localStorage.c = color
    })
    this.$flipP1.addEventListener('change', () => {
      const on = this.$flipP1.checked
      this.game.processUIchangeFlipP1(on)
      window.localStorage.f = on ? '1' : '0'
    })
    this.$notFlipP1.addEventListener('change', () => {
      const on = !this.$notFlipP1.checked
      this.game.processUIchangeFlipP1(on)
      window.localStorage.f = on ? '1' : '0'
    })
    this.$background.addEventListener('change', () => {
      const on = this.$background.checked
      this.game.processUIchangeFancyBackground(on)
      window.localStorage.b = on ? '1' : '0'
    })
    this.$devMode.addEventListener('change', () => {
      const on = this.$devMode.checked
      this.game.processUIchangeDrawDev(on)
      window.localStorage.d = on ? '1' : '0'
    })
  }

  getContext () { return this.canvasGame.getContext() }

  getUserName (): string { return this.$pName.value }
  getUserColor (): number {
    let color = parseInt(this.$pColor.value, 16)
    return Number.isNaN(color) ? 0x77ff00 : color & 0xFFFFFF
  }
  setUserName (name: string): void { this.$pName.value = name }
  setUserColor (color: string): void { this.$pColor.value = color }

  getInputManager () { return this.input }

  restoreSettings (): void {
    if (window.localStorage.n) this.game.processUIchangeName((this.$pName.value = window.localStorage.n))
    if (window.localStorage.c) this.game.processUIchangeColor(formatHexColor((this.$pColor.value = window.localStorage.c)))
    if (window.localStorage.f === '1') this.game.processUIchangeFlipP1((this.$flipP1.checked = true))
    if (window.localStorage.b === '1') this.game.processUIchangeFancyBackground((this.$background.checked = true))
    if (window.localStorage.d === '1') this.game.processUIchangeDrawDev((this.$devMode.checked = true))
  }

  processServerConnect () {
    this.$pName.disabled = true
    this.$pColor.disabled = true
    this.$connect.innerHTML = 'Disconnect'
    this.$connect.className = 'btn btn-danger'
  }

  processServerDisconnect () {
    this.$pName.disabled = false
    this.$pColor.disabled = false
    this.$connect.innerHTML = 'Connect'
    this.$connect.className = 'btn btn-primary'
  }
}
