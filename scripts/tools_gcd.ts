import { $idA, $ready } from './util'

const $numZero = $idA<HTMLInputElement>('numZero')
const $iterLimit = $idA<HTMLInputElement>('iterLimit')
const $nums = $idA<HTMLInputElement>('nums')

const $gcdText = $idA('gcdText')
const $lcmText = $idA('lcmText')

function gcd (a: number, b: number, zeroThreshold: number, maxIterations: number): number {
  do {
    [a, b] = [b, a % b]
  } while (Math.abs(b) > zeroThreshold && --maxIterations > 0)
  return Math.abs(a)
}

function update (): void {
  const zeroThreshold = +$numZero.value
  const maxIterations = +$iterLimit.value
  const nums = $nums.value.split(',').map(n => +n.trim())

  const gcdResult = nums.reduce((acc, curVal) => gcd(acc, curVal, zeroThreshold, maxIterations))
  const lcmResult = nums.reduce((acc, curVal) => acc / gcd(acc, curVal, zeroThreshold, maxIterations) * curVal)

  const numString = nums.join(', ')

  $gcdText.innerText = `gcd(${numString}) = ${gcdResult}`
  $lcmText.innerText = `lcm(${numString}) = ${lcmResult}`
}

$numZero.addEventListener('change', update)
$iterLimit.addEventListener('change', update)
$nums.addEventListener('change', update)
$ready(update)
