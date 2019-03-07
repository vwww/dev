export interface PokeInfo {
  name: string
  num: number
  time: number
}

export interface TaggedPokeInfo extends PokeInfo {
  uid: string
}
