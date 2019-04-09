import { Unit, UNITS } from './tools/Units'
import { $idA, $ready, removeAllChildNodes } from './util'

const $type = $idA<HTMLSelectElement>('unit_type')
const $from = $idA<HTMLSelectElement>('unit_from')
const $to = $idA<HTMLSelectElement>('unit_to')

const $val1 = $idA<HTMLInputElement>('unit_val1')
const $val2 = $idA<HTMLInputElement>('unit_val2')

function typeChanged (rebuildFrom: boolean): void {
  const curType = $type.options[$type.selectedIndex].innerHTML
  if (rebuildFrom) {
    removeAllChildNodes($from)
    // rebuild from menu
    const fromUnits = UNITS[curType]
    for (const i in fromUnits) {
      const $unit = document.createElement('option')
      $unit.innerHTML = i
      $from.appendChild($unit)
    }
    $from.selectedIndex = 0
  }
  removeAllChildNodes($to)
  // rebuild to menu
  const curFrom = $from.options[$from.selectedIndex].innerHTML
  const toUnits = UNITS[curType]
  for (const i in toUnits) {
    if (i !== curFrom) {
      const $unit = document.createElement('option')
      $unit.innerHTML = i
      $to.appendChild($unit)
    }
  }
  $to.selectedIndex = 0
  // update sources
  const cu = UNITS[curType][curFrom]
  if (cu[2]) {
    $idA('unit_con2').style.display = ''
    $idA('unit_name1').innerHTML = cu[3] || ''
    $idA('unit_name2').innerHTML = cu[1]
  } else {
    $idA('unit_con2').style.display = 'none'
    $idA('unit_name1').innerHTML = cu[1]
  }
  resultChanged()
}

// Significant Figures

/**
 * Returns true if there is a decimal point in number
 * @param n number to check, as a string
 */
function hasDecimal (n: string): boolean {
  return n.indexOf('.') >= 0
}

/**
 * Returns true if there is an e or an E in number
 * @param n number to check, as a string
 */
function hasExponent (n: string): boolean {
  return n.indexOf('e') >= 0 || n.indexOf('E') >= 0
}

/**
 * Returns the number of significant figures
 * @param n number to check, as a string
 */
function getSigFigs (n: string): number {
  let figures = n.length
  if (hasExponent(n)) {
    // don't include anything starting at the exponent
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

function getPrecision (num: number | string) {
  const s = num + ''
  if (s.indexOf('.') === -1) return 0
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

function convertVal (uf: Unit, ut: Unit, val1: string, val2: string, sf: number): string {
  // By multiplying/dividing, we use the number with the least significant figures
  let maxp = -1
  switch (sf) {
    case 1:
      maxp = getSigFigs(val1)
      if (uf[2]) maxp = Math.min(maxp, getSigFigs(val2))

      $idA('unit_sfn').innerHTML = maxp + ''
      $idA('unit_sfnp').innerHTML = maxp === 1 ? '' : 's'
      break
    case 2:
      maxp = getPrecision(val1)
      if (uf[2]) maxp = Math.min(maxp, getPrecision(val2))

      $idA('unit_dpn').innerHTML = maxp + ''
      $idA('unit_dpnp').innerHTML = maxp === 1 ? '' : 's'
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

function resultChanged (): void {
  // recalculate
  const curType = $type.options[$type.selectedIndex].innerHTML
  const curFrom = $from.options[$from.selectedIndex].innerHTML
  const curTo = $to.options[$to.selectedIndex].innerHTML
  const val1 = $val1.value
  const val2 = $val2.value

  const uFrom = UNITS[curType][curFrom]
  const uTo = UNITS[curType][curTo]
  $idA('unit_result0').innerHTML = convertVal(uFrom, uTo, val1, val2, 0)
  $idA('unit_result1').innerHTML = convertVal(uFrom, uTo, val1, val2, 1)
  $idA('unit_result2').innerHTML = convertVal(uFrom, uTo, val1, val2, 2)
}

$type.onchange = () => typeChanged(true)
$from.onchange = () => typeChanged(false)
$to.onchange =
  $val1.onkeyup = $val1.onchange =
  $val2.onkeyup = $val2.onchange = resultChanged

$ready(function () {
  removeAllChildNodes($type)
  removeAllChildNodes($from)
  removeAllChildNodes($to)
  for (const unit in UNITS) {
    const $unit = document.createElement('option')
    $unit.innerHTML = unit
    $type.appendChild($unit)
  }
  $type.selectedIndex = 0
  typeChanged(true)
})
