import * as THREE from "three";
import { box, ball, material, mesh, silhouette } from "../models";
import type { CollisionSystem } from "../CollisionSystem";

// Furnishings for the great hall. The middle cross of the room (x near 0 and
// z near 0) stays empty so the carpets to every doorway remain walkable.
export function furnishHall(root: THREE.Group, collision: CollisionSystem) {
  const stone = material("#c9b795"),
    trim = material("#a78d6a"),
    wood = material("#8a5a34"),
    dark = material("#6d4526"),
    cloth = material("#a84d50"),
    gold = material("#f2ca61", 0.4),
    steel = material("#8e9aa7", 0.35),
    coal = material("#3b3230"),
    leaf = material("#3f7f4a");
  const flames: THREE.Mesh[] = [];
  // A flame is its own material so each one can flicker at its own pace.
  const fire = (
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    size: number,
  ) => {
    const flame = ball(
      parent,
      material("#ffb03a", 0.5),
      x,
      y,
      z,
      size,
      size * 1.7,
      size,
    );
    const mat = flame.material as THREE.MeshStandardMaterial;
    mat.emissive.set("#ff7a18");
    mat.emissiveIntensity = 0.9;
    flame.castShadow = false;
    flame.userData.phase = flames.length * 1.7;
    flame.userData.size = size * 1.7;
    flames.push(flame);
    return flame;
  };

  // Carpets from the middle of the room out to the throne room and the
  // side doors, matching the runner that already leads to the entrance.
  box(root, cloth, 0, 0.015, -2.35, 2, 0.03, 3.7);
  for (const x of [-2.9, 2.9]) box(root, cloth, x, 0.015, 0, 3.4, 0.03, 1.6);

  // Corner pillars.
  for (const x of [-4, 4])
    for (const z of [-3.3, 3.3]) {
      mesh(
        new THREE.CylinderGeometry(0.26, 0.3, 2.35, 10),
        stone,
        root,
        x,
        1.18,
        z,
      );
      box(root, trim, x, 0.08, z, 0.8, 0.16, 0.8);
      box(root, trim, x, 2.43, z, 0.78, 0.16, 0.78);
      collision.add(x, z, 0.42);
    }

  // Wall torches. The group faces its own +z, so the rotation aims it inward.
  const torch = (x: number, z: number, rotation: number) => {
    const g = new THREE.Group();
    g.position.set(x, 1.45, z);
    g.rotation.y = rotation;
    root.add(g);
    box(g, trim, 0, 0, 0.12, 0.09, 0.09, 0.24);
    mesh(
      new THREE.CylinderGeometry(0.16, 0.08, 0.24, 8),
      trim,
      g,
      0,
      0.15,
      0.24,
    );
    fire(g, 0, 0.38, 0.24, 0.11);
  };
  for (const x of [-1.7, 1.7]) torch(x, -4.15, 0);
  torch(-4.55, -1.4, Math.PI / 2);
  torch(4.55, -1.4, -Math.PI / 2);

  // Hanging banners with a royal crest.
  const banner = (x: number, z: number, rotation: number) => {
    const g = new THREE.Group();
    g.position.set(x, 1.8, z);
    g.rotation.y = rotation;
    root.add(g);
    const flag = silhouette(
      g,
      cloth,
      [
        [-0.36, 0.6],
        [0.36, 0.6],
        [0.36, -0.4],
        [0, -0.72],
        [-0.36, -0.4],
      ],
      0.05,
    );
    flag.position.z = 0.02;
    box(g, trim, 0, 0.66, 0.07, 0.86, 0.07, 0.07);
    // Crown crest: a band with three little points.
    box(g, gold, 0, 0.06, 0.09, 0.34, 0.09, 0.04);
    for (const dx of [-0.12, 0, 0.12])
      mesh(new THREE.ConeGeometry(0.055, 0.14, 4), gold, g, dx, 0.18, 0.09);
  };
  for (const x of [-3.7, -2.35]) banner(x, -4.14, 0);

  // Fireplace in the back right corner.
  for (const dx of [-0.85, 0.85])
    box(root, stone, 2.6 + dx, 0.78, -4.05, 0.6, 1.55, 0.62);
  box(root, stone, 2.6, 1.68, -4.05, 2.3, 0.26, 0.7);
  box(root, stone, 2.6, 2.2, -4.15, 1.5, 0.8, 0.5);
  box(root, coal, 2.6, 0.75, -4.22, 1.15, 1.5, 0.2);
  for (const dz of [-0.08, 0.08]) {
    const log = mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 1, 6),
      dark,
      root,
      2.6,
      0.12,
      -4.05 + dz,
    );
    log.rotation.z = Math.PI / 2;
  }
  for (const [dx, size] of [
    [-0.28, 0.11],
    [0, 0.15],
    [0.28, 0.1],
  ])
    fire(root, 2.6 + dx, 0.32, -4.05, size);
  collision.add(2.6, -4.05, 1.16, 0.36);

  // Sideboard against the back wall with candles and golden tableware.
  box(root, wood, -2.7, 0.55, -3.95, 2.4, 1.1, 0.55);
  box(root, dark, -2.7, 1.14, -3.95, 2.55, 0.1, 0.65);
  collision.add(-2.7, -3.95, 1.25, 0.34);
  for (const x of [-3.6, -1.8]) {
    mesh(
      new THREE.CylinderGeometry(0.05, 0.11, 0.34, 8),
      gold,
      root,
      x,
      1.36,
      -3.95,
    );
    box(root, material("#fff1d4"), x, 1.62, -3.95, 0.09, 0.2, 0.09);
    fire(root, x, 1.79, -3.95, 0.055);
  }
  ball(root, gold, -2.7, 1.22, -3.95, 0.3, 0.09, 0.24);
  ball(root, gold, -2.7, 1.34, -3.95, 0.13, 0.12, 0.13);

  // Banquet table with benches.
  box(root, wood, -2.7, 0.74, 2.2, 2.6, 0.12, 1.05);
  for (const x of [-3.75, -1.65])
    for (const z of [1.8, 2.6]) box(root, dark, x, 0.34, z, 0.16, 0.68, 0.16);
  collision.add(-2.7, 2.2, 1.3, 0.53);
  for (const z of [1.25, 3.15]) {
    box(root, wood, -2.7, 0.34, z, 2.1, 0.1, 0.36);
    for (const x of [-3.5, -1.9]) box(root, dark, x, 0.15, z, 0.12, 0.28, 0.3);
    collision.add(-2.7, z, 1.05, 0.2);
  }
  for (const x of [-3.4, -2]) {
    ball(root, gold, x, 0.81, 2.2, 0.22, 0.05, 0.22);
    mesh(
      new THREE.CylinderGeometry(0.08, 0.07, 0.19, 8),
      gold,
      root,
      x + 0.32,
      0.89,
      2.2,
    );
  }
  ball(root, gold, -2.7, 0.82, 2.6, 0.26, 0.07, 0.26);
  ball(root, material("#c94f45"), -2.7, 0.89, 2.6, 0.08);
  ball(root, material("#e0b23c"), -2.53, 0.88, 2.54, 0.07);
  ball(root, material("#7cb342"), -2.87, 0.88, 2.54, 0.07);

  // Knights in armour guarding the throne room door.
  for (const side of [-1, 1]) {
    const g = new THREE.Group();
    g.position.set(side * 1.75, 0, -3.5);
    g.rotation.y = side * -0.25;
    root.add(g);
    box(g, stone, 0, 0.09, 0, 0.7, 0.18, 0.7);
    mesh(new THREE.CylinderGeometry(0.24, 0.32, 0.72, 10), steel, g, 0, 0.54);
    box(g, gold, 0, 0.68, 0, 0.5, 0.1, 0.5);
    ball(g, steel, 0, 1.03, 0, 0.24, 0.29, 0.25);
    box(g, coal, 0, 1.03, 0.2, 0.24, 0.07, 0.12);
    ball(g, cloth, 0, 1.3, -0.03, 0.09, 0.14, 0.13);
    for (const arm of [-1, 1])
      ball(g, steel, arm * 0.31, 0.62, 0, 0.1, 0.3, 0.12);
    mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 1.9, 6),
      dark,
      g,
      0.37,
      0.95,
      0.06,
    );
    mesh(new THREE.ConeGeometry(0.09, 0.3, 6), steel, g, 0.37, 2.05, 0.06);
    const shield = ball(g, cloth, -0.36, 0.62, 0.14, 0.22, 0.28, 0.06);
    shield.rotation.z = 0.1;
    box(g, gold, -0.36, 0.62, 0.19, 0.34, 0.06, 0.06);
    box(g, gold, -0.36, 0.62, 0.19, 0.06, 0.42, 0.06);
    collision.add(side * 1.75, -3.5, 0.4);
  }

  // Barrels, a crate and a potted tree in the front right corner.
  for (const [x, z] of [
    [3.2, 2.5],
    [3.9, 2.15],
  ]) {
    mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.8, 10), wood, root, x, 0.4, z);
    for (const y of [0.2, 0.62])
      mesh(
        new THREE.CylinderGeometry(0.31, 0.31, 0.05, 10),
        dark,
        root,
        x,
        y,
        z,
      );
    mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.04, 10),
      dark,
      root,
      x,
      0.82,
      z,
    );
    collision.add(x, z, 0.34);
  }
  box(root, dark, 3.7, 0.3, 3.4, 0.7, 0.6, 0.7);
  box(root, wood, 3.7, 0.62, 3.4, 0.74, 0.08, 0.74);
  collision.add(3.7, 3.4, 0.38);
  for (const x of [-1.9, 1.9]) {
    mesh(
      new THREE.CylinderGeometry(0.3, 0.24, 0.44, 10),
      trim,
      root,
      x,
      0.22,
      3.7,
    );
    mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.5, 6),
      dark,
      root,
      x,
      0.68,
      3.7,
    );
    ball(root, leaf, x, 1.08, 3.7, 0.42, 0.4, 0.42);
    ball(root, leaf, x - 0.2, 1.34, 3.7, 0.26);
    ball(root, leaf, x + 0.22, 1.28, 3.62, 0.22);
    collision.add(x, 3.7, 0.33);
  }
  return flames;
}
