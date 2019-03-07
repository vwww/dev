/* eslint-disable @typescript-eslint/naming-convention */
import { gcd, sum } from '@/util'
import { formatTimeISO } from './data'
import { getActive, getFeatured, type ModData, ModDataKeys, type ModInfo } from './modinfo'

const SB_INIT_TIME = 1479772800000
const SB_CACHE_TIME = 1690052400000

export type ModEventBase =
  | { add: true }
  | { add?: false, prop: keyof ModData, oldVal: unknown }

export type ModEvent = ModEventBase & {
  time: number
  timeStr: string
  info: ModInfo
  infoActive: ModInfo
  infoActiveHours: number
  infoActiveHoursGCD24: number
  infoFeatured: ModInfo
  mod?: ModData
  minor: boolean
  newTime?: string
}

export type ModHistory = ModEvent[]

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
    escalation: [
      { time: 1637939475000, add: true },
      { time: 1689778537000, prop: 'active', oldVal: true },
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
        time: (override?.[0].time ?? m.date_created) + 28 * 86400000,
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

    const minor = !add &&
      event.prop !== 'active' &&
      event.prop !== 'active_duration' &&
      event.prop !== 'featured'

    const infoActive = getActive(info)
    const infoActiveHours = sum(infoActive.map((m) => m.active_duration))
    const infoActiveHoursGCD24 = gcd(infoActiveHours, 24, 0, 24)
    history.push({
      ...event,
      timeStr: formatTimeISO(time),
      info,
      infoActive,
      infoActiveHours,
      infoActiveHoursGCD24,
      infoFeatured: getFeatured(info),
      mod: data,
      minor,
      newTime: minor || (add && !(data.active && !data.featured))
        ? undefined
        : totalTimeString(infoActiveHoursGCD24, infoActiveHours),
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

  const infoActive = getActive(info)
  const infoActiveHours = sum(infoActive.map((m) => m.active_duration))
  const infoActiveHoursGCD24 = gcd(infoActiveHours, 24, 0, 24)
  history.push({
    add: true,
    time: SB_INIT_TIME,
    timeStr: formatTimeISO(SB_INIT_TIME),
    info,
    infoActive: getActive(info),
    infoActiveHours,
    infoActiveHoursGCD24,
    infoFeatured: getFeatured(info),
    minor: false,
    newTime: totalTimeString(infoActiveHoursGCD24, infoActiveHours),
  })

  return history
}

function totalTimeString (g: number, h: number): string {
  return `(${h} h = ${h / g}${g != 24 ? `/${24 / g}` : ''} d)`
}

export function formatDelay (t: number): string {
  const ms = t % 1000
  t = (t - ms) / 1000
  const s = t % 60
  t = (t - s) / 60
  const m = t % 60
  t = (t - m) / 60
  const h = t % 24
  t = (t - h) / 24
  const d = t % 7
  t = (t - d) / 7
  return [
    t && `${t} week`,
    d && `${d} day`,
    h && `${h} hour`,
    m && `${m} min`,
    s && `${s} sec`,
    ms && `${ms} ms`,
  ].filter((x) => x).join(' ')
}
