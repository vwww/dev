import { Solver } from './game/fill/Solver'
import { $idA, $ready } from './util'

// TODO move to text file?
const BOARDS = `D!00
CD!10
aaBaaBD!02
DDaaC!10
EEbbA!23
caAEE!01
aaAEEaaC!22
DaaBEE!22
EEEabA!03
EDbaBE!22
DEaaCE!00
baBEEE!31
EaaCEDB!00
abBEEEaaA!12
acAabBEEE!41
abAEcaAEE!32
aaCaaCEEbbA!40
EaaCEDaaB!30
aaAEEED!22
aaBEaaCED!42
DEaaCEaaB!13
CDEaaCE!21
EEbaBabBaaC!41
EECEC!10
aaBEaaCcaAE!33
ECEEaaC!23
EbaBbaBDE!12
EEEEaaA!01
EabBEED!31
EEaaBED!00
aaCcaAEEcaA!32
EEDEC!20
EaaCaaBEE!40
DCEEE!42
caAEEEaaB!12
EEcaAaaCE!03
baBEcaAEE!30
EEEabBE!21
EEbaBDE!02
aaCEEEbaB!43
EEaaCEbaB!23
EaaBEEE!00 << error (need new rule to prevent shortcut)
EEbaBDE!11
EabBEEE!43
EEEaaCE!33 << error^
bbBFaabaAFaaD!00
EFaaDaaDD!34
FECFE!04
cbAcbAcaBFF!10
FFEacBaaD!02
EFbaCaaDaaaaB!20
abBFaabaAFF!24
abCFaaaaBaaDF!40
cbAdaAFcaBE!43
EbaCFcaBD!14












































`.split(/[\r\n]+/)

const ROWS = 8
const COLS = 8

const solver = new Solver(ROWS, COLS)

const $gridTextNum = $idA<HTMLInputElement>('gridTextNum')
const $gridText = $idA<HTMLTextAreaElement>('gridText')
const $cells: HTMLTableDataCellElement[][] = []

function updateRendering () {
  const root = solver.getRoot()
  for (let r = 0; r < ROWS; r++) {
    const $row = $cells[r]
    for (let c = 0; c < COLS; c++) {
      const cell = solver.getCell(r, c)

      let className = 'fill'

      if (cell.solver.mYes) className += ' fill-solved'

      if (root && root !== cell && root.solver.ufFind() === cell.solver.ufFind()) className += ' fill-to-root'

      if (cell.isRoot) className += ' fill-root'
      else if (!cell.active) className += ' fill-disabled'

      $row[c].className = className

      cell.solver.moves.forEach((m, i) => {
        $row[c].children[i].className = ['', 'fill-m', 'fill-y'][m]
      })
    }
  }
}

function updateTextBox () {
  $gridText.value = solver.toString()
}

function recompute () {
  solver.solve()
  updateRendering()
  updateTextBox()
}

$ready(function () {
  const $table = $idA<HTMLTableElement>('fill-table')
  $table.appendChild(document.createElement('tbody'))

  for (let r = 0; r < ROWS; r++) {
    const $row = $table.insertRow(-1)
    const $cellRow: HTMLTableDataCellElement[] = []
    $cells.push($cellRow)

    for (let c = 0; c < COLS; c++) {
      const $cell = $row.insertCell(-1)
      $cellRow.push($cell)

      $cell.className = 'fill'
      $cell.addEventListener('click', () => {
        solver.invertCell(r, c)
        recompute()
      })
      $cell.addEventListener('contextmenu', event => {
        event.preventDefault()
        solver.setRoot(r, c)
        recompute()
        return false
      })

      for (let i = 0; i < 4; i++) {
        $cell.appendChild(document.createElement('div'))
      }
    }
  }

  function loadString (): void {
    solver.loadString($gridText.value)
    recompute()
  }

  $gridText.addEventListener('change', loadString)

  $gridTextNum.addEventListener('change', () => {
    $gridText.value = BOARDS[+$gridTextNum.value - 1]
    loadString()
  })
  $gridTextNum.max = BOARDS.length.toString()

  recompute()
})
