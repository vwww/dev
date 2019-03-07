export default class RollingStats {
  #count = $state(0)
  #mean = $state(0)
  #m2 = $state(0)
  #last = $state(0)
  #min = $state(0)
  #max = $state(0)

  addValue (v: number): void {
    if (!this.#count || this.#min > v) {
      this.#min = v
    }
    if (!this.#count || this.#max < v) {
      this.#max = v
    }

    this.#count++
    const delta = v - this.#mean
    this.#mean += delta / this.#count
    const delta2 = v - this.#mean

    this.#m2 += delta * delta2

    this.#last = v
  }

  getCount (): number {
    return this.#count
  }

  getLast (): number {
    return this.#last
  }

  getMin (): number {
    return this.#min
  }

  getMax (): number {
    return this.#max
  }

  getMean (): number {
    return this.#mean
  }

  getVariance (): number {
    return this.#count ? this.#m2 / this.#count : 0
  }

  getSampleVariance (): number {
    return this.#count > 1 ? this.#m2 / (this.#count - 1) : 0
  }
}
