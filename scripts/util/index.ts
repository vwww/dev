export * from './array'
export * from './dom'
export * from './math'

export function randomAlphaNumeric (length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let s = ''
  while (length--) {
    s += chars[(Math.random() * chars.length) | 0]
  }
  return s
}

export function formatHexColor (v: number | string): string {
  return '#' + ('00000' + v.toString(16)).slice(-6)
}

export function randomHexColor (): string {
  return formatHexColor((Math.random() * 0xFFFFFF) | 0)
}
