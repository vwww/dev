<script lang="ts">
import { UNITS } from './units'

const DEFAULT_TYPE = Object.keys(UNITS)[0]
const [DEFAULT_FROM, DEFAULT_TO] = Object.keys(UNITS[DEFAULT_TYPE])

let curType: string = $state(DEFAULT_TYPE)
let curFrom: string = $state(DEFAULT_FROM)
let curTo: string = $state(DEFAULT_TO)

let val1 = $state('1337.1')
let val2 = $state('0')

const uFrom = $derived(UNITS[curType]?.[curFrom])
const uTo = $derived(UNITS[curType]?.[curTo])

function curTypeChanged (): void {
  const k = Object.keys(UNITS[curType])
  curFrom = k[0]
  curTo = k[1]
}

function curFromChanged (): void {
  const k = Object.keys(UNITS[curType])
  curTo = k[curFrom === k[0] ? 1 : 0]
}

function keys (n?: object): string[] {
  return n ? Object.keys(n) : []
}

/**
 * Returns true if there is a decimal point in number
 * @param n number to check, as a string
 */
 function hasDecimal (n: string): boolean {
  return n.includes('.')
}

/**
 * Returns true if there is an e or an E in number
 * @param n number to check, as a string
 */
function hasExponent (n: string): boolean {
  return n.includes('e') || n.includes('E')
}

/**
 * Returns the number of significant figures
 * @param n number to check, as a string
 */
function getSigFigs (n: string): number {
  let figures = n.length
  if (hasExponent(n)) {
    // count before the exponent
    if (n.indexOf('e') > 0) figures = n.indexOf('e')
    else if (n.indexOf('E') > 0) figures = n.indexOf('E')
  }
  for (let i = 0; i < n.length; i++) {
    // subtract the number of leading +, -, 0
    if (n.charAt(i) === '0' || n.charAt(i) === '+' || n.charAt(i) === '-' || n.charAt(i) === '.') {
      if (n.charAt(i) !== '.') { // decimal point is subtracted later
        --figures
      }
      continue
    }
    break
  }
  if (hasDecimal(n)) {
    // subtract the decimal point
    --figures
  }
  return figures
}

function toSigFigs (num: number, sig: number): string {
  if (num === 0) return '0'
  if (sig < 0 || Number.isInteger(num)) return num.toString()
  if (getSigFigs(num + '') > sig && sig >= 1 && sig <= 21) return num.toPrecision(sig)
  // round to significant digits
  const digits = Math.round((-Math.log(Math.abs(num)) / Math.LN10) + (sig || 2))
  return num.toFixed(Math.max(digits, 0))
}

function getPrecision (num: number | string): number {
  const s = num + ''
  if (!s.includes('.')) return 0
  return s.split('.')[1].length
}

const [convertedUnrounded, convertedSigFigs, convertedPrecision] = $derived.by(() => {
  if (!uFrom || !uTo) return Array(3).fill('[no unit selected]') as [string, string, string]

  // By multiplying/dividing, we use the number with the least significant figures
  let sfn = getSigFigs(val1)
  if (uFrom[2]) sfn = Math.min(sfn, getSigFigs(val2))

  let dpn = getPrecision(val1)
  if (uFrom[2]) dpn = Math.min(dpn, getPrecision(val2))

  // absolute value of the "from"
  let result: number
  if (uFrom[2]) result = uFrom[0][0] * uFrom[2] * parseFloat(val1) + uFrom[0][0] * parseFloat(val2)
  else result = uFrom[0][0] * parseFloat(val1)

  // TODO handle "precision" for the following operations...
  if (uFrom[0][1]) result += uFrom[0][1]
  if (uTo[0][1]) result -= uTo[0][1]

  // convert it to the "to"
  result /= uTo[0][0]

  const suffix2 = ` (${sfn} significant figure${sfn == 1 ? '' : 's'})`
  const suffix3 = ` (${dpn} decimal place${dpn == 1 ? '' : 's'})`

  const unit1 = uTo[1]
  if (uTo[2]) {
    // no precision fix for the division (since modulus is whole)
    const unit2 = uTo[3]
    const prefix = Math.floor(result / uTo[2]) + ' ' + unit2 + ' '
    const suffix = ' ' + unit1
    const remainder = result % uTo[2]
    return [
      prefix + remainder + suffix,
      prefix + toSigFigs(remainder, sfn) + suffix + suffix2,
      prefix + remainder.toFixed(dpn) + suffix + suffix3,
    ]
  } else {
    const suffix = ' ' + unit1
    return [
      result + suffix,
      toSigFigs(result, sfn) + suffix + suffix2,
      result.toFixed(dpn) + suffix + suffix3,
    ]
  }
})
</script>

<div class="row">
  <div class="col-sm-4 mb-2">
    <p>Type</p>
    <select bind:value={curType} onchange={curTypeChanged} class="form-select" size="12">
      {#each Object.keys(UNITS) as cat}
        <option value={cat}>{cat}</option>
      {/each}
    </select>
  </div>
  <div class="col-sm-4 mb-2">
    <p>From</p>
    <select bind:value={curFrom} onchange={curFromChanged} class="form-select" size="12">
      {#each keys(UNITS[curType]) as unit}
        <option value={unit}>{unit}</option>
      {/each}
    </select>
  </div>
  <div class="col-sm-4 mb-2">
    <p>To</p>
    <select bind:value={curTo} class="form-select" size="12">
      {#each keys(UNITS[curType]) as unit}
        <option value={unit} class:d-none={unit == curFrom}>{unit}</option>
      {/each}
    </select>
  </div>

  <div class="col-sm-6 mb-2">
    <div class="input-group">
      <input bind:value={val1} type="text" class="form-control" />
      <span class="input-group-text">{@html uFrom?.[uFrom?.[2] ? 3 : 1] ?? 'units'}</span>
    </div>
    <div class="input-group" class:d-none={!uFrom?.[2]}>
      <input bind:value={val2} type="text" class="form-control" />
      <span class="input-group-text">{@html uFrom?.[1] ?? ''}</span>
    </div>
  </div>
  <div class="col-sm-6">
    <p>{@html convertedUnrounded}</p>
    <p>{@html convertedSigFigs}</p>
    <p>{@html convertedPrecision}</p>
  </div>
</div>
