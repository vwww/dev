<script lang="ts" module>
export type Options<T, K extends string, E extends unknown[] = []> = readonly [id: string, type: K, defaultValue: T, name: string, description: string, ...rest: E]
export type OptionsBool = Options<boolean, 'b'>
export type OptionsInt = Options<number, 'i', [min: number, max: number, extraProps?: object]>
export type OptionsEnum = Options<number, 'e', [options: readonly string[]]>

export type OptionStore<O> = O extends Options<infer T, string, unknown[]> ? [O, { value: T }] : never
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

interface Props {
  optionStore: OptionStoreAny
}

const { optionStore }: Props = $props()

const [option, store] = $derived(optionStore)
</script>

{#if option[1] === 'b'}
  <RoomOptionBool {option} store={store as OptionStoreBool[1]} />
{:else if option[1] === 'i'}
  <RoomOptionInt {option} store={store as OptionStoreInt[1]} />
{:else if option[1] === 'e'}
  <RoomOptionEnum {option} store={store as OptionStoreEnum[1]} />
{:else}
  unknown option type {option[1]} ({option})
{/if}
