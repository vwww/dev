<script lang="ts" context="module">
import { ValueStore } from '../../../util/svelte'

export type OptionStore<T, K extends string, E extends any[] = []> = [[string, K, T, string, string, ...E], ValueStore<T>]
export type OptionStoreBool = OptionStore<boolean, 'b'>
export type OptionStoreInt = OptionStore<number, 'i', [number, number, object?]>
export type OptionStoreEnum = OptionStore<number, 'e', [string[]]>

export type OptionStoreAny =
  | OptionStoreBool
  | OptionStoreInt
  | OptionStoreEnum
</script>

<script lang="ts">
import RoomOptionBool from './RoomOptionBool.svelte'
import RoomOptionEnum from './RoomOptionEnum.svelte'
import RoomOptionInt from './RoomOptionInt.svelte'

export let optionStore: OptionStoreAny

let option: any
let store: ValueStore<any>
$: [option, store] = optionStore
</script>

{#if optionStore[0][1] === 'b'}
  <RoomOptionBool {option} {store} />
{:else if optionStore[0][1] === 'i'}
  <RoomOptionInt {option} {store} />
{:else if optionStore[0][1] === 'e'}
  <RoomOptionEnum {option} {store} />
{:else}
  unknown option {option}
{/if}
