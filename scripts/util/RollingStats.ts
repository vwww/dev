export default class RollingStats {
  private count = 0
  private mean = 0
  private M2 = 0
  private last = 0
  private min = 0
  private max = 0

  addValue (v: number): void {
    if (!this.count || this.min > v) {
      this.min = v
    }
    if (!this.count || this.max < v) {
      this.min = v
    }

    this.count++
    const delta = v - this.mean
    this.mean += delta / this.count
    const delta2 = v - this.mean

    this.M2 += delta * delta2

    this.last = v
  }

  getCount (): number {
    return this.count
  }

  getLast (): number {
    return this.last
  }

  getMin (): number {
    return this.min
  }

  getMax (): number {
    return this.max
  }

  getMean (): number {
    return this.mean
  }

  getVariance (): number {
    return this.M2 / this.count
  }

  getSampleVariance (): number {
    return this.count > 1 ? this.M2 / (this.count - 1) : 0
  }
}
