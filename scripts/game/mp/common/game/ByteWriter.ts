import type { Repeat } from '@/util'

export class ByteWriter {
  private readonly buf: number[] = []

  put (...bytes: number[]): this {
    this.buf.push(...bytes)
    return this
  }

  // any 32-bit int, more efficient for smaller values
  putInt (n: number): this {
    if (n > -127 && n < 128) {
      this.put(n)
    } else if (n >= -0x8000 && n < 0x8000) {
      this.put(
        0x80, // -128
        n,
        n >> 8,
      )
    } else {
      this.put(
        0x81, // -127
        n,
        n >> 8,
        n >> 16,
        n >> 24,
      )
    }
    return this
  }

  putBool (b: boolean): this {
    this.put(b ? 1 : 0)
    return this
  }

  putFloat64 (n: number): this {
    const buf = new Uint8Array(8)
    new DataView(buf.buffer).setFloat64(0, n)
    return this.put(...buf)
  }

  putUint64 (n: bigint): this {
    if (n < 0) throw new Error('bad Uint64')

    let bytes
    if (n >= 0x1010100f9) {
      if (n >= 0x10101010100f9) {
        if (n >= 0x1010101010100f9n) {
          n -= 0x1010101010100f9n
          bytes = 8
        } else {
          n -= 0x10101010100f9n
          bytes = 7
        }
      } else {
        if (n >= 0x101010100f9) {
          n -= 0x101010100f9n
          bytes = 6
        } else {
          n -= 0x1010100f9n
          bytes = 5
        }
      }
    } else {
      if (n >= 0x100f9) {
        if (n >= 0x10100f9) {
          n -= 0x10100f9n
          bytes = 4
        } else {
          n -= 0x100f9n
          bytes = 3
        }
      } else {
        if (n >= 0xf9) {
          n -= 0xf9n
          bytes = 2
        } else {
          bytes = 1
        }
      }
    }

    if (bytes > 1) this.put(0xf9 - 2 + bytes)

    // little endian
    do {
      this.put(Number(n & 0xffn))
      n >>= 8n
    } while (--bytes)

    // big endian
    while (bytes--) {
      this.put(Number((n >> BigInt(bytes * 8)) & 0xffn))
    }

    return this
  }

  putInt64 (n: bigint): this {
    // zig-zag encode, assuming 64 bits max
    return this.putUint64((n << 1n) ^ (n >> 63n))
  }

  putUint64Old (n: bigint): this {
    this.putFloat64(Number(n))
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

  putFmt<Fmt extends string>(fmt: Fmt, ...args: FmtArgs<Fmt>): this {
    for (let i = 0, j = 0; i < fmt.length; i++) {
      const spec = fmt[i] as Spec
      let n = fmt[i+1] >= '0' && fmt[i+1] <= '9' ? +fmt[++i] : 1
      switch (spec) {
        case 's':
          while(n--) this.putString(args[j++])
          break
        case 'i':
          while(n--) this.putInt(args[j++])
          break
        case 'b':
          while(n--) this.putBool(args[j++])
          break
        case 'U':
          while(n--) this.putUint64Old(args[j++]) // TODO switch to new format
          break
        case 'd':
          while(n--) this.putFloat64(args[j++])
          break
      }
    }
    return this
  }

  toArray (): Uint8Array {
    return Uint8Array.from(this.buf)
  }
}

type Spec = 's' | 'b' | 'i' | 'U' | 'd'
type SpecType<S extends Spec> =
  S extends 'd' | 'i' ? number :
  S extends 'U' ? bigint :
  S extends 'b' ? boolean :
  S extends 's' ? string :
  never

export type FmtArgs<Fmt extends string> =
  Fmt extends `${infer S extends Spec}${infer N extends number}${infer Rest}` ? [...Repeat<SpecType<S>, N>, ...FmtArgs<Rest>] :
  Fmt extends `${infer S extends Spec}${infer Rest}` ? [SpecType<S>, ...FmtArgs<Rest>] :
  Fmt extends '' ? [] :
  never
