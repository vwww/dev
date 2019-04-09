import { $idA, $ready } from './util'

const $inNum = $idA<HTMLInputElement>('inNumber')
const $inBase = $idA<HTMLInputElement>('inBase')
const $outNum = $idA<HTMLInputElement>('outNumber')
const $outBase = $idA<HTMLInputElement>('outBase')

function update (): void {
  $outNum.value = parseInt($inNum.value, +$inBase.value).toString(+$outBase.value)
}

$inNum.addEventListener('change', update)
$inBase.addEventListener('change', update)
$outBase.addEventListener('change', update)
$ready(update)
