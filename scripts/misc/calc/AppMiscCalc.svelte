<script lang="ts">
const enum NumMode {
  Result,
  ResultMem,
  Entering,
  EnteringNum,
  EnteringDec,
}

let display = $state('0')

let result = 0
let curNum = 0
let memNum = $state(0)
let op = '+'
let numMode = NumMode.Result
let opPending = false

function calculate (percent?: boolean): void {
  const isEntering = numMode > NumMode.Result

  if (percent && (op === '+' || op === '-')) {
    if (!isEntering) return

    if (opPending) {
      curNum = result
      opPending = false
    }

    result = curNum + curNum * getNum() / (op === '-' ? -100 : 100)
  } else {
    if (opPending) {
      switch (op) {
        case '*':
          curNum = result
          result = getNum()
          break
        case '/':
          curNum = 1
          // fallthrough
        case '+':
        case '-':
          if (!isEntering) result = curNum
          curNum = getNum()
      }
      opPending = false
    } else if (isEntering) {
      result = getNum()
    }

    switch (op) {
      case '+':
        result += curNum
        break
      case '-':
        result -= curNum
        break
      case '*':
        result *= curNum
        if (percent) result /= 100
        break
      case '/':
        result /= curNum
        if (percent) result *= 100
    }
  }

  display = result.toString()
  numMode = NumMode.Result
}

function append (s: string): void {
  if (numMode < NumMode.EnteringNum) {
    numMode = NumMode.EnteringNum
    display = s
  } else {
    if (s === '0' && display === '0') return

    display += s
  }
}

function appendDec (): void {
  if (numMode < NumMode.EnteringNum) {
    numMode = NumMode.EnteringDec
    display = '0.'
  } else if (numMode !== NumMode.EnteringDec) {
    numMode = NumMode.EnteringDec

    display += '.'
  }
}

function clearEntry (): void {
  if (numMode > NumMode.Result) {
    display = '0'
    numMode = NumMode.Entering
  }
}

function clear (): void {
  display = '0'
  result = 0
  curNum = 0
  op = '+'
  numMode = NumMode.Result
}

function getNum (): number {
  try {
    return Number(display)
  } catch {
    return 0
  }
}

function doOp (newOp: string): void {
  if (numMode > NumMode.Result && opPending) {
    calculate()
  }
  result = getNum()
  op = newOp
  numMode = NumMode.Result
  opPending = true
}

function applyFunc (f: (n: number) => number): void {
  const r = getNum()
  display = f(r).toString()
  numMode = NumMode.Entering
}

function memRecall (): void {
  display = (result = memNum).toString()
  numMode = NumMode.ResultMem
}

function memClear (): void {
  memNum = 0
}

function memRecallClear (): void {
  (numMode === NumMode.ResultMem ? memClear : memRecall)()
}

function memAdd (sub?: boolean): void {
  if (opPending) {
    calculate()
  } else {
    if (numMode >= NumMode.Entering) result = getNum()
    numMode = NumMode.Result
  }
  memNum += sub ? -result : result
}

// click handler adapters

function onClickAppend (this: HTMLElement): void { append(this.innerText) }
function onClickOperator (this: HTMLElement): void { doOp(this.innerText) }

// keyboard handler

const calcButton: Record<string, HTMLElement> = $state({})

function onkeydown (event: KeyboardEvent): void {
  let key = event.key
  switch (key) {
    case '0': case '1': case '2': case '3': case '4':
    case '5': case '6': case '7': case '8': case '9':
    case '.':
    case '+': case '-': case '*': case '/':
    case '=': case '%':
      break
    case 'c':
    case 'C':
      if (event.ctrlKey || event.metaKey || event.altKey) return
    case 'Backspace':
    case 'Escape':
      key = 'C'
      break
    case 'Enter':
      key = '='
      break
    case 'Delete':
      key = 'CE'
    default:
      return
  }

  const btn = calcButton[key]
  btn?.focus()
  btn?.click()

  event.preventDefault()
}

const buttons: [string, (this: HTMLButtonElement, event: MouseEvent) => void][][] = [
  [
    ['C', clear],
    ['%', () => calculate(true)],
    ['\u221a', () => applyFunc(Math.sqrt)],
    ['\xb2', () => applyFunc((r) => r * r)],
  ],
  [
    ['MRC', memRecallClear],
    ['M-', () => memAdd(true)],
    ['M+', () => memAdd()],
    ['CE', clearEntry],
  ],
  [
    ['7', onClickAppend],
    ['8', onClickAppend],
    ['9', onClickAppend],
    ['/', onClickOperator],
  ],
  [
    ['4', onClickAppend],
    ['5', onClickAppend],
    ['6', onClickAppend],
    ['*', onClickOperator],
  ],
  [
    ['1', onClickAppend],
    ['2', onClickAppend],
    ['3', onClickAppend],
    ['-', onClickOperator],
  ],
  [
    ['0', onClickAppend],
    ['.', appendDec],
    ['=', () => calculate()],
    ['+', onClickOperator],
  ],
]
</script>

<svelte:window {onkeydown} />

<div style="max-width: 576px; margin: auto">
  <div class="row mb-3"><input class="form-control text-center" value="{display}{memNum ? ' M' : ''}" readonly></div>
  {#each buttons as row}
    <div class="row mb-2">
      {#each row as button}
        <div class="col-3">
          <button class="btn btn-outline-secondary d-block w-100" bind:this={calcButton[button[0]]} onclick={button[1]}>{button[0]}</button>
        </div>
      {/each}
    </div>
  {/each}
</div>
