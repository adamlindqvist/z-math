import * as THREE from "three";
import { box, ball, material } from "../models";
import type { ShopItemId } from "../../items/shop";
export function shopModel(id: ShopItemId) {
  const root = new THREE.Group();
  root.name = id;
  const wood = material("#b4773e"),
    green = material("#267347"),
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
    box(root, wood, 0, 0.2, 0, 0.13, 0.95, 0.09);
    box(root, gold, 0, -0.15, 0, 0.4, 0.09, 0.14);
    box(root, material("#64452e"), 0, -0.32, 0, 0.1, 0.25, 0.1);
  } else {
    ball(root, wood, 0, 0, 0, 0.34, 0.43, 0.08);
    box(root, gold, 0, 0, 0.09, 0.07, 0.7, 0.04);
    box(root, gold, 0, 0, 0.09, 0.52, 0.07, 0.04);
  }
  return root;
}
