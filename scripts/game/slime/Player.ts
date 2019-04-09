import { SPAWN_P1_X, SPAWN_P2_X } from './Game'
import { PhysicalEntity } from './PhysicalEntity'

export class Player extends PhysicalEntity {
  name = ''
  color = '#7f0' // '#80f'
  score = 0
  ping = -1

  respawn (p1: boolean) {
    this.reset()
    this.x = p1 ? SPAWN_P1_X : SPAWN_P2_X
  }
}
