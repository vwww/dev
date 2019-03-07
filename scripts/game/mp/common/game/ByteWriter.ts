export class ByteWriter {
  private readonly buf: number[] = []

  put (n: number): this {
    this.buf.push(n & 0xFF)
    return this
  }

  // any 32-bit int, more efficient for smaller values
  putInt (n: number): this {
    if (n > -127 && n < 128) {
      this.put(n)
    } else if (n >= -0x8000 && n < 0x8000) {
      this.put(0x80) // -128
      this.put(n)
      this.put(n >> 8)
    } else {
      this.put(0x81) // -127
      this.put(n)
      this.put(n >> 8)
      this.put(n >> 16)
      this.put(n >> 24)
    }
    return this
  }

  putBool (b: boolean): this {
    this.put(b ? 1 : 0)
    return this
  }

  // better for unsigned int, up to 28 bits, also handles signed
  putUint (n: number): this {
    if (n < 0 || n >= (1 << 21)) {
      this.put(0x80 | (n & 0x7F))
      this.put(0x80 | ((n >> 7) & 0x7F))
      this.put(0x80 | ((n >> 14) & 0x7F))
      this.put(n >> 21) // if bit 28 is set, we assume negative signed int and also set bits 32 to 29
    } else if (n < (1 << 7)) {
      this.put(n)
    } else if (n < (1 << 14)) {
      this.put(0x80 | (n & 0x7F))
      this.put(n >> 7)
    } else {
      this.put(0x80 | (n & 0x7F))
      this.put(0x80 | ((n >> 7) & 0x7F))
      this.put(n >> 14)
    }
    return this
  }

  putFloat64 (n: number): this {
    const buf = new Uint8Array(8)
    new DataView(buf.buffer).setFloat64(0, n)
    for (let i = 0; i < 8; i++) {
      this.put(buf[i])
    }
    return this
  }

  putString (s: string): this {
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i)
      const v = c > 0x7F ? 63 : c // '?' == 63
      if (!v) break
      this.put(v)
    }
    this.put(0)
    return this
  }

  toArray (): Uint8Array {
    return new Uint8Array(this.buf)
  }
}
