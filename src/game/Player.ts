import { freshInventory, type Equipment } from "../items/definitions";
import { Vector3 } from "three";
import { character } from "./models";
import type { Input } from "./Input";
import type { CollisionSystem } from "./CollisionSystem";
export class Player {
  model = character("hero");
  root = this.model.root;
  private phase = 0;
  constructor() {
    this.reset();
    this.setEquipment(freshInventory().equipment);
  }
  setEquipment(equipment: Equipment) {
    this.root.getObjectByName("sword")!.visible = equipment.sword !== null;
    this.root.getObjectByName("shield")!.visible = equipment.shield !== null;
  }
  reset() {
    this.root.position.set(-6.2, 0, 2.9);
    this.root.rotation.y = 0.35;
  }
  update(
    dt: number,
    input: Input,
    collision: CollisionSystem,
    room = false,
    tryPush?: (position: Vector3, dx: number, dz: number) => boolean,
  ) {
    const { x, y } = input.direction();
    const dx = (room ? x : x * 0.864 + y * 0.504) * dt * 3.5;
    const dz = (room ? y : -x * 0.504 + y * 0.864) * dt * 3.5;
    const before = this.root.position.clone();
    if (!tryPush?.(this.root.position, dx, dz))
      collision.move(this.root.position, dx, dz);
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
