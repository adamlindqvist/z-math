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
  ball(root, skin, 0, 0.95, 0, 0.7, 0.62, 0.95);
  for (const x of [-0.43, 0.43])
    for (const z of [-0.55, 0.55]) box(root, skin, x, 0.4, z, 0.29, 0.8, 0.3);
  head.position.set(0, kind === "water" ? 1.3 : 1.25, 0.65);
  root.add(head);
  if (kind === "water") {
    ball(head, skin, 0, 0.1, 0.1, 0.53, 0.5, 0.5);
    for (const side of [-1, 1]) {
      ball(head, skin, side * 0.57, 0.07, 0.08, 0.38, 0.49, 0.13);
      ball(head, material("#ceafb0"), side * 0.6, 0.07, 0.2, 0.23, 0.34, 0.035);
      ball(head, white, side * 0.25, 0.18, 0.51, 0.12);
      ball(head, dark, side * 0.25, 0.18, 0.61, 0.06);
    }
    for (let i = 0; i < 5; i++)
      ball(head, skin, 0, -i * 0.17, 0.5 + i * 0.07, 0.19 - i * 0.015);
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
