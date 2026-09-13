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
  if (id === "sun-hat") {
    const straw = material("#e9c67c");
    mesh(new THREE.CylinderGeometry(0.67, 0.67, 0.07, 16), straw, root, 0, -0.08);
    mesh(new THREE.CylinderGeometry(0.32, 0.39, 0.31, 12), straw, root, 0, 0.09);
    mesh(new THREE.CylinderGeometry(0.383, 0.396, 0.09, 12), material("#399dab"), root, 0, -0.015);
    return root;
  }
  if (id === "water-shield") {
    const shield = mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.08, 12), material("#258fae"), root);
    shield.rotation.x = Math.PI / 2;
    const rim = mesh(new THREE.TorusGeometry(0.35, 0.025, 5, 16), material("#d5f5e8"), root, 0, 0, 0.06);
    rim.name = "water-shield-rim";
    for (let i = 0; i < 9; i++) for (const y of [-0.1, 0.1])
      ball(root, material("#d5f5e8"), -0.23 + i * 0.057, y + Math.sin(i * 0.8) * 0.04, 0.06, 0.04, 0.025, 0.018);
    return root;
  }
  if (item.garment) {
    root.add(garmentModel(item.garment));
    return root;
  }
  if (id === "lava_hat") {
    const crust = material("#3a3038"),
      lava = material("#ffc266"),
      ember = material("#ff8b33");
    lava.emissive.set("#ff641d");
    lava.emissiveIntensity = 1.1;
    ember.emissive.set("#ff3c0b");
    ember.emissiveIntensity = 0.85;
    // A crusted shell wide enough to swallow the whole hairdo.
    const shell = new THREE.Vector3(0.45, 0.34, 0.43);
    const centre = new THREE.Vector3(0, -0.1, -0.12);
    ball(root, crust, centre.x, centre.y, centre.z, shell.x, shell.y, shell.z);
    box(root, crust, 0, -0.15, 0.21, 0.68, 0.13, 0.44);
    /** Sunk just under the crust, so the glow reads as a gap, not a stuck-on bar. */
    const sunken = (turn: number, rise: number) => {
      const direction = new THREE.Vector3(
        Math.sin(turn) * Math.cos(rise),
        Math.sin(rise),
        Math.cos(turn) * Math.cos(rise),
      );
      const at = direction.multiply(shell).add(centre);
      // The ellipsoid normal tilts away from the radius; divide it back out.
      const out = at.clone().sub(centre).divide(shell).divide(shell).normalize();
      return { at: at.addScaledVector(out, -0.021), out };
    };
    /** Molten rock running along the crust, one glowing segment per step. */
    const vein = (path: [number, number][], width: number, hot = lava) => {
      const points = path.map((step) => sunken(...step));
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1].at,
          b = points[i].at;
        const middle = a.clone().add(b).multiplyScalar(0.5);
        const along = b.clone().sub(a);
        const out = points[i - 1].out.clone().add(points[i].out).normalize();
        const across = along.clone().normalize().cross(out).normalize();
        const crack = mesh(
          new THREE.BoxGeometry(width, along.length() + width * 0.7, 0.05),
          hot,
          root,
          middle.x,
          middle.y,
          middle.z,
        );
        crack.setRotationFromMatrix(
          new THREE.Matrix4().makeBasis(across, along.normalize(), out),
        );
      }
    };
    const bubble = (turn: number, rise: number, size: number) => {
      const { at } = sunken(turn, rise);
      ball(root, ember, at.x, at.y, at.z, size, size * 0.8, size);
    };
    for (const side of [-1, 1]) {
      vein(
        [
          [side * 0.12, 1.25],
          [side * 0.5, 0.85],
          [side * 0.72, 0.45],
          [side * 0.55, 0.12],
        ],
        0.045,
      );
      vein(
        [
          [side * 0.72, 0.45],
          [side * 1.25, 0.5],
          [side * 1.7, 0.28],
        ],
        0.035,
        ember,
      );
      vein(
        [
          [side * 2.05, 0.72],
          [side * 2.45, 0.38],
          [side * 2.6, 0.02],
        ],
        0.04,
      );
      vein(
        [
          [side * 1.45, -0.08],
          [side * 1.62, 0.12],
        ],
        0.03,
        ember,
      );
      bubble(side * 0.95, 0.75, 0.033);
      bubble(side * 2.2, 0.16, 0.028);
      bubble(side * 2.9, 0.45, 0.026);
    }
    // Lava that ran off the crust and set along the visor edge.
    box(root, ember, 0, -0.198, 0.428, 0.62, 0.032, 0.028);
    for (const [x, width, height] of [
      [-0.25, 0.1, 0.085],
      [-0.1, 0.07, 0.115],
      [0.07, 0.13, 0.075],
      [0.24, 0.08, 0.105],
    ])
      box(root, lava, x, -0.168 + (0.115 - height) / 2, 0.429, width, height, 0.026);
    // The vent at the crown, still spitting.
    mesh(new THREE.ConeGeometry(0.09, 0.17, 5), lava, root, 0, 0.24, 0.01);
    mesh(new THREE.ConeGeometry(0.042, 0.12, 5), ember, root, -0.16, 0.2, -0.13);
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
