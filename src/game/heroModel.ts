import { garmentModel } from "../items/garments";
import { disposeTree } from "./Area";
import { character } from "./models";
import { itemModel } from "../items/models";
import {
  ITEMS,
  type ItemDefinition,
  type Equipment,
} from "../items/definitions";

export function heroModel() {
  const model = character("hero");
  for (const id of ["green-hat", "royal-crown", "lava_hat", "sun-hat"] as const) {
    const hat = itemModel(id);
    hat.position.set(
      0,
      id === "royal-crown" ? 1.6 : 1.55,
      id === "royal-crown" ? 0 : 0.1,
    );
    model.root.add(hat);
  }
  const waterShield = itemModel("water-shield");
  waterShield.position.copy(model.root.getObjectByName("shield")!.position);
  waterShield.rotation.copy(model.root.getObjectByName("shield")!.rotation);
  model.root.add(waterShield);
  return model;
}

export function applyEquipment(
  model: ReturnType<typeof heroModel>,
  equipment: Equipment,
) {
  model.root.getObjectByName("sun-hat")!.visible = equipment.head === "sun-hat";
  model.root.getObjectByName("water-shield")!.visible = equipment.shield === "water-shield";
  model.root.getObjectByName("base-hat")!.visible =
    equipment.head === "base-hat";
  model.root.getObjectByName("lava_hat")!.visible = equipment.head === "lava_hat";
  model.root.getObjectByName("green-hat")!.visible =
    equipment.head === "green-hat";
  model.root.getObjectByName("royal-crown")!.visible =
    equipment.head === "royal-crown";
  model.root.getObjectByName("wood-sword")!.visible =
    equipment.weapon === "wooden-sword";
  model.root.getObjectByName("wood-shield")!.visible =
    equipment.shield === "wooden-shield";
  const bodyId = equipment.body ?? "green-clothes";
  if (model.body.userData.itemId !== bodyId) {
    for (const child of [...model.body.children]) disposeTree(child);
    const item: ItemDefinition = ITEMS[bodyId];
    if (item.garment) model.body.add(garmentModel(item.garment));
    model.body.userData.itemId = bodyId;
  }
  model.root.getObjectByName("sword")!.visible =
    equipment.weapon === "temple-sword";
  model.root.getObjectByName("shield")!.visible =
    equipment.shield === "temple-shield";
  model.root.getObjectByName("fire-sword")!.visible =
    equipment.weapon === "fire-sword";
  model.root.getObjectByName("fire-shield")!.visible =
    equipment.shield === "fire-shield";
}
