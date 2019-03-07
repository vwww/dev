import { PokeInfo } from './PokeInfo'
import { PokeSource } from './PokeSource'

declare const Simperium: any

export default class PokeSourceSimperium implements PokeSource {
  private simperium: any

  constructor (app = 'brake-foods-bc7', token = 'ce4832ce12e24ee6860886d9b4567b12') {
    this.simperium = new Simperium(app, { token })
  }

  onInfoUpdate (updateInfo: (pokes: number, ticks: number) => void): () => void {
    // this callback is not supported

    return () => { /* do nothing */ }
  }

  onPokeUpdate (updatePoke: (pokes: Record<string, PokeInfo>) => void): () => void {
    const bucket = this.simperium.bucket('stats')
    bucket.on('notify', function (id: string, data: any) {
      // console.log(id + ' was updated to')
      // console.log(data)
      if (id === 'p') updatePoke(data)
    })
    bucket.start()

    // unsubscription is not supported
    return () => { /* do nothing */ }
  }
}
