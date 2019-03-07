export * from './array'
export * from './dom'
export * from './math'

export function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

export function randomAlphaNumeric (length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let s = ''
  while (length--) {
    s += chars[(Math.random() * chars.length) | 0]
  }
  return s
}

// color

export function formatHexColor (v: number | string): string {
  return '#' + ('00000' + v.toString(16)).slice(-6)
}

export function randomHexColor (): string {
  return formatHexColor((Math.random() * 0x1000000) | 0)
}

// date

export function padYear (year: number | string): string {
  return (year + '').padStart(4, '0')
}

export function padMonthDay (md: number | string): string {
  return (md + '').padStart(2, '0')
}

// type

export type Repeat<
  T,
  L extends number,
  A extends unknown[] = [],
> = A['length'] extends L ? A : Repeat<T, L, [...A, T]>
