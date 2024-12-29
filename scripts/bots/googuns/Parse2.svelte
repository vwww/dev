<script lang="ts">
import Parse2_0 from './Parse2_0.svelte'

import { repStr } from './util'

interface Props {
  value: string
}

const { value }: Props = $props()

const EXPECTED_LEN = 280

const len = $derived(value.length)
const msg = $derived(
  len < EXPECTED_LEN
  ? value + repStr(EXPECTED_LEN - len, '?')
  : len > EXPECTED_LEN
    ? value.slice(0, EXPECTED_LEN)
    : value
)
</script>

<Parse2_0 {msg} {len} />
