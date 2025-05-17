export class ByteReader {
  private v: DataView

  private pos = 0

  constructor (buf: Uint8Array) {
    this.v = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  }

  get debugBuf (): DataView { return this.v }
  get remaining (): number { return this.v.byteLength - this.pos }

  get (): number {
    return this.v.getUint8(this.pos++)
  }

  getCN (): number {
    const n = this.get()
    if (n & 0x80) return -1
    return n & 63
  }

  // any 32-bit int, more efficient for smaller values
  getInt (): number {
    let n = this.v.getInt8(this.pos++)
    if (n === -128) {
      return this.v.getInt16((this.pos += 2) - 2, true)
    } else if (n === -127) {
      return this.v.getInt32((this.pos += 4) - 4, true)
    }
    return n
  }

  getBool (): boolean {
    return !!this.get() // expects putInt() with 0 or 1
  }

  getFloat64 (): number {
    return this.v.getFloat64((this.pos += 8) - 8)
  }

  getUint64Old (): bigint {
    return BigInt(this.getFloat64())
  }

  static UINT64_BIAS = [0x80n, 0x4080n, 0x204080n, 0x10204080n, 0x810204080n, 0x40810204080n, 0x2040810204080n]

  getUint64 (): bigint {
    const c = this.get()

    // special cases
    if (c < 0x80) return BigInt(c)
    if (c == 0xff) return this.v.getBigUint64((this.pos += 8) - 8)

    const bytes = Math.clz32(c ^ 0xff) - 23

    const tmp = new Uint8Array(8)
    tmp[8 - bytes] = c & (0xff >> (bytes - 1))
    for (let i = 9 - bytes; i < 8; i++) {
      tmp[i] = this.get()
    }
    return new DataView(tmp.buffer).getBigUint64(0) + ByteReader.UINT64_BIAS[bytes - 2]
  }

  getInt64 (): bigint {
    // zig-zag decode
    const n = this.getUint64()
    return (n >> 1n) ^ -(n & 1n)
  }

  getString (maxLen: number): string {
    const b: number[] = []
    while (b.length <= maxLen) {
      const c = this.get()
      if (!c) break
      if (b.length === maxLen) throw new Error('too long')
      b.push(c > 0x7F ? 63 : c) // '?' == 63
    }
    return String.fromCharCode(...b)
  }
}
