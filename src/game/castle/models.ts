import * as THREE from "three";
import { box, ball, material, woodenShield, woodenSword } from "../models";
import type { ShopItemId } from "../../items/shop";
export function shopModel(id: ShopItemId) {
  const root = new THREE.Group();
  root.name = id;
  const green = material("#267347"),
    gold = material("#f4ce65");
  if (id === "green-hat") {
    ball(root, green, 0, 0, 0, 0.4, 0.22, 0.35);
    box(root, gold, 0, -0.07, 0.27, 0.65, 0.09, 0.12);
    const feather = ball(
      root,
      material("#fff5cf"),
      0.27,
      0.27,
      0,
      0.08,
      0.35,
      0.04,
    );
    feather.rotation.z = -0.4;
  } else if (id === "blue-tunic") {
    box(root, material("#3489cb"), 0, 0, 0, 0.5, 0.65, 0.2);
    box(root, material("#3489cb"), 0, 0.2, 0, 0.85, 0.24, 0.2);
    box(root, gold, 0, -0.12, 0.12, 0.5, 0.08, 0.03);
  } else if (id === "wooden-sword") {
    // The display pieces are the hero's gear, just scaled up for the stand.
    const sword = woodenSword(root);
    sword.scale.setScalar(1.6);
    sword.position.y = -0.18;
  } else {
    const shield = woodenShield(root);
    shield.scale.setScalar(1.35);
  }
  return root;
}
