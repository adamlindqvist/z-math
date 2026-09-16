import { freshInventory, type Equipment } from "../items/definitions";
import { Group, Vector3 } from "three";
import { heroModel, applyEquipment } from "./heroModel";
import type { Input } from "./Input";
import type { CollisionSystem } from "./CollisionSystem";
export const PLAYER_WALK_SPEED = 3.5;
export class Player {
  model = heroModel();
  root = new Group();
  private phase = 0;
  constructor() {
    this.root.add(this.model.root);
    this.reset();
    this.setEquipment(freshInventory().equipment);
  }
  setEquipment(equipment: Equipment) {
    applyEquipment(this.model, equipment);
  }

  setRiding(riding: boolean) {
    this.model.root.position.y = riding ? 1.12 : 0;
    this.model.root.position.z = riding ? -0.12 : 0;
    this.model.left.position.set(
      riding ? -0.47 : -0.17,
      0.18,
      riding ? 0.14 : 0.07,
    );
    this.model.right.position.set(
      riding ? 0.47 : 0.17,
      0.18,
      riding ? 0.14 : 0.07,
    );
    this.model.left.rotation.z = riding ? -0.3 : 0;
    this.model.right.rotation.z = riding ? 0.3 : 0;
    this.model.body.position.y = 0.65;
  }
  reset() {
    this.setRiding(false);
    this.root.position.set(-6.2, 0, 2.9);
    this.root.rotation.y = 0.35;
  }
  update(
    dt: number,
    input: Input,
    collision: CollisionSystem,
    room = false,
    tryPush?: (position: Vector3, dx: number, dz: number) => boolean,
    noclip = false,
    riding = false,
  ) {
    const { x, y } = input.direction();
    const speed = (riding ? 5 : PLAYER_WALK_SPEED) * (noclip ? 2 : 1);
    const dx = (room ? x : x * 0.864 + y * 0.504) * dt * speed;
    const dz = (room ? y : -x * 0.504 + y * 0.864) * dt * speed;
    const before = this.root.position.clone();
    if (noclip) collision.moveWithinBounds(this.root.position, dx, dz);
    else if (!tryPush?.(this.root.position, dx, dz))
      collision.move(this.root.position, dx, dz, riding ? 0.85 : 0.32);
    const moving = this.root.position.distanceToSquared(before) > 0.000001;
    if (moving) {
      const angle = Math.atan2(dx, dz);
      const delta = Math.atan2(
        Math.sin(angle - this.root.rotation.y),
        Math.cos(angle - this.root.rotation.y),
      );
      this.root.rotation.y += delta * Math.min(1, dt * 16);
      this.phase += dt * 13;
    }
    if (riding) return;
    this.model.left.position.y =
      0.18 + (moving ? Math.max(0, Math.sin(this.phase)) * 0.12 : 0);
    this.model.right.position.y =
      0.18 + (moving ? Math.max(0, -Math.sin(this.phase)) * 0.12 : 0);
    this.model.body.position.y =
      0.65 + (moving ? Math.abs(Math.sin(this.phase)) * 0.035 : 0);
  }
  get position(): Vector3 {
    return this.root.position;
  }
}
