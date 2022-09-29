<script lang="ts">
let display = '0'

let result = 0n
let curNum = 0n
let op = '\0'
let isEntering = false

function calculate (): void {
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
      break
    default:
      result = curNum
  }

  display = result.toString()
  isEntering = false
}

function append (s: string): void {
  if (!isEntering) {
    isEntering = true
    display = ''
  }

  if (s === '.' && display.includes('.')) return
  if (s === '0' && display === '0') return

  display += s
}

function clear (): void {
  op = '\0'
  curNum = 0n
  isEntering = false
  display = '0'
}

function updateCurNum (): void {
  try {
    curNum = BigInt(display)
  } catch {
    curNum = 0n
  }
}

function calc (): void {
  if (isEntering) updateCurNum()
  calculate()
}

function doOp (newOp: string): void {
  if (isEntering) {
    updateCurNum()
    calculate()
  }
  op = newOp
}

function onClickAppend (this: HTMLElement): void { append(this.innerText) }
function onClickOperator (this: HTMLElement): void { doOp(this.innerText) }

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
      calc()
      break
    default:
      return
  }

  event.preventDefault()
}
</script>

<svelte:window on:keydown={onKeyDown} />

<div class="container-md">
  <div class="row mb-3"><input class="form-control text-center" value={display} readonly></div>
  <div class="row mb-2">
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" on:click={clear}>C</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" disabled>%</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" disabled>sqrt</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" disabled>sqr</button></div>
  </div>
  <div class="row mb-2">
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" disabled>MRC</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" disabled>M-</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" disabled>M+</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" disabled>CE</button></div>
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
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" on:click={calc}>=</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100" on:click={onClickAppend}>0</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100"on:click={onClickAppend}>.</button></div>
    <div class="col-3"><button class="btn btn-outline-secondary d-block w-100"on:click={onClickOperator}>/</button></div>
  </div>
</div>
