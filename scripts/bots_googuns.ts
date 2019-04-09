import * as jsSHA from 'jsSHA'
import { $idA, $ready } from './util'

$ready(function () {
  // Parse v2
  function parse2d0 (msg: string, len: number): void {
    const parts = [
      msg.slice(0, 16),
      msg.slice(16, 18),
      msg.slice(18, 128),
      msg.slice(128, 144),
      msg.slice(144, 274),
      msg.slice(274)
    ]

    // Derived
    let C0: string | undefined
    if (len >= 280) {
      C0 = msg.slice(0, 16)
      for (let i = 16; i < 272; i += 16) {
        if (i !== 128) {
          C0 = xorHexStr(C0, msg.slice(i, i + 16))
        }
      }
      C0 = xorHexStr(C0, msg.slice(272, 280) + msg.slice(272, 280))
    }
    const UT = len >= 122 ? xorHexStr(parts[0], msg.slice(122, 138)) : repStr(16, '?')
    const UTD = !includes(UT, '?') && new Date(fromHex(UT) * 1000)

    // Update td text
    for (let i = 0; i < 6; ++i) {
      $idA('f2_' + i).innerText = parts[i]
    }
    $idA('d2_c0').innerText = C0 || repStr(16, '?')

    $idA('d2_time').innerText = UT
    $idA('d2_time_parsed').innerText = UTD ? UTD.toLocaleString() : 'Unknown'

    // Update td class
    const V1 = parts[1] === '20'
    const V3 = !!C0 && parts[3] === C0
    const V5 = parts[5] === '000000'
    const VT = UTD && isFinite(+UTD)
    updateValid('f2_1', V1)
    updateValid('f2_3', V3)
    updateValid('f2_5', V5)
    updateValid('d2_time_parsed', VT)

    // Update label
    const VA = V1 && V3 && V5 && VT
    $idA('f2_valid').className = (VA ? 'badge badge-success' : 'd-none')
  }

  // Parse v1.1
  function parse1d1 (msg: string, len: number): void {
    const parts = [
      msg.slice(0, 16),
      msg.slice(16, 18),
      msg.slice(18, 20),
      msg.slice(20, 124),
      msg.slice(124, 126),
      msg.slice(126, 134),
      msg.slice(134)
    ]

    // Derived
    const C0 = len >= 20 && sha(256, msg.slice(20, len & ~1))
    const C1 = len >= 16 && sha(1, parts[0])
    const UT = xorHexStr(parts[0], xorHexStr(msg.slice(18, 34), msg.slice(64, 80)))
    const UTD: Date | false = !includes(UT, '?') && new Date(fromHex(UT) * 1000)

    // Update td text
    for (let i = 0; i < 7; ++i) {
      $idA('f1.1_' + i).innerText = parts[i]
    }
    $idA('d1.1_c0').innerText = C0 || repStr(64, '?')
    $idA('d1.1_c1').innerText = C1 || repStr(40, '?')
    $idA('d1.1_time').innerText = UT || repStr(16, '?')
    $idA('d1.1_time_parsed').innerText = UTD ? UTD.toLocaleString() : 'Unknown'

    // Update td class
    const V1 = !!C1 && parts[1] === xorHexStr(C1.slice(0, 2), 'FF')
    const V2 = !!C0 && parts[2] === C0.slice(2, 4)
    const V4 = parts[4] === '01'
    const V6 = parts[6] === '000000'
    const VT = UTD && isFinite(+UTD)
    updateValid('f1.1_1', V1)
    updateValid('f1.1_2', V2)
    updateValid('f1.1_4', V4)
    updateValid('f1.1_6', V6)
    updateValid('d1.1_time_parsed', VT)

    // Update label
    const VA = V1 && V2 && V4 && V6 && VT
    $idA('f1.1_valid').className = (VA ? 'badge badge-success' : 'd-none')
  }

  // Parse v1
  function parse1d0 (msg: string, len: number): void {
    const parts = [
      msg.slice(0, 16),
      msg.slice(16, 36),
      msg.slice(36, 56),
      msg.slice(56, 60),
      msg.slice(60, 124),
      msg.slice(124, 126),
      msg.slice(126, 134),
      msg.slice(134)
    ]

    // Derived
    const C1 = len >= 16 && sha(1, parts[0])
    const C2 = len >= 124 && sha(256, msg.slice(0, 60) + msg.slice(124, len & ~1))
    const ABC = xorHexStr(parts[1], parts[2])
    const UT = !includes(ABC, '?') && rolHex64Str(
      xorHexStr(
        rolHex64Str(
          parts[0],
          fromHex(ABC.slice(18))
        ),
        xorHexStr(
          '420B16B00B5F1337',
          ABC.slice(2, 18)
        )
      ),
      64 - fromHex(ABC.slice(0, 2))
    )
    const UTD = UT && new Date(fromHex(UT) * 1000)

    // Update td text
    for (let i = 0; i < 8; ++i) {
      $idA('f1_' + i).innerText = parts[i]
    }
    $idA('d1_c1').innerText = C1 || repStr(40, '?')
    $idA('d1_c2').innerText = C2 || repStr(64, '?')
    $idA('d1_abc').innerText = ABC || repStr(10, '?')
    $idA('d1_time').innerText = UT || repStr(16, '?')
    $idA('d1_time_parsed').innerText = UTD ? UTD.toLocaleString() : 'Unknown'

    // Update td class
    const V1 = !!C1 && parts[1] === C1.slice(0, 20)
    const V4 = parts[4] === C2
    const V5 = parts[5] === '01'
    const V7 = parts[7] === '000000'
    const VT = !!UTD && isFinite(+UTD)
    updateValid('f1_1', V1)
    updateValid('f1_4', V4)
    updateValid('f1_5', V5)
    updateValid('f1_7', V7)
    updateValid('d1_time_parsed', VT)

    // Update label
    const VA = V1 && V4 && V5 && V7 && VT
    $idA('f1_valid').className = (VA ? 'badge badge-success' : 'd-none')
  }

  function parse2 (msg: string): void {
    const len = msg.length
    if (len < 280) msg += repStr(280 - len, '?')
    else if (len > 280) msg = msg.slice(0, 280)

    parse2d0(msg, len)
  }

  function parse1 (msg: string): void {
    const len = msg.length
    if (len < 140) msg += repStr(140 - len, '?')
    else if (len > 140) msg = msg.slice(0, 140)

    parse1d0(msg, len)
    parse1d1(msg, len)
  }

  function parse (msg: string): void {
    parse2(msg)
    parse1(msg)
  }

  // Listen to changes
  const $msg = $idA<HTMLTextAreaElement>('msg')
  $msg.onchange = function () {
    // Sanitize message
    let msg = $msg.value.toLowerCase().replace(/[^0-9a-f]+/g, '')
    // Truncate to length 280
    if (msg.length >= 280) msg = msg.slice(0, 280)

    parse(msg)

    if ($msg.value !== msg) {
      $msg.value = msg
    }
  }

  parse('')

  // Helper functions
  function updateValid (id: string, ok: boolean): void {
    $idA(id).className = (ok ? 'table-success' : 'table-danger')
  }
  function includes (haystack: string, needle: string): boolean { return haystack.indexOf(needle) !== -1 }
  function sha (type: string | number, inHex: string): string {
    try {
      const shaObj = new jsSHA('SHA-' + type, 'HEX')
      shaObj.update(inHex)
      return shaObj.getHash('HEX')
    } catch (e) {
      return e.message
    }
  }
  function repStr (count: number, pattern: string): string {
    if (count < 1) return ''
    let result = ''
    while (count > 1) {
      if (count & 1) result += pattern
      pattern += pattern
      count >>>= 1
    }
    return result + pattern
  }
  function fromHex (c: string): number {
    return +('0x' + c)
  }
  function xorHexStr (a: string, b: string): string {
    let result = ''
    if (a.length !== b.length) return ''
    for (let i = 0; i < a.length; ++i) {
      if (a[i] === '?' || b[i] === '?') result += '?'
      else result += (fromHex(a[i]) ^ fromHex(b[i])).toString(16)
    }
    return result
  }
  function rolHex64Str (str: string, N: number): string {
    // Shift by 4-bit increments
    const shift4bit = (N & 63) >> 2
    str = str.slice(shift4bit) + str.slice(0, shift4bit)
    N &= 3
    if (!N) return str
    // Do remaining shift
    const hi = fromHex(str.slice(0, 8))
    const lo = fromHex(str.slice(8))
    const hiRot = ((hi << N) | (lo >>> (32 - N))) >>> 0
    const loRot = ((lo << N) | (hi >>> (32 - N))) >>> 0
    // Add zeros
    const hiStr = hiRot.toString(16)
    const loStr = loRot.toString(16)
    return repStr(8 - hiStr.length, '0') + hiStr + repStr(8 - loStr.length, '0') + loStr
  }
})
