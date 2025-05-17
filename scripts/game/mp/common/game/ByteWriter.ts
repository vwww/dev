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
    return this.put(b ? 1 : 0)
  }

  putFloat64 (n: number): this {
    const buf = new Uint8Array(8)
    new DataView(buf.buffer).setFloat64(0, n)
    return this.put(...buf)
  }

  putUint64 (n: bigint): this {
    if (n < 0) throw new Error('bad Uint64')

    // fast path for small values
    if (n < 0x80n) {
      return this.put(Number(n))
    }

    let i
    if (n < 0x810204080) {
      if (n < 0x204080) {
        if (n < 0x4080) {
          i = 6
          n = (n - 0x80n) | 0x8000n
        } else {
          i = 5
          n = (n - 0x4080n) | 0xc00000n
        }
      } else {
        if (n < 0x10204080) {
          i = 4
          n = (n - 0x204080n) | 0xe0000000n
        } else {
          i = 3
          n = (n - 0x10204080n) | 0xf000000000n
        }
      }
    } else {
      if (n < 0x2040810204080) {
        if (n < 0x40810204080) {
          i = 2
          n = (n - 0x810204080n) | 0xf80000000000n
        } else {
          i = 1
          n = (n - 0x40810204080n) | 0xfc000000000000n
        }
      } else {
        i = 0
        if (n < 0x102040810204080n) {
          n = (n - 0x2040810204080n) | 0xfe00000000000000n
        } else {
          this.put(0xff)
          // special case, 0 bias
        }
      }
    }

    const buf = new Uint8Array(8)
    new DataView(buf.buffer).setBigUint64(0, n)

    return this.put(...buf.subarray(i))
  }

  putInt64 (n: bigint): this {
    // zig-zag encode, assuming 64 bits max
    return this.putUint64((n << 1n) ^ (n >> 63n))
  }

  putUint64Old (n: bigint): this {
    return this.putFloat64(Number(n))
  }

  putString (s: string): this {
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i)
      const v = c > 0x7F ? 63 : c // '?' == 63
      if (!v) break
      this.put(v)
    }
    return this.put(0)
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
