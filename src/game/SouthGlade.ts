import * as THREE from "three";
import { ball, box, material, mesh } from "./models";
import type { CollisionSystem } from "./CollisionSystem";

export function buildSouthGlade(root: THREE.Group, collision: CollisionSystem) {
  const grass = material("#94bd64"),
    earth = material("#b28c5b"),
    path = material("#ead0a0");
  const outline = new THREE.Shape();
  outline.moveTo(-8.5, -7);
  outline.lineTo(8.5, -7);
  outline.quadraticCurveTo(9, -7, 9, -6.5);
  outline.lineTo(9, 6.5);
  outline.quadraticCurveTo(9, 7, 8.5, 7);
  outline.lineTo(-8.5, 7);
  outline.quadraticCurveTo(-9, 7, -9, 6.5);
  outline.lineTo(-9, -6.5);
  outline.quadraticCurveTo(-9, -7, -8.5, -7);
  for (const [depth, y, surface] of [
    [0.75, -1, earth],
    [0.1, -0.13, grass],
  ] as const) {
    const geometry = new THREE.ExtrudeGeometry(outline, {
      depth,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.18,
      bevelThickness: 0.08,
    });
    geometry.rotateX(-Math.PI / 2);
    mesh(geometry, surface, root, 0, y, 20);
  }
  box(root, path, 0, 0.025, 18, 1.8, 0.05, 10);
  box(root, path, 1.5, 0.03, 23, 4.8, 0.05, 1.6);
  // Open route from the existing path to the bridge.
  box(root, path, -1.4, 0.035, 5.3, 1.6, 0.06, 4.7);
  box(root, path, -0.6, 0.04, 7.2, 2.9, 0.06, 1.3);
  const wood = material("#b68b59"),
    rail = material("#ead5a6");
  for (let i = 0; i < 15; i++)
    box(root, wood, 0, -0.025, 7.7 + i * 0.4, 3, 0.16, 0.37);
  for (const side of [-1, 1]) {
    box(root, rail, side * 1.5, 0.65, 10.5, 0.12, 0.13, 5.8);
    for (let i = 0; i < 6; i++)
      box(root, rail, side * 1.5, 0.4, 7.8 + i * 1.1, 0.16, 0.9, 0.16);
    collision.add(side * 1.55, 10.5, 0.1, 2.8);
    // Solid boundaries around the gap and the narrower southern island.
    collision.add(side * 6.4, 10.5, 4.9, 2.5);
    collision.add(side * 10.15, 20, 1.15, 7);
  }
  const trunk = material("#8e7250"),
    leaf = material("#6fa45e"),
    petal = material("#fff4d1");
  for (const [x, z] of [
    [-6, 15],
    [6, 15],
    [-7, 19],
    [7, 20],
    [-6, 25],
    [0, 25.5],
    [6, 25.5],
  ]) {
    mesh(
      new THREE.CylinderGeometry(0.18, 0.27, 1.6, 7),
      trunk,
      root,
      x,
      0.8,
      z,
    );
    ball(root, leaf, x, 2, z, 1, 1.1, 0.95);
    ball(root, leaf, x + 0.4, 2.3, z, 0.65);
    collision.add(x, z, 0.3);
  }
  for (let i = 0; i < 42; i++) {
    const x = ((i * 37) % 150) / 10 - 7.5,
      z = 14 + ((i * 23) % 110) / 10;
    if (
      Math.abs(x) < 1.4 ||
      (z > 21.5 && z < 24.5) ||
      !collision.free(x, z, 0.6)
    )
      continue;
    ball(root, leaf, x, 0.13, z, 0.16, 0.18, 0.16);
    ball(root, petal, x, 0.3, z, 0.09);
  }
  const clearing = mesh(
    new THREE.CylinderGeometry(1.35, 1.4, 0.06, 16),
    material("#c5c493"),
    root,
    3.5,
    0.03,
    23,
  );
  clearing.castShadow = false;
  collision.add(3.5, 23, 0.56, 0.41);
}
