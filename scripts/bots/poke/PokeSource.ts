import type { PokeInfo } from './PokeInfo'

export interface PokeSource {
  onInfoUpdate (updateInfo: (pokes: number, ticks: number) => void): () => void
  onPokeUpdate (updatePoke: (pokes: Record<string, PokeInfo>) => void): () => void
}
