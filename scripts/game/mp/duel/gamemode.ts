import { getDefaultOptions, type GamemodeFromOptions } from '@gmc/RoomOption'

export const DIMENSION_SCALE = 1_000_000

export const roomCreateOptions = [
  ['optBotBalance', 'i', 16, 'Bot Balance', 'balance total players to this number', 0, 64],
  ['optSkill', 'i', 80, 'Skill / %', 'allocation of luck and skill', 0, 100],
  ['optBotWin', 'i', 90, 'Bot Win Rate / %', 'portion of auto-win against bots', 0, 100],
  ['optTransfer', 'i', 75, 'Mass Transfer / %', "portion of loser's mass transferred to winner", 0, 100],
  ['optOverlap', 'i', 0, 'Overlap / %', 'overlap needed to collide (0% = touch, 50% = smaller center is within larger, 100% = complete overlap)', 0, 100],
  ['optDimension', 'i', 2 * DIMENSION_SCALE, 'Dimension / ppm', 'number of dimensions (2 = circle, 3 = sphere)', 0, 100 * DIMENSION_SCALE],
] as const

export type DuelMode = GamemodeFromOptions<typeof roomCreateOptions>

export function defaultMode (): DuelMode {
  return getDefaultOptions(roomCreateOptions)
}

export function getGameModeString (mode: DuelMode): string {
  return `${mode.optSkill}% skill, ${100 - mode.optSkill}% luck`
    + `, ${mode.optBotWin}% bot-factor`
    + `, ${mode.optOverlap}% overlap`
    + `, ${mode.optTransfer}% transfer`
    + `, ${mode.optDimension / DIMENSION_SCALE}D`
    + `, ${mode.optBotBalance} botbalance`
}
