<script lang="ts">
import type { OptionStoreAny, OptionStoreBool, OptionStoreEnum, OptionStoreInt, OptionStoreBigInt } from './RoomOption'

import RoomOptionBool from './RoomOptionBool.svelte'
import RoomOptionEnum from './RoomOptionEnum.svelte'
import RoomOptionInt from './RoomOptionInt.svelte'

interface Props {
  optionStore: OptionStoreAny
}

const { optionStore }: Props = $props()

const [option, store] = $derived(optionStore)
</script>

{#if option[1] === 'b'}
  <RoomOptionBool {option} store={store as OptionStoreBool[1]} />
{:else if option[1] === 'i' || option[1] === 'I'}
  <RoomOptionInt {option} store={store as OptionStoreInt[1] | OptionStoreBigInt[1]} />
{:else if option[1] === 'e'}
  <RoomOptionEnum {option} store={store as OptionStoreEnum[1]} />
{:else}
  unknown option type {option[1]} ({option})
{/if}
