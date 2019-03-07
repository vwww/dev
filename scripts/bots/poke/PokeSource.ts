import type { PokeInfo } from './PokeInfo'

type Unsubscribe = () => void

export interface PokeSource {
  onInfoUpdate (updateInfo: (pokes: number, ticks: number) => void): Unsubscribe
  onPokeUpdate (updatePoke: (pokes: Record<string, PokeInfo>) => void): Unsubscribe
  destroy (): void
}
