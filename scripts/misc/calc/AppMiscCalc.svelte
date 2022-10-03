<script lang="ts">
const enum NumMode {
  Mem, // Result from Memory
  Result, // Result
  ResultOp, // Result with Operation
  Entering, // Entering number
}

let display = '0'

let result = 0
let curNum = 0
let memNum = 0
let op = '\0'
let numMode = NumMode.Result

function calculate (): void {
  switch (op) {
    case '+':
      result += curNum
      break
    case '-':
      result -= curNum
      break
    case '*':
      if (numMode === NumMode.Entering) {
        // left-multiply trick
        [result, curNum] = [result * curNum, result]
      } else {
        result *= curNum
      }
      break
    case '/':
      if (numMode === NumMode.ResultOp) {
        // reciprocal
        result = 1
      }
      result /= curNum
      break
    default:
      result = curNum
  }

  display = result.toString()
  numMode = NumMode.Result
}

function append (s: string): void {
  if (numMode !== NumMode.Entering) {
    numMode = NumMode.Entering
    display = s
  } else {
    if (s === '.' && display.includes('.')) return
    if (s === '0' && display === '0') return

    display += s
  }
}

function clearEntry (): void {
  curNum = 0
  numMode = NumMode.Result
  display = '0'
}

function clear (): void {
  clearEntry()
  op = '\0'
  result = 0
}

function getNum (): number {
  try {
    return Number(display)
  } catch {
    return 0
  }
}

function onClickEqual (): void {
  if (numMode !== NumMode.Result) {
    if (numMode === NumMode.ResultOp) {
      result = curNum
    }
    curNum = getNum()
  }
  calculate()
}

function doOp (newOp: string): void {
  if (numMode === NumMode.Entering) {
    curNum = getNum()
    calculate()
  }
  op = newOp
  numMode = NumMode.ResultOp
}

function onClickAppend (this: HTMLElement): void { append(this.innerText) }
function onClickOperator (this: HTMLElement): void { doOp(this.innerText) }

function onClickSqrt (): void {
  const r = getNum()
  display = Math.sqrt(r).toString()
}

function onClickSqr (): void {
  const r = getNum()
  display = (r * r).toString()
}

function onClickMemRecallClear (): void {
  if (numMode === NumMode.Mem) {
    memNum = 0
    clear()
  } else {
    display = (result = memNum).toString()
    numMode = NumMode.Mem
  }
}

function onClickMemAdd (): void {
  if (numMode > NumMode.Result) onClickEqual()
  else if (numMode === NumMode.Mem) numMode = NumMode.Result
  memNum += result
}

function onClickMemSub (): void {
  if (numMode > NumMode.Result) onClickEqual()
  else if (numMode === NumMode.Mem) numMode = NumMode.Result
  memNum -= result
}

function onKeyDown (event: KeyboardEvent): void {
  switch (event.key) {
    case '0':
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
    case '8':
    case '9':
    case '.':
      append(event.key)
      break
    case '+':
    case '-':
    case '*':
    case '/':
      doOp(event.key)
      break
    case 'c':
    case 'C':
      if (event.ctrlKey || event.metaKey || event.altKey) break
    case 'Backspace':
    case 'Escape':
      clear()
      break
    case '=':
    case 'Enter':
      onClickEqual()
      break
    default:
      return
  }

  event.preventDefault()
}
</script>

<svelte:window on:keydown={onKeyDown} />

<div style="max-width: 576px; margin: auto">
  <div class="row mb-3"><input class="form-control text-center" value={display} readonly></div>
  <div class="row mb-2">
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" on:click={clear}>C</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" disabled>%</button></div>
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
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" on:click={onClickAppend}>1</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" on:click={onClickAppend}>2</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" on:click={onClickAppend}>3</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" on:click={onClickOperator}>+</button></div>
  </div>
  <div class="row mb-2">
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" on:click={onClickAppend}>4</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" on:click={onClickAppend}>5</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" on:click={onClickAppend}>6</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" on:click={onClickOperator}>-</button></div>
  </div>
  <div class="row mb-2">
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" on:click={onClickAppend}>7</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" on:click={onClickAppend}>8</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" on:click={onClickAppend}>9</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" on:click={onClickOperator}>*</button></div>
  </div>
  <div class="row mb-2">
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" on:click={onClickEqual}>=</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" on:click={onClickAppend}>0</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100"on:click={onClickAppend}>.</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100"on:click={onClickOperator}>/</button></div>
  </div>
</div>
