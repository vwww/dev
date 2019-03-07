export interface ISlimeUICallbacks {
  processUIupdate (dt: number): void
  processUIconnect (): void
  processUIchangeName (name: string): void
  processUIchangeColor (color: string): void
  processUIchangeFlipP1 (flipP1: boolean): void
  processUIchangeFancyBackground (on: boolean): void
  processUIchangeDrawDev (on: boolean): void
}
