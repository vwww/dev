/* eslint-disable @typescript-eslint/naming-convention */
import { ModData, ModDataKeys, ModInfo } from './modinfo'

const SB_INIT_TIME = 1479772800000
const SB_CACHE_TIME = 1668000000000

export type ModEventBase =
  | { add: true }
  | { add?: false, prop: keyof ModData, oldVal: unknown }

export type ModEvent = ModEventBase & {
  time: number
  timeStr: string
  mod_id?: string
  info: ModInfo
}

export type ModHistory = ModEvent[]

function formatTimeISO (t: number): string {
  return new Date(t).toISOString().replace('.000Z', 'Z')
}

export function generateHistory (raw: ModInfo, rawBase?: ModInfo): ModHistory {
  type ModEventTimed = ModEventBase & { time: number }
  type ModEventTimedSpec = ModEventTimed & { mod_id: string }

  const overrides: Partial<Record<string, ModEventTimed[]>> = {
    useries: [{ add: true, time: 1528459800000 }],
    battleroyale: [{ add: true, time: 1511530440000 }],
    racing: [
      { time: 1529679300000, add: true },
      { time: 1592486063588, prop: 'active', oldVal: true },
    ],
    prototypes: [
      { time: 1553777807000, add: true },
      { time: 1578454316626, prop: 'active', oldVal: true },
    ],
    rumble: [
      { time: 1599209592000, add: true },
      { time: 1615100000000, prop: 'active_duration', oldVal: 8 }, // unknown timestamp
      { time: 1634902500000, prop: 'active_duration', oldVal: 6 },
    ],
    ctf: [
      { time: 1602235325000, add: true },
      { time: 1625000000000, prop: 'active', oldVal: true }, // unknown timestamp
      { time: 1634902400000, prop: 'active', oldVal: false }, // unknown timestamp
      { time: 1634902500000, prop: 'active_duration', oldVal: 8 },
      { time: 1648729800000, prop: 'author', oldVal: '45rfew and Bhpsngum' },
    ],
    mcst: [
      { time: 1612516370000, add: true },
      { time: 1637498700000, prop: 'active_duration', oldVal: 4 },
    ],
  }

  const rawBaseMap: Partial<Record<string, ModData>> = Object.fromEntries((rawBase ?? []).map((d) => [d.mod_id, d]))
  const events: ModEventTimedSpec[] = []
  for (const m of raw) {
    if (m.mod_id === 'none' && m.title === 'Starblast Prototypes') {
      m.mod_id = 'prototypes'
    }

    const { mod_id } = m

    const override = overrides[mod_id]
    if (override) {
      events.push(...override.map((e) => ({
        ...e,
        mod_id,
      })))
    } else {
      events.push({
        add: true,
        time: m.date_created,
        mod_id,
      })
    }

    if (!m.featured) {
      events.push({
        add: false,
        time: (override?.[0].time ?? m.date_created) + 1000,
        mod_id,
        prop: 'featured',
        oldVal: true,
      })
    }

    // check for changed props
    const oldM = rawBaseMap[mod_id]
    if (oldM) {
      for (const prop of ModDataKeys) {
        if (prop === 'timesplayed') continue

        const oldVal = oldM[prop]
        if (oldVal === m[prop]) continue

        events.push({
          time: SB_CACHE_TIME,
          mod_id,
          prop,
          oldVal,
        })
      }
    }
  }

  // sort newest to oldest, reverse order of equal items if stable sort is supported
  events.sort((a, b) => a.time - b.time).reverse()

  const history: ModHistory = []
  let info: ModInfo = raw
  const curMods = Object.fromEntries(raw.map((m) => [m.mod_id, m]))

  for (const event of events) {
    const { add, time, mod_id } = event

    const data = curMods[mod_id]
    if (!add && data[event.prop] === event.oldVal) continue

    history.push({
      ...event,
      timeStr: formatTimeISO(time),
      info,
    })

    // revert event
    if (add) {
      info = info.filter((mod) => mod !== data)
    } else {
      const newData = { ...data, [event.prop]: event.oldVal }
      curMods[mod_id] = newData
      info = info.map((i) => i === data ? newData : i)
    }
  }

  history.push({
    add: true,
    time: SB_INIT_TIME,
    timeStr: formatTimeISO(SB_INIT_TIME),
    info,
  })

  return history
}
