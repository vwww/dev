export class ByteReader {

  private pos = 0

  constructor (private readonly buf: Uint8Array, private readonly len = buf.length) { }

  get debugBuf (): Uint8Array { return this.buf }
  get remaining (): number { return this.len - this.pos }

  get (): number {
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

  static UINT64_BIAS = [0xf9n, 0x100f9n, 0x10100f9n, 0x1010100f9n, 0x101010100f9n, 0x10101010100f9n, 0x1010101010100f9n]

  getUint64 (): bigint {
    const c = this.get()
    if (c < 0xf9) return BigInt(c)

    const bytesMinusTwo = c - 0xf9

    // little endian
    let n = 0n
    const b = bytesMinusTwo + 2
    for (let i = 0; i < b; i++) {
      n |= BigInt(this.get()) << BigInt(i * 8)
    }

    // big endian (1)
    let n1 = 0n
    let b1 = bytesMinusTwo + 1
    while (b1--) {
      n1 |= BigInt(this.get())
      n1 <<= 8n
    }
    n1 |= BigInt(this.get())

    // big endian (2)
    let n2 = 0n
    let b2 = bytesMinusTwo + 2
    while (b2--) {
      n2 |= BigInt(this.get()) << BigInt(b2 * 8)
    }
    return n + ByteReader.UINT64_BIAS[bytesMinusTwo]
  }

  getInt64 (): bigint {
    const n = this.getUint64()
    return (n >> 1n) ^ -(n & 1n)
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
