export function sum (array: number[]): number {
  return array.reduce((a, b) => a + b, 0)
}

export function randomArrayItem<T> (array: T[]): T {
  return array[(Math.random() * array.length) | 0]
}

export function randomArrayItemZipf<T> (array: T[]): T {
  const MAXRAND = Math.log(array.length + 1)
  const w = Math.min(Math.exp(Math.random() * MAXRAND) | 0, array.length)
  return array[w - 1]
}

export function shuffle<T> (a: T[], start = 0, end = a.length): void {
  for (let i = end - 1 - start; i !== start; --i) {
    const j: number = Math.floor(Math.random() * (i + 1))
    const x: T = a[start + i]
    a[start + i] = a[start + j]
    a[start + j] = x
  }
}
