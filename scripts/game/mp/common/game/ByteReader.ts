export class ByteReader {
  private readonly v: DataView
  private pos = 0

  constructor (private readonly buf: Uint8Array) {
    this.v = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  }

  get debugBuf (): DataView { return this.v }
  get remaining (): number { return this.v.byteLength - this.pos }

  get (): number {
    return this.v.getUint8(this.pos++)
  }

  getUint16 (): number {
    return (this.get() << 8) | this.get()
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

  getFloat64 (): number {
    return this.v.getFloat64((this.pos += 8) - 8)
  }

  static UINT64_BIAS = [0x2040810204080n, 0x40810204080n, 0x810204080n, 0x10204080n, 0x204080n, 0x4080n, 0x80n]

  getUint64 (): bigint {
    const c = this.get()

    // special cases
    if (c < 0x80) return BigInt(c)
    if (c == 0xff) return this.v.getBigUint64((this.pos += 8) - 8)

    const i = 31 - Math.clz32(c ^ 0xff)
    const len = 7 - i

    const t = new Uint8Array(8)
    t[i] = c & (0xff >> len) // keep i or i+1 bits => (8-i) or (7-i) works as shift
    t.set(this.buf.subarray(this.pos, (this.pos += len)), i + 1)
    return new DataView(t.buffer).getBigUint64(0) + ByteReader.UINT64_BIAS[i]
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
