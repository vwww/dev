export default function gcd (a: number, b: number, zeroThreshold: number, maxIterations: number): number {
  do {
    [a, b] = [b, a % b]
  } while (Math.abs(b) > zeroThreshold && --maxIterations > 0)
  return Math.abs(a)
}
