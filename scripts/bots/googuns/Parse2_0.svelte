<script lang="ts">
import DerivedField from './DerivedField.svelte'
import DerivedTable from './DerivedTable.svelte'
import DerivedTimestamp from './DerivedTimestamp.svelte'
import RawField from './RawField.svelte'
import RawTable from './RawTable.svelte'

import { fromHex, repStr, xorHexStr } from './util'

interface Props {
  msg: string
  len: number
}

const { msg, len }: Props = $props()

const parts = $derived([
  msg.slice(0, 16),
  msg.slice(16, 18),
  msg.slice(18, 128),
  msg.slice(128, 144),
  msg.slice(144, 274),
  msg.slice(274)
])

// Derived
const C0 = $derived.by(() => {
  if (len >= 280) {
    let C0 = msg.slice(0, 16)
    for (let i = 16; i < 272; i += 16) {
      if (i !== 128) {
        C0 = xorHexStr(C0, msg.slice(i, i + 16))
      }
    }
    return xorHexStr(C0, msg.slice(272, 280) + msg.slice(272, 280))
  } else {
    return undefined
  }
})
const UT = $derived(len >= 122 ? xorHexStr(parts[0], msg.slice(122, 138)) : repStr(16, '?'))
const UTD = $derived(!UT.includes('?') && new Date(fromHex(UT) * 1000))

const V1 = $derived(parts[1] === '20')
const V3 = $derived(!!C0 && parts[3] === C0)
const V5 = $derived(parts[5] === '000000')
const VT = $derived(UTD && isFinite(+UTD))
const VA = $derived(V1 && V3 && V5)
</script>

<script lang="ts" module>
export function generate2_0 (timeHex: string, rHex: string): string {
  timeHex = timeHex.padStart(16, '0').slice(0, 16)
  rHex = rHex.padEnd(240, '0')

  const data8_64 = '20' + rHex.slice(0, 110) // version + R55
  const data72_140 = rHex.slice(110, 240) + '000000' // R65 + zero

  // C = checksum without T field (data[:8] not filled yet)
  let C = data72_140.slice(128)
  C += C
  for (let i = 0; i < 112; i += 16) {
    C = xorHexStr(C, data8_64.slice(i, i + 16))
  }
  for (let i = 0; i < 128; i += 16) {
    C = xorHexStr(C, data72_140.slice(i, i + 16))
  }

  // T = timestamp ^ data[61:69]
  // T[x] will affect T[x+3]
  let T = xorHexStr(timeHex, data8_64.slice(106) + '0000000000')
  T = xorHexStr(T, '000000' + C.slice(0, 10)) // T ^= C >> 24
  T = xorHexStr(T, '000000' + T.slice(0, 6) + xorHexStr(T.slice(6, 10), T.slice(0, 4))) // T ^= (T >> 24) ^ (T >> 48)

  return T + data8_64 + xorHexStr(C, T) + data72_140
}
</script>

<div class="card mb-3">
  <div class="card-header">
    <h2 class="card-title">
      <a data-bs-toggle="collapse" href="#collapse2">
        v2.0 Format <span class={(VA ? `badge text-bg-${VT ? 'success' : 'warning'}` : 'd-none')}>Valid</span>
      </a>
    </h2>
  </div>
  <div id="collapse2" class="card-collapse collapse">
    <div class="card-body">
      <p>
        128 bytes (91.4% of all 140 bytes) contain information (are not red/green in the table).
        v2.0 was released <a href="https://twitter.com/googuns_lulz/status/938952772610904069"><span class="timeago" title="2017-12-07T19:06:00-07:00">in Dec 2017</span></a>.
      </p>
      <RawTable>
        <RawField
          offset=0
          length=8
          desc="64-bit UNIX timestamp ^ data[61:69]"
          hexBytes={parts[0]}
        />
        <RawField
          offset=8
          length=1
          desc="version (0x20)"
          hexBytes={parts[1]}
          valid={V1}
        />
        <RawField
          offset=9
          length=55
          desc="undefined"
          hexBytes={parts[2]}
        />
        <RawField
          offset=64
          length=8
          desc="checksum"
          hexBytes={parts[3]}
          valid={V3}
        />
        <RawField
          offset=72
          length=65
          desc="undefined"
          hexBytes={parts[4]}
        />
        <RawField
          offset=137
          length=3
          desc="zero (0x000000)"
          hexBytes={parts[5]}
          valid={V5}
        />
      </RawTable>

      <DerivedTable>
        <DerivedTimestamp hexBytes={UT || repStr(16, '?')} date={UTD} valid={VT} />
        <DerivedField name="checksum" hexBytes={C0 || repStr(16, '?')} />
      </DerivedTable>

      <p>The checksum is such that the XOR of the 64-bit words (18 in total) of <code>data + data[136:]</code> is zero.</p>
      <p>
        checksum =
        <code>
          data[:8] ^ data[8:16] ^ data[8:16] ^ data[16:24] ^
          data[24:32] ^ data[32:40] ^ data[40:48] ^ data[48:56] ^
          data[56:64] ^ 0 ^ data[72:80] ^ data[80:88] ^
          data[88:96] ^ data[96:104] ^ data[104:112] ^ data[112:120] ^
          data[120:128] ^ data[128:136] ^ ((data[136:] &lt;&lt; 32) ^ data[136:])
        </code>
      </p>
    </div>
  </div>
</div>
