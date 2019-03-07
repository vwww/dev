<script>
import Parse2_0 from './Parse2_0'

import { repStr } from './util'

export let value

const EXPECTED_LEN = 280

$: len = value.length
$: msg =
  len < EXPECTED_LEN
  ? value + repStr(EXPECTED_LEN - len, '?')
  : len > EXPECTED_LEN
    ? value.slice(0, EXPECTED_LEN)
    : value
</script>

<Parse2_0 {msg} {len} />
