<script lang="ts">
import DerivedField from './DerivedField.svelte'
import DerivedTable from './DerivedTable.svelte'
import DerivedTimestamp from './DerivedTimestamp.svelte'
import RawField from './RawField.svelte'
import RawTable from './RawTable.svelte'

import { fromHex, repStr, rolHex64Str, sha, xorHexStr } from './util'

interface Props {
  msg: string
  len: number
}

const { msg, len }: Props = $props()

const parts = $derived([
  msg.slice(0, 16),
  msg.slice(16, 36),
  msg.slice(36, 56),
  msg.slice(56, 60),
  msg.slice(60, 124),
  msg.slice(124, 126),
  msg.slice(126, 134),
  msg.slice(134)
])

// Derived
const C1 = $derived(len >= 16 && sha(1, parts[0]))
const C2 = $derived(len >= 124 && sha(256, msg.slice(0, 60) + msg.slice(124, len & ~1)))
const ABC = $derived(xorHexStr(parts[1], parts[2]))
const UT = $derived(
  !ABC.includes('?') && rolHex64Str(
    xorHexStr(
      rolHex64Str(
        parts[0],
        fromHex(ABC.slice(18))
      ),
      xorHexStr(
        '420B16B00B5F1337',
        ABC.slice(2, 18)
      )
    ),
    64 - fromHex(ABC.slice(0, 2))
  )
)
const UTD = $derived(UT && new Date(fromHex(UT) * 1000))

// Valid
const V1 = $derived(!!C1 && parts[1] === C1.slice(0, 20))
const V4 = $derived(parts[4] === C2)
const V5 = $derived(parts[5] === '01')
const V7 = $derived(parts[7] === '000000')
const VT = $derived(!!UTD && isFinite(+UTD))
const VA = $derived(V1 && V4 && V5 && V7)
</script>

<script lang="ts" module>
export function generate1_0 (timeHex: string, rHex: string): string {
  timeHex = timeHex.padStart(16, '0')
  rHex = rHex.padEnd(32, '0')

  const ABC = rHex.slice(0, 20)
  const A = fromHex(rHex.slice(0, 2))
  const B = rHex.slice(2, 18)
  const C = fromHex(rHex.slice(18, 20))
  const R2 = rHex.slice(20, 24)
  const R4 = rHex.slice(24, 32)
  const T = rolHex64Str(
    xorHexStr(
      xorHexStr(
        rolHex64Str(timeHex, A),
        B
      ),
      '420B16B00B5F1337'
    ),
    64 - C
  )

  // part 1
  const c1 = sha(1, T)
  const c1a = c1.slice(0, 20)
  const data0_30 = T + c1a + xorHexStr(c1a, ABC) + R2
  const data62 = '01' + R4 + '000000'
  // part 2
  const c2 = sha(256, data0_30 + data62)

  return data0_30 + c2 + data62
}
</script>

<div class="card mb-3">
  <div class="card-header">
    <h2 class="card-title">
      <a data-bs-toggle="collapse" href="#collapse1">
        v1 Format <span class={(VA ? `badge text-bg-${VT ? 'success' : 'warning'}` : 'd-none')}>Valid</span>
      </a>
    </h2>
  </div>
  <div id="collapse1" class="card-collapse collapse">
    <div class="card-body">
      <p>
        24 bytes (34.3% of all 70 bytes) contain information.
        v1 was released <a href="https://twitter.com/googuns_lulz/status/569285149172445184"><span class="timeago" title="2015-02-21T16:58:51.000-07:00">in Feb 2015</span></a> and used until <a href="https://twitter.com/googuns_lulz/status/840393340961079296"><span class="timeago" title="2017-03-10T19:46:00-07:00">Mar 2017</span></a>.
      </p>
      <RawTable>
        <RawField
          offset=0
          length=8
          desc="transformed 64-bit timestamp*"
          hexBytes={parts[0]}
        />
        <RawField
          offset=8
          length=10
          desc="hash1[:10]"
          hexBytes={parts[1]}
          valid={V1}
        />
        <RawField
          offset=18
          length=10
          desc="hash1[:10] xor (A+B+C)**"
          hexBytes={parts[2]}
        />
        <RawField
          offset=28
          length=2
          desc="undefined"
          hexBytes={parts[3]}
        />
        <RawField
          offset=30
          length=32
          desc="hash2"
          hexBytes={parts[4]}
          valid={V4}
        />
        <RawField
          offset=62
          length=1
          desc="version (0x01)"
          hexBytes={parts[5]}
          valid={V5}
        />
        <RawField
          offset=63
          length=4
          desc="undefined"
          hexBytes={parts[6]}
        />
        <RawField
          offset=67
          length=3
          desc="zero (0x000000)"
          hexBytes={parts[7]}
          valid={V7}
        />
      </RawTable>

      <DerivedTable>
        <DerivedField name="hash1 = sha1(data[:8])" hexBytes={C1 || repStr(40, '?')} />
        <DerivedField name="hash2 = sha256(data[:30] + data[62:])" hexBytes={C2 || repStr(64, '?')} />
        <DerivedField name="A + B + C" hexBytes={ABC || repStr(10, '?')} />
        <DerivedTimestamp hexBytes={UT || repStr(16, '?')} date={UTD} valid={VT} />
      </DerivedTable>

      <pre class="card card-body text-bg-light">
* transformed 64-bit timestamp = (([UNIX timestamp] &lt;&lt;&lt; A) ^ B ^ 0x420B16B00B5F1337) &gt;&gt;&gt; C
A: 1 random byte
B: 8 random bytes
C: 1 random byte

constant explanation:
  42 - reference to The Hitchhiker's Guide to the Galaxy by Douglas Adams
  0 - first separator
  0xB16B00B5 - reference to Microsoft and Linux
  F - last separator
  1337 - exercise for the reader
** originally supposed to be `hash1[10:] xor (A+B+C)`
      </pre>
    </div>
  </div>
</div>
