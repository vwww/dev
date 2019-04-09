// top/up, bottom/down, left, right
export const DELTA: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]]

export function invMove (i: number): number {
  return i ^ 1
}

export enum MoveType {
  NO,
  MAYBE,
  YES,
}
