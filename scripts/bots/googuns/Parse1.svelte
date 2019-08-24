<script>
import Parse1_0 from './Parse1_0'
import Parse1_1 from './Parse1_1'

import { repStr } from './util'

export let value

const EXPECTED_LEN = 140

$: len = value.length
$: msg =
  len < EXPECTED_LEN
  ? value + repStr(EXPECTED_LEN - len, '?')
  : len > EXPECTED_LEN
    ? value.slice(0, EXPECTED_LEN)
    : value
</script>

<Parse1_1 {msg} {len} />
<Parse1_0 {msg} {len} />
