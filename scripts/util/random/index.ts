import { arrayDataShuffle, arrayPickKeys } from './common'
import { Mt19937Algo } from './mt19937'

export class Mt19937 extends Mt19937Algo {
  rand (min?: number, max?: number): number {
    if (!arguments.length) {
      return this.generate() >>> 1
    }

    if (min === undefined || max === undefined) {
      throw new Error('either both or neither of min and max must be present')
    }

    if (min > max) {
      throw new RangeError('min must be less than or equal to max')
    }

    return this.range(min, max)
  }

  array_rand<T> (array: readonly T[], num = 1): number[] {
    return arrayPickKeys(this, array, num)
  }

  shuffle<T> (array: T[]): void {
    arrayDataShuffle(this, array)
  }
}
