export interface RandomAlgo {
  seed (seed: number): void
  generate (): number
  range (min: number, max: number): number
  lastGeneratedSize: number
}

const UINT32_MAX = 0xffffffff

function randomRange32 (algo: RandomAlgo, umax: number): number {
  // JS version of php_random_range32

  let result = roll()

  if (umax === UINT32_MAX) {
    // Special case where no modulus is required
    return result
  }

  // Increment the max so range is inclusive of max
  umax++

  // Powers of two are not biased
  if (!(umax & (umax - 1))) {
    return result & (umax - 1)
  }

  // Ceiling under which UINT32_MAX % max == 0
  const limit = UINT32_MAX - (UINT32_MAX % umax) - 1

  // Discard numbers over the limit to avoid modulo bias
  let count = 0
  const PHP_RANDOM_RANGE_ATTEMPTS = 50
  while (result > limit) {
    if (++count > PHP_RANDOM_RANGE_ATTEMPTS) {
      throw new Error(`BrokenRandomEngineError: Failed to generate an acceptable random number in ${PHP_RANDOM_RANGE_ATTEMPTS} attempts`)
    }

    result = roll()
  }

  return result % umax

  function roll (): number {
    let result = 0
    let totalSize = 0
    do {
      const r = algo.generate()
      result |= r << (totalSize << 3)
      totalSize += algo.lastGeneratedSize
    } while (totalSize < 4)
    return result >>> 0
  }
}

function randomRange64 (_algo: RandomAlgo, _max: number): number {
  throw new Error('php_random_range64 not implemented')
}

export function randomRange (algo: RandomAlgo, min: number, max: number): number {
  min = Math.trunc(min)
  max = Math.trunc(max)

  const umax = max - min

  if (umax > UINT32_MAX) {
    return randomRange64(algo, umax) + min
  }

  return randomRange32(algo, umax) + min
}

export function arrayPickKeys<T> (algo: RandomAlgo, array: readonly T[], numReq: number): number[] {
  const numAvail = array.length
  if (!numAvail) {
    throw new Error('array cannot be empty')
  }

  if (numReq === 1) {
    return [algo.range(0, numAvail - 1)]
  }

  if (numReq <= 0 || numReq > numAvail) {
    throw new RangeError('numReq must be between 1 and the number of elements in array')
  }

  let negate = 0
  if (numReq > (numAvail >>> 1)) {
    negate = 1
    numReq = numAvail - numReq
  }

  const selected = Array(numAvail).fill(false) // PHP uses bitset, but we don't bother
  let i = numReq
  while (i) {
    const randval = algo.range(0, numAvail - 1)
    if (!selected[randval]) {
      selected[randval] = true
      i--
    }
  }

  const out = Array(numReq)
  for (let i = 0, j = 0; i < numAvail; i++) {
    if (selected[i] ^ negate) {
      out[j++] = i
    }
  }

  return out
}

export function arrayDataShuffle<T> (algo: RandomAlgo, array: T[]): void {
  if (array.length < 1) return

  let nLeft = array.length
  while (--nLeft) {
    const i = algo.range(0, nLeft)
    if (i < nLeft) {
      const temp = array[nLeft]
      array[nLeft] = array[i]
      array[i] = temp
    }
  }
}
