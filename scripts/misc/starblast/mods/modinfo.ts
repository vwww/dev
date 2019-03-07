export interface ModData {
  _id: string
  mod_id: string
  author: string
  title: string
  timesplayed?: number
  max_enter_players: number
  max_enter_time: number
  version: string
  active: boolean
  new: boolean
  active_duration: number
  featured: boolean
  date_created: number
}

export const ModDataKeys = [
  '_id',
  'mod_id',
  'author',
  'title',
  'timesplayed',
  'max_enter_players',
  'max_enter_time',
  'version',
  'active',
  'new',
  'active_duration',
  'featured',
  'date_created',
] as const

export type ModInfo = readonly ModData[]

export function getActive (info: ModInfo): ModInfo {
  return info.filter((d) => d.active && !d.featured)
}

export function getFeatured (info: ModInfo): ModInfo {
  return info.filter((d) => d.active && d.featured)
}
