<script>
import DerivedField from './DerivedField'
import DerivedTable from './DerivedTable'
import DerivedTimestamp from './DerivedTimestamp'
import RawField from './RawField'
import RawTable from './RawTable'

import { includes, fromHex, repStr, xorHexStr } from './util'

export let msg
export let len

$: parts = [
  msg.slice(0, 16),
  msg.slice(16, 18),
  msg.slice(18, 128),
  msg.slice(128, 144),
  msg.slice(144, 274),
  msg.slice(274)
]

// Derived
let C0
$: {
  if (len >= 280) {
    C0 = msg.slice(0, 16)
    for (let i = 16; i < 272; i += 16) {
      if (i !== 128) {
        C0 = xorHexStr(C0, msg.slice(i, i + 16))
      }
    }
    C0 = xorHexStr(C0, msg.slice(272, 280) + msg.slice(272, 280))
  } else {
    C0 = undefined
  }
}
$: UT = len >= 122 ? xorHexStr(parts[0], msg.slice(122, 138)) : repStr(16, '?')
$: UTD = !includes(UT, '?') && new Date(fromHex(UT) * 1000)

$: V1 = parts[1] === '20'
$: V3 = !!C0 && parts[3] === C0
$: V5 = parts[5] === '000000'
$: VT = UTD && isFinite(+UTD)
$: VA = V1 && V3 && V5 && VT
</script>

<div class="card-group mb-3">
  <div class="card">
    <div class="card-header">
      <h4 class="card-title">
        <a data-toggle="collapse" href="#collapse2">
          <h2>v2.0 Format <span class={(VA ? 'badge badge-success' : 'd-none')}>Valid</span></h2>
        </a>
      </h4>
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
            offset=63
            length=4
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
</div>
