import type { PokeInfo } from './PokeInfo'
import type { PokeSource } from './PokeSource'

import { deleteApp, type FirebaseApp, type FirebaseOptions, initializeApp } from 'firebase/app'
import { getDatabase, ref, onValue } from 'firebase/database'

export default class PokeSourceFirebase implements PokeSource {
  private readonly firebaseApp: FirebaseApp

  constructor (config: FirebaseOptions = {
    apiKey: 'AIzaSyDzwR0qYbl6QzA4pgw-LF7M6yxG2bWC7xo',
    databaseURL: 'https://victor-poke.firebaseio.com'
  }) {
    this.firebaseApp = initializeApp(config)
  }

  onInfoUpdate (updateInfo: (pokes: number, ticks: number) => void): () => void {
    const db = getDatabase(this.firebaseApp)
    const r = ref(db, 'info')

    return onValue(r, function (snapshot) {
      if (!snapshot) return
      const val = snapshot.val() as {
        pokes: number
        ticks: number
      }
      updateInfo(val.pokes, val.ticks)
    })
  }

  onPokeUpdate (updatePoke: (pokes: Record<string, PokeInfo>) => void): () => void {
    const db = getDatabase(this.firebaseApp)
    const pokeRef = ref(db, 'poke')
    // const pokeQuery = query(pokeRef, orderByChild('time'))

    return onValue(pokeRef, function (snapshot) {
      if (!snapshot) return
      updatePoke(snapshot.val() as Record<string, PokeInfo>)
    })
  }

  destroy (): void {
    deleteApp(this.firebaseApp)
  }
}
