<script lang="ts">
import Parse1_0 from './Parse1_0.svelte'
import Parse1_1 from './Parse1_1.svelte'

import { repStr } from './util'

interface Props {
  value: string
}

const { value }: Props = $props()

const EXPECTED_LEN = 140

const len = $derived(value.length)
const msg = $derived(
  len < EXPECTED_LEN
  ? value + repStr(EXPECTED_LEN - len, '?')
  : len > EXPECTED_LEN
    ? value.slice(0, EXPECTED_LEN)
    : value
)
</script>

<Parse1_1 {msg} {len} />
<Parse1_0 {msg} {len} />
