export class ByteReader {
  public overread = false

  private pos = 0

  constructor (private readonly buf: Uint8Array, private readonly len = buf.length) { }

  get debugBuf (): Uint8Array { return this.buf }
  get remaining (): number { return this.len - this.pos }

  get (): number {
    if (this.pos === this.len) {
      this.overread = true
      return 0
    }
    return this.buf[this.pos++]
  }

  getCN (): number {
    const n = this.get()
    if (n & 0x80) return -1
    return n & 63
  }

  // any 32-bit int, more efficient for smaller values
  getInt (): number {
    let n = this.get() << 24 >> 24 // sign extend
    if (n === -128) {
      n = this.get()
      n |= this.get() << 24 >> 16
    } else if (n === -127) {
      n = this.get()
      n |= this.get() << 8
      n |= this.get() << 16
      n |= this.get() << 24
    }
    return n
  }

  getBool (): boolean {
    return !!this.get() // expects putInt() with 0 or 1
  }

  getFloat64 (): number {
    const buf = new Uint8Array([
      this.get(), this.get(), this.get(), this.get(),
      this.get(), this.get(), this.get(), this.get()
    ])
    return new DataView(buf.buffer).getFloat64(0)
  }

  getUint64Old (): bigint {
    return BigInt(this.getFloat64())
  }

  getString (maxLen: number): string {
    const b: number[] = []
    while (b.length <= maxLen) {
      const c = this.get()
      if (!c || b.length === maxLen) break
      b.push(c > 0x7F ? 63 : c) // '?' == 63
    }
    return String.fromCharCode(...b)
  }
}
