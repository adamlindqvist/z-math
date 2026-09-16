import { Vector3 } from "three";
import { gameStore } from "../../store/gameStore";
import type { CollisionSystem, Obstacle } from "../CollisionSystem";
import type { Input } from "../Input";
import type { Player } from "../Player";
import { Horse } from "./Horse";

/** Keeps spatial decisions in the game; the store only carries actions/UI state. */
export class HorseRiding {
  readonly horse = new Horse();
  private parked: Obstacle | null = null;
  private resetId = gameStore.getState().resetId;
  constructor(private collision: CollisionSystem) {}
  obstacle() {
    if (gameStore.getState().riding) return [];
    this.parked = this.parkedObstacle();
    return [this.parked];
  }
  private parkedObstacle(): Obstacle {
    const angle = this.horse.root.rotation.y;
    return {
      x: this.horse.root.position.x,
      z: this.horse.root.position.z,
      halfX:
        Math.abs(Math.cos(angle)) * 0.43 + Math.abs(Math.sin(angle)) * 0.85,
      halfZ:
        Math.abs(Math.sin(angle)) * 0.43 + Math.abs(Math.cos(angle)) * 0.85,
    };
  }
  resetIfNeeded() {
    if (this.resetId === gameStore.getState().resetId) return;
    this.resetId = gameStore.getState().resetId;
    this.horse.reset();
  }
  private unpark() {
    this.collision.dynamic = this.collision.dynamic.filter(
      (o) => o !== this.parked,
    );
    this.parked = null;
  }
  canMountFrom(position: Vector3) {
    const h = this.horse.root.position;
    if (Math.hypot(position.x - h.x, position.z - h.z) >= 1.85) return false;
    // The horse must not occlude its own interaction. All scenery still blocks it.
    const obstacles = this.collision.dynamic;
    this.collision.dynamic = obstacles.filter((o) => o !== this.parked);
    try {
      if (!this.collision.visible(position, h)) return false;
      const walk = position.clone();
      this.collision.move(walk, h.x - position.x, h.z - position.z);
      return (
        walk.distanceToSquared(h) < 0.0001 &&
        this.collision.free(h.x, h.z, 0.85)
      );
    } finally {
      this.collision.dynamic = obstacles;
    }
  }
  private hasWalkingRoom(position: Vector3) {
    // Validate the landing with the exact obstacle that will exist after dismount.
    const obstacles = this.collision.dynamic;
    this.collision.dynamic = [...obstacles, this.parkedObstacle()];
    try {
      if (!this.collision.free(position.x, position.z, 0.38)) return false;
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const walk = position.clone();
        this.collision.move(walk, Math.sin(angle) * 0.6, Math.cos(angle) * 0.6);
        if (walk.distanceTo(position) > 0.5) return true;
      }
      return false;
    } finally {
      this.collision.dynamic = obstacles;
    }
  }
  private dismountPosition() {
    const h = this.horse.root.position,
      rotation = this.horse.root.rotation.y;
    // Prefer either side; wider diagonals/front/back are fallbacks near scenery.
    for (const angle of [
      Math.PI / 2,
      -Math.PI / 2,
      Math.PI / 4,
      -Math.PI / 4,
      (3 * Math.PI) / 4,
      (-3 * Math.PI) / 4,
      0,
      Math.PI,
    ]) {
      const distance = Math.abs(Math.sin(angle)) > 0.99 ? 1.25 : 1.55;
      const target = new Vector3(
        h.x + Math.sin(rotation + angle) * distance,
        0,
        h.z + Math.cos(rotation + angle) * distance,
      );
      if (!this.hasWalkingRoom(target)) continue;
      const walk = h.clone();
      this.collision.move(walk, target.x - h.x, target.z - h.z);
      if (walk.distanceToSquared(target) < 0.0001) return target;
    }
    return null;
  }
  update(dt: number, player: Player, input: Input) {
    const state = gameStore.getState();
    const action = state.horseAction;
    if (action) {
      if (state.overlay || state.motion || state.location)
        gameStore.setRiding(state.riding);
      else if (action === "mount" && !state.riding) {
        const allowed =
          state.bridgeUnlocked && this.canMountFrom(player.position);
        if (allowed) {
          this.unpark();
          player.position.copy(this.horse.root.position);
          player.root.rotation.y = this.horse.root.rotation.y;
          player.setRiding(true);
        } else {
          this.unpark();
          this.collision.dynamic.push(...this.obstacle());
        }
        gameStore.setRiding(allowed);
      } else if (action === "dismount" && state.riding) {
        const position = this.dismountPosition();
        if (position) {
          player.position.copy(position);
          player.setRiding(false);
          gameStore.setRiding(false);
          this.collision.dynamic.push(...this.obstacle());
        } else gameStore.setRiding(true, "Rid lite åt sidan");
      }
    }
    const current = gameStore.getState();
    if (!current.riding) {
      this.horse.root.userData.target = {
        kind: "horse",
        action: "mount",
        label: "Rid",
      };
      this.horse.animate(current.overlay ? 0 : dt, false);
      return false;
    }
    this.horse.root.userData.target = undefined;
    const before = player.position.clone();
    if (!current.overlay && !current.motion)
      player.update(dt, input, this.collision, false, undefined, false, true);
    this.horse.root.position.copy(player.position);
    this.horse.root.rotation.y = player.root.rotation.y;
    const moving = before.distanceToSquared(player.position) > 0.000001;
    this.horse.animate(current.overlay ? 0 : dt, moving);
    if (moving && current.ridingMessage) gameStore.setRiding(true);
    return true;
  }
}
