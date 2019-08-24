import * as jsSHA from 'jsSHA'


export function includes (haystack: string, needle: string): boolean { return haystack.indexOf(needle) !== -1 }

export function sha (type: string | number, inHex: string): string {
  try {
    const shaObj = new jsSHA('SHA-' + type, 'HEX')
    shaObj.update(inHex)
    return shaObj.getHash('HEX')
  } catch (e) {
    return e.message
  }
}

export function repStr (count: number, pattern: string): string {
  if (count < 1) return ''
  let result = ''
  while (count > 1) {
    if (count & 1) result += pattern
    pattern += pattern
    count >>>= 1
  }
  return result + pattern
}

export function fromHex (c: string): number {
  return +('0x' + c)
}

export function xorHexStr (a: string, b: string): string {
  let result = ''
  if (a.length !== b.length) return ''
  for (let i = 0; i < a.length; ++i) {
    if (a[i] === '?' || b[i] === '?') result += '?'
    else result += (fromHex(a[i]) ^ fromHex(b[i])).toString(16)
  }
  return result
}

export function rolHex64Str (str: string, N: number): string {
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
