import { PokeInfo } from './PokeInfo'
import { PokeSource } from './PokeSource'

import firebase from 'firebase/app'
import 'firebase/database'

export default class PokeSourceFirebase implements PokeSource {
  constructor (config: {} = {
    apiKey: 'AIzaSyDzwR0qYbl6QzA4pgw-LF7M6yxG2bWC7xo',
    databaseURL: 'https://victor-poke.firebaseio.com'
  }) {
    firebase.initializeApp(config)
  }

  onInfoUpdate (updateInfo: (pokes: number, ticks: number) => void): () => void {
    const ref = firebase.database().ref('info')
    const callback = ref.on('value', function (snapshot) {
      if (!snapshot) return
      const val = snapshot.val()
      updateInfo(val.pokes, val.ticks)
    })

    return () => ref.off('value', callback)
  }

  onPokeUpdate (updatePoke: (pokes: Record<string, PokeInfo>) => void): () => void {
    const pokeRef = firebase.database().ref('poke')
    // .orderByChild('time')
    const callback = pokeRef.on('value', function (snapshot) {
      if (!snapshot) return
      updatePoke(snapshot.val())
    })

    return () => pokeRef.off('value', callback)
  }
}
