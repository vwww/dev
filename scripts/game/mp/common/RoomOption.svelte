<script lang="ts" context="module">
import { ValueStore } from '@/util/svelte'

export type Options<T, K extends string, E extends unknown[] = []> = readonly [id: string, type: K, defaultValue: T, name: string, description: string, ...rest: E]
export type OptionsBool = Options<boolean, 'b'>
export type OptionsInt = Options<number, 'i', [min: number, max: number, extraProps?: object]>
export type OptionsEnum = Options<number, 'e', [options: readonly string[]]>

export type OptionStore<O> = O extends Options<infer T, string, unknown[]> ? [O, ValueStore<T>] : never
export type OptionStoreBool = OptionStore<OptionsBool>
export type OptionStoreInt = OptionStore<OptionsInt>
export type OptionStoreEnum = OptionStore<OptionsEnum>

export type OptionsAny =
  | OptionsBool
  | OptionsInt
  | OptionsEnum

export type OptionStoreAny = OptionStore<OptionsAny>
</script>

<script lang="ts">
import RoomOptionBool from './RoomOptionBool.svelte'
import RoomOptionEnum from './RoomOptionEnum.svelte'
import RoomOptionInt from './RoomOptionInt.svelte'

export let optionStore: OptionStoreAny

let option: any
let store: ValueStore<any>
let oType: OptionsAny[1]
$: [option, store] = optionStore
$: oType = option[1]
</script>

{#if oType === 'b'}
  <RoomOptionBool {option} {store} />
{:else if oType === 'i'}
  <RoomOptionInt {option} {store} />
{:else if oType === 'e'}
  <RoomOptionEnum {option} {store} />
{:else}
  unknown option {oType} {option}
{/if}
