import { FARM_YARD } from "./rabbits/definitions";
import { GLADE_SCALE, gladeDistance } from "./gladeLayout";
import {
  gladePath,
  gladeTrees,
  gladeRocks,
  gladeBushes,
  gladeFlowers,
} from "./gladeScenery";
import * as THREE from "three";
import { box, material, mesh } from "./models";
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
    geometry.scale(GLADE_SCALE, 1, GLADE_SCALE);
    mesh(geometry, surface, root, 0, y, gladeDistance(20));
  }
  // A continuous, softly bending trail meets the bridge squarely at both ends.
  const points = gladePath(
    root,
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.08, 13.25),
      new THREE.Vector3(0, 0.08, 14.6),
      new THREE.Vector3(-0.8, 0.08, 17),
      new THREE.Vector3(-0.6, 0.08, 19.8),
      new THREE.Vector3(0.8, 0.08, 22),
      new THREE.Vector3(3.5, 0.08, 23),
    ]),
    path,
  );
  gladePath(
    root,
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.5, 0.08, 2.85),
      new THREE.Vector3(-1.35, 0.08, 4.3),
      new THREE.Vector3(-0.5, 0.08, 6.2),
      new THREE.Vector3(0, 0.08, 7.15),
      new THREE.Vector3(0, 0.08, 7.65),
    ]),
    path,
  );
  gladePath(root, new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.8, 0.08, 22),
    new THREE.Vector3(3.5, 0.08, 24.7),
    new THREE.Vector3(6, 0.08, 25.5),
    new THREE.Vector3(6, 0.08, 24),
  ]), path);
  const farmPath = gladePath(root, new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.6, 0.081, 20.2),
    new THREE.Vector3(-2, 0.081, 21.8),
    new THREE.Vector3(FARM_YARD.x / GLADE_SCALE, 0.081, FARM_YARD.z / GLADE_SCALE),
  ]), path);
  const wood = material("#b68b59"),
    rail = material("#ead5a6");
  for (let i = 0; i < 15; i++)
    box(
      root,
      wood,
      0,
      -0.025,
      gladeDistance(7.7 + i * 0.4),
      gladeDistance(3),
      0.16,
      gladeDistance(0.37),
    );
  for (const side of [-1, 1]) {
    box(
      root,
      rail,
      gladeDistance(side * 1.5),
      0.65,
      gladeDistance(10.5),
      0.12,
      0.13,
      gladeDistance(5.8),
    );
    for (let i = 0; i < 6; i++)
      box(
        root,
        rail,
        gladeDistance(side * 1.5),
        0.4,
        gladeDistance(7.8 + i * 1.1),
        0.16,
        0.9,
        0.16,
      );
    collision.add(
      gladeDistance(side * 1.55),
      gladeDistance(10.5),
      0.1,
      gladeDistance(2.8),
    );
    // Solid boundaries around the gap and the narrower southern island.
    collision.add(
      gladeDistance(side * 6.4),
      gladeDistance(10.5),
      gladeDistance(4.9),
      gladeDistance(2.5),
    );
    collision.add(
      gladeDistance(side * 10.15),
      gladeDistance(20),
      gladeDistance(1.15),
      gladeDistance(7),
    );
  }
  gladeTrees(root, collision, [
    [-6, 15, 1.1],
    [6, 15, 1.2],
    [-7, 19, 1],
    [7, 20, 1.1],
    [-6, 25, 1.1],
    [0, 25.5, 0.9],
    [8, 25.8, 1.15],
  ]);
  gladeRocks(root, collision, [
    [-7.3, 16.7, 0.45],
    [5.2, 17.4, 0.5],
    [-7.6, 23.6, 0.4],
    [7.4, 23.6, 0.45],
  ]);
  gladeBushes(root, collision, [
    [-4.2, 15.4],
    [7, 17.3],
    [-7.7, 21.2],
    [4.7, 20.3],
    [-3.2, 25.3],
  ]);
  const clearing = mesh(
    new THREE.CylinderGeometry(1.35, 1.4, 0.06, 16),
    material("#c5c493"),
    root,
    gladeDistance(3.5),
    0.03,
    gladeDistance(23),
  );
  clearing.castShadow = false;
  collision.add(gladeDistance(3.5), gladeDistance(23), 0.56, 0.41);
  gladeFlowers(root, collision, [...points, ...farmPath], {
    seed: 37,
    count: 110,
    minX: -8,
    minZ: 14,
    width: 16,
    depth: 12,
  });
}
