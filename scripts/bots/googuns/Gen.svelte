<script lang="ts">
import { generate1_0 } from './Parse1_0.svelte'
import { generate1_1 } from './Parse1_1.svelte'
import { generate2_0 } from './Parse2_0.svelte'

import { fromHex } from './util'

interface Props {
  onMsg: (msg: string) => void;
}

const { onMsg }: Props = $props();

let timestampStr = $state('')
let timestampNum = $state(0)
let timestampHex = $state('00000000')
let udHex = $state('')

function setTimeCurrent (): void {
  timestampNum = Math.floor(Date.now() / 1000)
  recalcTimeFromNum()
}

function setTimeRandom (): void {
  timestampHex = randomHex(8)
  recalcTimeFromHex()
}

function setTimeRandomJS (): void {
  timestampNum = Math.floor(Math.random() * 8640000000001)
  recalcTimeFromNum()
}

function getDateTimeStr (num: number) {
  try {
    let s = new Date(num * 1000).toISOString().slice(0, -1)
    if (s.charAt(0) == '+') s = s.slice(1)
    if (s.charAt(0) == '0') s = s.slice(1)
    return s
  } catch {
    return ''
  }
}

function recalcTimeFromNum (): void {
  timestampHex = timestampNum.toString(16).padStart(16, '0')
  timestampStr = getDateTimeStr(timestampNum)
}

function recalcTimeFromHex (): void {
  timestampNum = fromHex(timestampHex)
  timestampStr = getDateTimeStr(timestampNum)
}

function recalcTimeFromStr (): void {
  if (timestampStr) {
    const i = timestampStr.indexOf('-')
    timestampNum = Math.floor(Date.parse((i > 5 ? '+' : i > 4 ? '+0' : '') + timestampStr) / 1000)
  } else {
    timestampNum = 0
  }
  timestampHex = timestampNum.toString(16).padStart(16, '0')
}

function randomHex (len: number): string {
  const data = new Uint8Array(len)
  if (window.crypto) {
    window.crypto.getRandomValues(data)
  } else {
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 256 | 0
    }
  }
  return Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('')
}
</script>

<div class="card mb-3">
  <div class="card-header">
    <h2 class="card-title">
      <a data-bs-toggle="collapse" href="#collapseGen">
        Generator
      </a>
    </h2>
  </div>
  <div id="collapseGen" class="card-collapse collapse">
    <div class="card-body">
      <div class="btn-group d-flex mb-3" role="group">
        <span class="input-group-text">Generate</span>
        <button class="w-100 btn btn-outline-primary" onclick={() => onMsg(generate1_0(timestampHex, udHex))}>v1</button>
        <button class="w-100 btn btn-outline-primary" onclick={() => onMsg(generate1_1(timestampHex, udHex))}>v1.1</button>
        <button class="w-100 btn btn-outline-primary" onclick={() => onMsg(generate2_0(timestampHex, udHex))}>v2.0</button>
      </div>

      <div class="input-group d-flex mb-2" role="group">
        <span class="input-group-text">Timestamp</span>
        <input bind:value={timestampStr} onchange={recalcTimeFromStr} type="datetime-local" class="form-control">
        <input bind:value={timestampNum} onchange={recalcTimeFromNum} type="number" class="form-control" min="0" step="1">
        <input bind:value={timestampHex} onchange={recalcTimeFromHex} type="text" class="form-control" placeholder={'0'.repeat(16)} maxlength="16">
        <button class="btn btn-outline-warning" onclick={setTimeCurrent}>Current</button>
        <button class="btn btn-outline-danger" onclick={setTimeRandom}>Random 64-bit</button>
        <button class="btn btn-outline-danger" onclick={setTimeRandomJS}>Random JS</button>
      </div>

      <div class="btn-group d-flex mb-1" role="group">
        <span class="input-group-text w-100">Undefined Data (UD)</span>
        <button class="btn btn-outline-danger" onclick={() => udHex = ''}>Zero</button>
        <button class="btn btn-outline-danger" onclick={() => udHex = randomHex(120)}>Random</button>
      </div>
      <textarea class="form-control mb-2" bind:value={udHex} maxlength="240" placeholder={'0'.repeat(240)}></textarea>

      <p>v1 uses UD[:16], v1.1 UD[:56], and v2.0 UD[:120].</p>
    </div>
  </div>
</div>
