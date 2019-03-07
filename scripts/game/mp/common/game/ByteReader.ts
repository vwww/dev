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

  // any 32-bit int, more efficient for smaller int
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

  // better for unsigned int, up to 28 bits, also handles signed
  getUint (): number {
    let n = this.get()
    if (n & 0x80) {
      n ^= (this.get() << 7) ^ 0x80
      if (n & (1 << 14)) n ^= (this.get() << 14) ^ (1 << 14)
      if (n & (1 << 21)) n ^= (this.get() << 21) ^ (1 << 21)
      if (n & (1 << 28)) n |= 0xE000_0000 // assumed negative signed int
    }
    return n
  }

  getFloat64 (): number {
    const buf = new Uint8Array([
      this.get(), this.get(), this.get(), this.get(),
      this.get(), this.get(), this.get(), this.get()
    ])
    return new DataView(buf.buffer).getFloat64(0)
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
