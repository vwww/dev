export type Options<T, K extends string, E extends unknown[] = []> = readonly [id: string, type: K, defaultValue: T, name: string, description: string, ...rest: E]
export type OptionsBool = Options<boolean, 'b'>
export type OptionsInt = Options<number, 'i', [min: number, max: number, extraProps?: object]>
export type OptionsBigInt = Options<number, 'I', [min: number, max: number, extraProps?: object]>
export type OptionsEnum = Options<number, 'e', [options: readonly string[]]>

export type OptionStore<O> = O extends Options<infer T, string, unknown[]> ? [O, { value: T }] : never
export type OptionStoreBool = OptionStore<OptionsBool>
export type OptionStoreInt = OptionStore<OptionsInt>
export type OptionStoreBigInt = OptionStore<OptionsBigInt>
export type OptionStoreEnum = OptionStore<OptionsEnum>

export type OptionsAny =
  | OptionsBool
  | OptionsInt
  | OptionsBigInt
  | OptionsEnum

export type OptionStoreAny = OptionStore<OptionsAny>

type RoomCreateOptions = readonly OptionsAny[]
type RoomCreateOptionType<T> = T extends 'b' ? boolean : T extends 'i' | 'e' ? number : T extends 'I' ? bigint : never
export type GamemodeFromOptions<T extends RoomCreateOptions> = { [roomOption in T[number] as roomOption[0]]: RoomCreateOptionType<roomOption[1]> }

export function getDefaultOptions<T extends RoomCreateOptions> (roomCreateOptions: T): GamemodeFromOptions<T> {
  return Object.fromEntries(roomCreateOptions.map((roomOption) => {
    const [name, type, defaultValue] = roomOption
    return [name, type == 'I' ? BigInt(defaultValue) : defaultValue]
  })) as GamemodeFromOptions<T>
}

export function parseGameModeGeneric<T extends RoomCreateOptions> (roomCreateOptions: T, roomData: object): GamemodeFromOptions<T> {
  const data = roomData as Record<string, string>
  return Object.fromEntries(roomCreateOptions.map((roomOption) => {
    const [name, type] = roomOption
    switch (type) {
      case 'b':
        return [name, data[name] === 'true']
      case 'I':
        return [name, BigInt(data[name])]
      case 'e':
      case 'i':
        return [name, +data[name]]
    }
  }))
}
