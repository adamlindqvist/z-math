import * as THREE from "three";
import { ball, box, material, mesh } from "../models";
export function palm(parent: THREE.Group, x: number, z: number, green = true) {
  const root = new THREE.Group();
  root.position.set(x, 0, z);
  parent.add(root);
  const trunk = material("#a77b48"),
    leaves = material(green ? "#619951" : "#b4a061");
  mesh(new THREE.CylinderGeometry(0.16, 0.26, 2.6, 7), trunk, root, 0, 1.3);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const leaf = ball(
      root,
      leaves,
      Math.cos(a) * 0.6,
      2.5,
      Math.sin(a) * 0.6,
      0.9,
      0.12,
      0.28,
    );
    leaf.rotation.y = -a;
    leaf.rotation.z = Math.cos(a) * -0.25;
  }
  return { root, leaves };
}
export function animal(kind: "water" | "desert") {
  const root = new THREE.Group(),
    head = new THREE.Group(),
    spray = new THREE.Group();
  const skin = material(kind === "water" ? "#a3adb9" : "#efc25c"),
    dark = material("#453b39"),
    white = material("#fff9e6");
  head.position.set(0, kind === "water" ? 1.3 : 1.25, 0.65);
  root.add(head);
  if (kind === "water") {
    const bronze = material("#b39a64", 0.48),
      armor = material("#718985", 0.55),
      joint = material("#35494e", 0.65),
      light = material("#8cf1e7", 0.35);
    bronze.metalness = 0.55;
    armor.metalness = 0.4;
    light.emissive.set("#48cfc3");
    light.emissiveIntensity = 0.65;
    // Shared low-poly parts keep Ella lightweight and need no textures or lights.
    const cylinder = new THREE.CylinderGeometry(1, 1, 1, 10);
    const ring = new THREE.TorusGeometry(1, 0.12, 4, 12);
    const disc = (
      parent: THREE.Group,
      mat: THREE.Material,
      x: number,
      y: number,
      z: number,
      radius: number,
      depth: number,
    ) => {
      const part = mesh(cylinder, mat, parent, x, y, z);
      part.scale.set(radius, depth, radius);
      return part;
    };
    box(root, joint, 0, 1, -0.05, 1.14, 0.85, 1.55);
    ball(root, armor, 0, 1.18, -0.1, 0.68, 0.48, 0.86);
    for (const z of [-0.6, 0, 0.6])
      box(root, bronze, 0, 1.56, z, 1.05, 0.12, 0.12);
    for (const side of [-1, 1]) {
      box(root, bronze, side * 0.62, 1.02, -0.15, 0.12, 0.66, 1.35);
      for (const z of [-0.48, -0.15, 0.18])
        box(root, joint, side * 0.687, 1.05, z, 0.025, 0.32, 0.12);
      for (const z of [-0.55, 0.55]) {
        disc(root, bronze, side * 0.43, 0.67, z, 0.23, 0.34);
        disc(root, joint, side * 0.43, 0.43, z, 0.15, 0.16);
        disc(root, armor, side * 0.43, 0.27, z, 0.18, 0.2);
        disc(root, bronze, side * 0.43, 0.1, z, 0.25, 0.2);
        for (const offset of [-0.1, 0.1])
          box(
            root,
            white,
            side * 0.43 + offset,
            0.09,
            z + 0.23,
            0.06,
            0.1,
            0.04,
          );
      }
    }
    ball(head, joint, 0, 0.1, 0.1, 0.5, 0.47, 0.46);
    ball(head, armor, 0, 0.15, 0.18, 0.48, 0.43, 0.43);
    box(head, bronze, 0, 0.41, 0.46, 0.19, 0.22, 0.12);
    ball(head, light, 0, 0.42, 0.53, 0.055, 0.07, 0.025);
    for (const side of [-1, 1]) {
      // Large circular ear mechanisms echo the reference's engraved wheels.
      const ear = disc(head, bronze, side * 0.59, 0.07, 0.08, 0.44, 0.16);
      ear.rotation.x = Math.PI / 2;
      const inset = disc(head, joint, side * 0.59, 0.07, 0.18, 0.34, 0.06);
      inset.rotation.x = Math.PI / 2;
      const rim = mesh(ring, bronze, head, side * 0.59, 0.07, 0.22);
      rim.scale.setScalar(0.26);
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const spoke = box(
          head,
          bronze,
          side * 0.59 + Math.sin(angle) * 0.16,
          0.07 + Math.cos(angle) * 0.16,
          0.23,
          0.045,
          0.15,
          0.035,
        );
        spoke.rotation.z = -angle;
      }
      ball(head, light, side * 0.59, 0.07, 0.24, 0.09, 0.09, 0.035);
      ball(head, bronze, side * 0.25, 0.18, 0.53, 0.15, 0.17, 0.085);
      ball(head, white, side * 0.25, 0.18, 0.59, 0.115);
      ball(head, joint, side * 0.25, 0.18, 0.69, 0.06);
      ball(head, light, side * 0.25 - 0.018, 0.205, 0.735, 0.022);
    }
    for (let i = 0; i < 7; i++) {
      const segment = disc(
        head,
        i % 2 ? joint : bronze,
        0,
        -i * 0.135,
        0.57 + i * 0.045,
        0.18 - i * 0.013,
        0.145,
      );
      segment.rotation.x = -0.32;
    }
    const tip = disc(head, light, 0, -0.87, 0.86, 0.085, 0.045);
    tip.rotation.x = -0.32;
    head.add(spray);
    const water = material("#8de7f3");
    for (let i = 0; i < 9; i++)
      ball(
        spray,
        water,
        Math.sin(i * 2) * 0.18,
        -0.48 + Math.sin((i / 9) * Math.PI) * 0.5,
        0.9 + i * 0.15,
        0.06,
      );
  } else {
    ball(root, skin, 0, 0.95, 0, 0.7, 0.62, 0.95);
    for (const x of [-0.43, 0.43])
      for (const z of [-0.55, 0.55]) box(root, skin, x, 0.4, z, 0.29, 0.8, 0.3);
    box(head, skin, 0, 0.65, 0, 0.38, 1.65, 0.4);
    ball(head, skin, 0, 1.5, 0.22, 0.35, 0.32, 0.53);
    for (const side of [-1, 1]) {
      ball(head, skin, side * 0.38, 1.65, 0.02, 0.23, 0.11, 0.14);
      box(head, dark, side * 0.17, 1.91, 0, 0.08, 0.3, 0.08);
      ball(head, white, side * 0.24, 1.57, 0.52, 0.11);
      ball(head, dark, side * 0.24, 1.57, 0.61, 0.055);
      for (let i = 0; i < 4; i++)
        box(
          head,
          material("#a7753e"),
          side * 0.196,
          0.12 + i * 0.32,
          0,
          0.02,
          0.17,
          0.23,
        );
      for (let i = 0; i < 5; i++)
        ball(
          root,
          material("#a7753e"),
          side * 0.65,
          0.92 + (i % 2) * 0.2,
          -0.55 + i * 0.26,
          0.035,
          0.13,
          0.15,
        );
    }
  }
  spray.visible = false;
  return { root, head, spray };
}
