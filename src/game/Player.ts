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
  private swingAge = 1;
  private swingDelivered = true;
  private protection = 0;
  private knock = new Vector3();
  private swordRests = new Map<string, { x: number; z: number }>();
  attackToward(target: { x: number; z: number }) {
    if (this.swingAge < 0.6) return false;
    this.root.rotation.y = Math.atan2(target.x - this.position.x, target.z - this.position.z);
    this.swingAge = 0;
    this.swingDelivered = false;
    return true;
  }
  pushBack(from: { x: number; z: number }) {
    if (this.protection > 0) return false;
    this.protection = 2;
    this.knock.set(this.position.x - from.x, 0, this.position.z - from.z);
    if (this.knock.lengthSq() < 0.01) this.knock.z = 1;
    this.knock.normalize().multiplyScalar(4);
    return true;
  }
  /** Advances the existing hero model, returning one impact per sword swing. */
  updateCombat(dt: number, collision: CollisionSystem) {
    this.protection = Math.max(0, this.protection - dt);
    collision.move(this.position, this.knock.x * dt, this.knock.z * dt);
    this.knock.multiplyScalar(Math.exp(-dt * 9));
    this.swingAge += dt;
    for (const name of ["wood-sword", "sword", "fire-sword"]) {
      const sword = this.model.root.getObjectByName(name)!;
      if (!this.swordRests.has(name)) this.swordRests.set(name, { x: sword.rotation.x, z: sword.rotation.z });
      const rest = this.swordRests.get(name)!;
      const swing = this.swingAge < 0.6 ? Math.sin(this.swingAge / 0.6 * Math.PI) : 0;
      // The hero already faces the target in attackToward. Pitching the blade
      // forward therefore makes the cut travel toward it instead of through
      // the hero's torso.
      sword.rotation.x = rest.x + swing * 1.55;
      sword.rotation.z = rest.z + swing * 0.18;
    }
    this.model.root.rotation.z = this.protection > 1.65 ? Math.sin(this.protection * 30) * 0.08 : 0;
    if (!this.swingDelivered && this.swingAge >= 0.18) { this.swingDelivered = true; return true; }
    return false;
  }
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
    this.swingAge = 1; this.swingDelivered = true; this.protection = 0; this.knock.set(0, 0, 0);
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
