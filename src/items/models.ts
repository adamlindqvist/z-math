import { garmentModel } from "./garments";
import * as THREE from "three";
import {
  box,
  ball,
  material,
  mesh,
  woodenShield,
  woodenSword,
} from "../game/models";
import { ITEMS, type ItemDefinition, type ItemId } from "./definitions";
import { royalMedallion } from "../game/royalMedallion";
export function itemModel(id: ItemId) {
  const root = new THREE.Group();
  root.name = id;
  const item: ItemDefinition = ITEMS[id];
  if (item.garment) {
    root.add(garmentModel(item.garment));
    return root;
  }
  if (id === "lava_hat") {
    const dark = material("#383440"),
      lava = material("#ffbc55");
    lava.emissive.set("#ff641d");
    lava.emissiveIntensity = 0.9;
    ball(root, dark, 0, 0, 0, 0.39, 0.29, 0.36);
    box(root, dark, 0, -0.09, 0.08, 0.73, 0.14, 0.62);
    for (const side of [-1, 1]) {
      const seam = box(root, lava, side * 0.15, 0.04, 0.33, 0.055, 0.23, 0.035);
      seam.rotation.z = side * 0.35;
    }
    mesh(new THREE.ConeGeometry(0.095, 0.2, 5), lava, root, 0, 0.22, 0.25);
    return root;
  }
  const green = material("#267347"),
    gold = material("#f4ce65");
  if (id === "royal-crown") {
    // Warm gold, a dark lower rim and rubies stay distinct from blond hair.
    gold.color.set("#dca72e");
    const rim = mesh(
      new THREE.TorusGeometry(0.34, 0.033, 6, 16),
      material("#71323c"),
      root,
      0,
      -0.065,
      0,
    );
    rim.rotation.x = Math.PI / 2;
    const ruby = material("#c32040", 0.35);
    const band = mesh(
      new THREE.CylinderGeometry(0.34, 0.34, 0.16, 12, 1, true),
      gold,
      root,
      0,
      0.01,
      0,
    );
    gold.side = THREE.DoubleSide;
    band.name = "crown-band";
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const point = mesh(
        new THREE.ConeGeometry(0.1, 0.25, 4),
        gold,
        root,
        Math.sin(angle) * 0.31,
        0.2,
        Math.cos(angle) * 0.31,
      );
      point.rotation.y = angle;
      const gem = mesh(
        new THREE.OctahedronGeometry(0.073),
        ruby,
        root,
        Math.sin(angle) * 0.355,
        0.055,
        Math.cos(angle) * 0.355,
      );
      gem.scale.set(1, 1.25, 0.65);
      gem.rotation.y = angle;
      gem.name = "crown-ruby";
      ball(
        root,
        gold,
        Math.sin(angle) * 0.31,
        0.34,
        Math.cos(angle) * 0.31,
        0.035,
      );
    }
    royalMedallion(root, 0, 0.025, -0.35, 0.32).root.rotation.y = Math.PI;
  } else if (id === "green-hat") {
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
