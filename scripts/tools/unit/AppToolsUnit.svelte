<script lang="ts">
import { Unit, UNITS } from './units'

let curType: string = Object.keys(UNITS)[0]
let curFrom: string = Object.keys(UNITS[curType])[0]
let curTo: string = Object.keys(UNITS[curType])[1]

let val1 = '1337.1'
let val2 = '0'

let sfn = 0
let dpn = 0

$: uFrom = UNITS[curType]?.[curFrom]
$: uTo = UNITS[curType]?.[curTo]

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
  if (sig < 0 || (num | 0) === num) return num.toString()
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

function fixPrecision (num: number, sf: number, max: number): string {
  switch (sf) {
    case 1:
      return toSigFigs(num, max)
    case 2:
      return num.toFixed(max)
  }
  return num.toString()
}

function convertVal (uf: Unit | undefined, ut: Unit | undefined, val1: string, val2: string, sf: number): string {
  if (!uf || !ut) return '[no unit selected]'

  // By multiplying/dividing, we use the number with the least significant figures
  let maxp = -1
  switch (sf) {
    case 1:
      maxp = getSigFigs(val1)
      if (uf[2]) maxp = Math.min(maxp, getSigFigs(val2))

      sfn = maxp
      break
    case 2:
      maxp = getPrecision(val1)
      if (uf[2]) maxp = Math.min(maxp, getPrecision(val2))

      dpn = maxp
      break
  }

  // absolute value of the "from"
  let result: number
  if (uf[2]) result = uf[0][0] * uf[2] * parseFloat(val1) + uf[0][0] * parseFloat(val2)
  else result = uf[0][0] * parseFloat(val1)

  // we should do "precision" for the following operations...
  if (uf[0][1]) result += uf[0][1]
  if (ut[0][1]) result -= ut[0][1]

  // convert it to the "to"
  result /= ut[0][0]
  // no precision fix for the division (since modulus is whole)
  let resultStr: string
  if (ut[2]) resultStr = Math.floor(result / ut[2]) + ' ' + ut[3] + ' ' + fixPrecision(result % ut[2], sf, maxp)
  else resultStr = fixPrecision(result, sf, maxp)

  return resultStr + ' ' + ut[1]
}
</script>

<div class="row">
  <div class="col-sm-4 mb-2">
    <p>Type</p>
    <select bind:value={curType} on:change={curTypeChanged} class="form-select" size="12">
      {#each Object.keys(UNITS) as cat}
        <option value={cat}>{cat}</option>
      {/each}
    </select>
  </div>
  <div class="col-sm-4 mb-2">
    <p>From</p>
    <select bind:value={curFrom} on:change={curFromChanged} class="form-select" size="12">
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
    <p>{@html convertVal(uFrom, uTo, val1, val2, 0)}</p>
    <p>{@html convertVal(uFrom, uTo, val1, val2, 1)} ({sfn} significant figure{sfn == 1 ? '' : 's'})</p>
    <p>{@html convertVal(uFrom, uTo, val1, val2, 2)} ({dpn} decimal{dpn == 1 ? '' : 's'})</p>
  </div>
</div>
