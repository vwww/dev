import type { Repeat } from '@/util'

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

  putFloat64 (n: number): this {
    const buf = new Uint8Array(8)
    new DataView(buf.buffer).setFloat64(0, n)
    for (let i = 0; i < 8; i++) {
      this.put(buf[i])
    }
    return this
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
    return new Uint8Array(this.buf)
  }

  static fw<Fmt extends string>(fmt: Fmt, ...args: FmtArgs<Fmt>) {
    return new ByteWriter().putFmt(fmt, ...args)
  }

  static f<Fmt extends string>(fmt: Fmt, ...args: FmtArgs<Fmt>) {
    return ByteWriter.fw(fmt, ...args).toArray()
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
