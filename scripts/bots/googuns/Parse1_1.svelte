<script lang="ts">
import DerivedField from './DerivedField.svelte'
import DerivedTable from './DerivedTable.svelte'
import DerivedTimestamp from './DerivedTimestamp.svelte'
import RawField from './RawField.svelte'
import RawTable from './RawTable.svelte'

import { fromHex, repStr, sha, xorHexStr } from './util'

interface Props {
  msg: string
  len: number
}

const { msg, len }: Props = $props()

const parts = $derived([
  msg.slice(0, 16),
  msg.slice(16, 18),
  msg.slice(18, 20),
  msg.slice(20, 124),
  msg.slice(124, 126),
  msg.slice(126, 134),
  msg.slice(134)
])

// Derived
const C0 = $derived(len >= 20 && sha(256, msg.slice(20, len & ~1)))
const C1 = $derived(len >= 16 && sha(1, parts[0]))
const UT = $derived(xorHexStr(parts[0], xorHexStr(msg.slice(18, 34), msg.slice(64, 80))))
const UTD = $derived(!UT.includes('?') && new Date(fromHex(UT) * 1000))

// Valid
const V1 = $derived(!!C1 && parts[1] === xorHexStr(C1.slice(0, 2), 'FF'))
const V2 = $derived(!!C0 && parts[2] === C0.slice(2, 4))
const V4 = $derived(parts[4] === '01')
const V6 = $derived(parts[6] === '000000')
const VT = $derived(UTD && isFinite(+UTD))
const VA = $derived(V1 && V2 && V4 && V6)
</script>

<script lang="ts" module>
export function generate1_1 (timeHex: string, rHex: string): string {
  timeHex = timeHex.padStart(16, '0')
  rHex = rHex.padEnd(112, '0')

  const R4 = rHex.slice(0, 8)
  const R52 = rHex.slice(8, 112)

  const data10_70 = R52 + '01' + R4 + '000000'

  const c0 = sha(256, data10_70)
  const data9 = c0.slice(2, 4)

  const T = xorHexStr(
    xorHexStr(
      timeHex,
      data9 + R52.slice(0, 14), // data[9:17]
    ),
    R52.slice(44, 60) // data[32:40]
  )

  const c1 = sha(1, T)
  const data8 = xorHexStr('ff', c1.slice(0, 2))

  return T + data8 + data9 + data10_70
}
</script>

<div class="card mb-3">
  <div class="card-header">
    <h2 class="card-title">
      <a data-bs-toggle="collapse" href="#collapse1_1">
        v1.1 Format <span class={(VA ? `badge text-bg-${VT ? 'success' : 'warning'}` : 'd-none')}>Valid</span>
      </a>
    </h2>
  </div>
  <div id="collapse1_1" class="card-collapse collapse">
    <div class="card-body">
      <p>
        64 bytes (91.4% of all 70 bytes) contain information (are not red/green in the table).
        v1.1 was released <a href="https://twitter.com/googuns_lulz/status/840393590639603713"><span class="timeago" title="2017-03-10T19:47:00-07:00">in Mar 2017</span></a> and used until <a href="https://twitter.com/googuns_lulz/status/938952520172494849"><span class="timeago" title="2017-12-07T19:05:00-07:00">Dec 2017</span></a>.
      </p>
      <p>
        All valid messages in v1.1 or v1 Format are guaranteed to be invalid in the other.
        Compared to v1, v1.1 has less redundancy.
      </p>
      <RawTable>
        <RawField
          offset=0
          length=8
          desc="64-bit UNIX timestamp ^ data[9:17] ^ data[32:40]"
          hexBytes={parts[0]}
        />
        <RawField
          offset=8
          length=1
          desc="~hash1[0]"
          hexBytes={parts[1]}
          valid={V1}
        />
        <RawField
          offset=9
          length=1
          desc="hash0[1]"
          hexBytes={parts[2]}
          valid={V2}
        />
        <RawField
          offset=10
          length=52
          desc="undefined"
          hexBytes={parts[3]}
        />
        <RawField
          offset=62
          length=1
          desc="version (0x01)"
          hexBytes={parts[4]}
          valid={V4}
        />
        <RawField
          offset=63
          length=4
          desc="undefined"
          hexBytes={parts[5]}
        />
        <RawField
          offset=67
          length=3
          desc="zero (0x000000)"
          hexBytes={parts[6]}
          valid={V6}
        />
      </RawTable>

      <DerivedTable>
        <DerivedTimestamp hexBytes={UT || repStr(16, '?')} date={UTD} valid={VT} />
        <DerivedField name="hash0 = sha256(data[10:])" hexBytes={C0 || repStr(64, '?')} />
        <DerivedField name="hash1 = sha1(data[:8])" hexBytes={C1 || repStr(40, '?')} />
      </DerivedTable>
    </div>
  </div>
</div>
