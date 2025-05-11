export function clamp <T> (a: T, b: T, c: T): T {
  return b > a ? b : a < c ? a : c
}

export function gcd (a: number, b: number, zeroThreshold: number, maxIterations: number): number {
  do {
    [a, b] = [b, a % b]
  } while (Math.abs(b) > zeroThreshold && --maxIterations > 0)
  return Math.abs(a)
}
