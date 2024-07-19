import { type RandomAlgo, randomRange } from './common'

const N = 624
const M = 397
const MATRIX_A = 0x9908b0df
const KNUTH_MULTIPLIER = 1812433253
const TEMPER_A = 0x9d2c5680
const TEMPER_B = 0xefc60000

export class Mt19937Algo implements RandomAlgo {
  lastGeneratedSize = 4

  private state: number[]
  private next: number

  constructor (initialSeed: number) {
    this.state = Array(N)
    this.next = 0
    this.seed(initialSeed)
  }

  seed (seed: number): void {
    this.state[0] = seed
    for (let i = 1; i < N; i++) {
      seed ^= seed >>> 30
      // split to fix multiplication overflow
      this.state[i] = seed =
        ((((seed & 0xffff0000) >>> 16) * KNUTH_MULTIPLIER) << 16) +
        ((seed & 0x0000ffff) * KNUTH_MULTIPLIER) +
        i
    }
    this.next = 0
  }

  generate (): number {
    const cur = this.next++
    if (this.next === N) {
      this.next = 0
    }

    let y = (this.state[cur] & 0x80000000) | (this.state[this.next] & 0x7fffffff)
    this.state[cur] = y = this.state[cur < N - M ? cur + M : cur + M - N] ^ (y >>> 1) ^ (-(y & 1) & MATRIX_A)

    y ^= y >>> 11
    y ^= (y << 7) & TEMPER_A
    y ^= (y << 15) & TEMPER_B
    return y ^ (y >>> 18)
  }

  range (min: number, max: number): number {
    return randomRange(this, min, max)
  }
}
