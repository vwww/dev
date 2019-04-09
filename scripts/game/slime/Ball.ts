import { SPAWN_BALL_Y, SPAWN_P1_X, SPAWN_P2_X } from './Game'
import { PhysicalEntity } from './PhysicalEntity'

export class Ball extends PhysicalEntity {
  respawn (p1Serves: boolean) {
    this.x = p1Serves ? SPAWN_P1_X : SPAWN_P2_X
    this.y = SPAWN_BALL_Y
    this.xe = 0
    this.ye = 0
  }
}
