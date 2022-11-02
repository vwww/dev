<script lang="ts">
const enum NumMode {
  Result,
  ResultMem,
  Entering,
  EnteringNum,
  EnteringDec,
}

let display = '0'

let result = 0
let curNum = 0
let memNum = 0
let op = '+'
let numMode = NumMode.Result
let opPending = false

function calculate (): void {
  const isEntering = numMode > NumMode.Result

  if (opPending) {
    switch (op) {
      case '*':
        curNum = result
        result = getNum()
        break
      case '/':
        if (!isEntering) curNum = 1
        // fallthrough
      case '+':
      case '-':
        if (!isEntering) result = curNum
        curNum = getNum()
    }
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
      break
    case '/':
      result /= curNum
  }

  display = result.toString()
  numMode = NumMode.Result
  opPending = false
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
    result = 0
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

function memAdd (sub?: boolean): void {
  if (opPending) {
    calculate()
  } else {
    if (numMode >= NumMode.Entering) result = getNum()
    numMode = NumMode.Result
  }
  memNum += sub ? -result : result
}

// click handlers

function onClickAppend (this: HTMLElement): void { append(this.innerText) }
const onClickDec = appendDec
function onClickOperator (this: HTMLElement): void { doOp(this.innerText) }
const onClickEqual = calculate

function onClickSqrt (): void { applyFunc(Math.sqrt) }
function onClickSqr (): void { applyFunc((r) => r * r) }

function onClickMemRecallClear (): void {
  if (numMode === NumMode.ResultMem) {
    memNum = 0
  } else {
    memRecall()
  }
}

function onClickMemAdd (): void { memAdd() }
function onClickMemSub (): void { memAdd(true) }

// keyboard handler

const calcButton: Record<string, HTMLElement> = {}

function onKeyDown (event: KeyboardEvent): void {
  let key = event.key
  switch (key) {
    case '0': case '1': case '2': case '3': case '4':
    case '5': case '6': case '7': case '8': case '9':
    case '.':
    case '+': case '-': case '*': case '/':
    case '=':
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
    default:
      return
  }

  const btn = calcButton[key]
  btn?.focus()
  btn?.click()

  event.preventDefault()
}
</script>

<svelte:window on:keydown={onKeyDown} />

<div style="max-width: 576px; margin: auto">
  <div class="row mb-3"><input class="form-control text-center" value={`${display}${memNum ? ' M' : ''}`} readonly></div>
  <div class="row mb-2">
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" bind:this={calcButton['C']} on:click={clear}>C</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" bind:this={calcButton['%']} disabled>%</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" on:click={onClickSqrt}>sqrt</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" on:click={onClickSqr}>sqr</button></div>
  </div>
  <div class="row mb-2">
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" on:click={onClickMemRecallClear}>MRC</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" on:click={onClickMemSub}>M-</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" on:click={onClickMemAdd}>M+</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" on:click={clearEntry}>CE</button></div>
  </div>
  <div class="row mb-2">
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" bind:this={calcButton['7']} on:click={onClickAppend}>7</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" bind:this={calcButton['8']} on:click={onClickAppend}>8</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" bind:this={calcButton['9']} on:click={onClickAppend}>9</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" bind:this={calcButton['/']} on:click={onClickOperator}>/</button></div>
  </div>
  <div class="row mb-2">
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" bind:this={calcButton['4']} on:click={onClickAppend}>4</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" bind:this={calcButton['5']} on:click={onClickAppend}>5</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" bind:this={calcButton['6']} on:click={onClickAppend}>6</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" bind:this={calcButton['*']} on:click={onClickOperator}>*</button></div>
  </div>
  <div class="row mb-2">
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" bind:this={calcButton['1']} on:click={onClickAppend}>1</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" bind:this={calcButton['2']} on:click={onClickAppend}>2</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" bind:this={calcButton['3']} on:click={onClickAppend}>3</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" bind:this={calcButton['-']} on:click={onClickOperator}>-</button></div>
  </div>
  <div class="row mb-2">
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" bind:this={calcButton['0']} on:click={onClickAppend}>0</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" bind:this={calcButton['.']} on:click={onClickDec}>.</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" bind:this={calcButton['=']} on:click={onClickEqual}>=</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" bind:this={calcButton['+']} on:click={onClickOperator}>+</button></div>
  </div>
</div>
