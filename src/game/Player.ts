import { itemModel } from "../items/models";
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
    for (const id of ["green-hat", "royal-crown"] as const) {
      const hat = itemModel(id);
      hat.position.set(0, id === "royal-crown" ? 1.6 : 1.55, id === "royal-crown" ? 0 : 0.1);
      this.root.add(hat);
    }
    this.reset();
    this.setEquipment(freshInventory().equipment);
  }
  setEquipment(equipment: Equipment) {
    this.root.getObjectByName("base-hat")!.visible =
      equipment.head === "base-hat";
    this.root.getObjectByName("green-hat")!.visible =
      equipment.head === "green-hat";
    this.root.getObjectByName("royal-crown")!.visible = equipment.head === "royal-crown";
    this.root.getObjectByName("wood-sword")!.visible =
      equipment.weapon === "wooden-sword";
    this.root.getObjectByName("wood-shield")!.visible =
      equipment.shield === "wooden-shield";
    this.model.coat.color.set(
      equipment.body === "blue-tunic" ? "#3489cb" : "#36964a",
    );
    this.root.getObjectByName("sword")!.visible =
      equipment.weapon === "temple-sword";
    this.root.getObjectByName("shield")!.visible =
      equipment.shield === "temple-shield";
    this.root.getObjectByName("fire-sword")!.visible =
      equipment.weapon === "fire-sword";
    this.root.getObjectByName("fire-shield")!.visible =
      equipment.shield === "fire-shield";
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
    noclip = false,
  ) {
    const { x, y } = input.direction();
    const dx = (room ? x : x * 0.864 + y * 0.504) * dt * 3.5;
    const dz = (room ? y : -x * 0.504 + y * 0.864) * dt * 3.5;
    const before = this.root.position.clone();
    if (noclip) collision.moveWithinBounds(this.root.position, dx, dz);
    else if (!tryPush?.(this.root.position, dx, dz))
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
