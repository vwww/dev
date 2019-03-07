import type { PokeInfo, TaggedPokeInfo } from './PokeInfo'

export const enum TieType {
  NONE,
  FIRST,
  INDENTED,
}

export interface EntryInfo extends TaggedPokeInfo {
  rank: [number, number, number, number, number, number]
  tie: TieType
}

export function parseEntry (entry: PokeInfo, uid: string): EntryInfo {
  return {
    ...entry,
    rank: [0, 0, 0, 0, 0, 0],
    tie: TieType.NONE,
    uid
  }
}
