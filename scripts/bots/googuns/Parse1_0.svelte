<script>
import DerivedField from './DerivedField'
import DerivedTable from './DerivedTable'
import DerivedTimestamp from './DerivedTimestamp'
import RawField from './RawField'
import RawTable from './RawTable'

import { includes, fromHex, repStr, rolHex64Str, sha, xorHexStr } from './util'

export let msg
export let len

$: parts = [
  msg.slice(0, 16),
  msg.slice(16, 36),
  msg.slice(36, 56),
  msg.slice(56, 60),
  msg.slice(60, 124),
  msg.slice(124, 126),
  msg.slice(126, 134),
  msg.slice(134)
]

// Derived
$: C1 = len >= 16 && sha(1, parts[0])
$: C2 = len >= 124 && sha(256, msg.slice(0, 60) + msg.slice(124, len & ~1))
$: ABC = xorHexStr(parts[1], parts[2])
$: UT = !includes(ABC, '?') && rolHex64Str(
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
$: UTD = UT && new Date(fromHex(UT) * 1000)

// Valid
$: V1 = !!C1 && parts[1] === C1.slice(0, 20)
$: V4 = parts[4] === C2
$: V5 = parts[5] === '01'
$: V7 = parts[7] === '000000'
$: VT = !!UTD && isFinite(+UTD)
$: VA = V1 && V4 && V5 && V7 && VT
</script>

<div class="card-group mb-3">
  <div class="card">
    <div class="card-header">
      <h4 class="card-title">
        <a data-toggle="collapse" href="#collapse1">
          <h2>v1 Format <span class={(VA ? 'badge badge-success' : 'd-none')}>Valid</span></h2>
        </a>
      </h4>
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

        <pre class="card card-body bg-light">
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
</div>
