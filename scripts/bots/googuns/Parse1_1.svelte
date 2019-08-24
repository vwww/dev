<script>
import DerivedField from './DerivedField'
import DerivedTable from './DerivedTable'
import DerivedTimestamp from './DerivedTimestamp'
import RawField from './RawField'
import RawTable from './RawTable'

import { includes, fromHex, repStr, sha, xorHexStr } from './util'

export let msg
export let len

$: parts = [
  msg.slice(0, 16),
  msg.slice(16, 18),
  msg.slice(18, 20),
  msg.slice(20, 124),
  msg.slice(124, 126),
  msg.slice(126, 134),
  msg.slice(134)
]

// Derived
$: C0 = len >= 20 && sha(256, msg.slice(20, len & ~1))
$: C1 = len >= 16 && sha(1, parts[0])
$: UT = xorHexStr(parts[0], xorHexStr(msg.slice(18, 34), msg.slice(64, 80)))
$: UTD = !includes(UT, '?') && new Date(fromHex(UT) * 1000)

// Valid
$: V1 = !!C1 && parts[1] === xorHexStr(C1.slice(0, 2), 'FF')
$: V2 = !!C0 && parts[2] === C0.slice(2, 4)
$: V4 = parts[4] === '01'
$: V6 = parts[6] === '000000'
$: VT = UTD && isFinite(+UTD)
$: VA = V1 && V2 && V4 && V6 && VT
</script>

<div class="card-group mb-3">
  <div class="card">
    <div class="card-header">
      <h4 class="card-title">
        <a data-toggle="collapse" href="#collapse1_1">
          <h2>v1.1 Format <span class={(VA ? 'badge badge-success' : 'd-none')}>Valid</span></h2>
        </a>
      </h4>
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
            offset=8
            length=10
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
</div>
