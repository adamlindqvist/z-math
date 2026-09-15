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
  const white = material("#fff9e6");
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
    const bronze = material("#b99a62", 0.48),
      armor = material("#847b65", 0.58),
      joint = material("#39464a", 0.62),
      light = material("#99eee3", 0.35);
    bronze.metalness = 0.6;
    armor.metalness = 0.45;
    light.emissive.set("#56cabc");
    light.emissiveIntensity = 0.55;
    // Reuse simple geometry for the many armor segments and mechanical joints.
    const cylinder = new THREE.CylinderGeometry(1, 1, 1, 10),
      cube = new THREE.BoxGeometry(1, 1, 1);
    const plate = (
      parent: THREE.Group, mat: THREE.Material,
      x: number, y: number, z: number,
      w: number, h: number, d: number,
    ) => {
      const part = mesh(cube, mat, parent, x, y, z);
      part.scale.set(w, h, d);
      return part;
    };
    const disc = (
      parent: THREE.Group, mat: THREE.Material,
      x: number, y: number, z: number, radius: number, depth: number,
    ) => {
      const part = mesh(cylinder, mat, parent, x, y, z);
      part.scale.set(radius, depth, radius);
      return part;
    };
    plate(root, joint, 0, 1.04, -0.05, 1.12, 0.66, 1.5);
    ball(root, armor, 0, 1.15, -0.05, 0.65, 0.46, 0.86);
    for (const z of [-0.62, -0.12, 0.38])
      plate(root, bronze, 0, 1.52, z, 1.07, 0.1, 0.12);
    for (const side of [-1, 1]) {
      for (const z of [-0.55, 0.55]) {
        disc(root, bronze, side * 0.43, 0.72, z, 0.22, 0.24);
        disc(root, joint, side * 0.43, 0.44, z, 0.115, 0.58);
        for (const y of [0.26, 0.57])
          disc(root, armor, side * 0.43, y, z, 0.17, 0.2);
        disc(root, bronze, side * 0.43, 0.42, z, 0.19, 0.1);
        disc(root, bronze, side * 0.43, 0.1, z, 0.23, 0.2);
        plate(root, light, side * 0.43, 0.12, z + 0.225, 0.11, 0.06, 0.025);
      }
      // A large wheel and rear vent echo the ancient machine in the reference.
      const wheel = disc(root, bronze, side * 0.64, 1.13, 0.2, 0.33, 0.1);
      wheel.rotation.z = Math.PI / 2;
      const inset = disc(root, joint, side * 0.7, 1.13, 0.2, 0.24, 0.035);
      inset.rotation.z = Math.PI / 2;
      for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4;
        const tooth = plate(root, bronze, side * 0.72,
          1.13 + Math.cos(angle) * 0.24, 0.2 + Math.sin(angle) * 0.24,
          0.06, 0.13, 0.085);
        tooth.rotation.x = angle;
      }
      ball(root, light, side * 0.74, 1.13, 0.2, 0.035, 0.09, 0.09);
      plate(root, bronze, side * 0.61, 1.13, -0.48, 0.12, 0.43, 0.4);
      for (const z of [-0.6, -0.48, -0.36])
        plate(root, joint, side * 0.678, 1.13, z, 0.025, 0.25, 0.045);
    }
    // Two capped back towers remain below the head for a clear giraffe silhouette.
    for (const z of [-0.57, 0.03]) {
      disc(root, armor, 0, 1.7, z, 0.25, 0.46);
      disc(root, bronze, 0, 1.53, z, 0.28, 0.09);
      disc(root, bronze, 0, 1.93, z, 0.29, 0.1);
      ball(root, bronze, 0, 1.99, z, 0.25, 0.13, 0.25);
      for (const side of [-1, 1])
        plate(root, joint, side * 0.245, 1.77, z, 0.025, 0.17, 0.12);
    }
    plate(head, joint, 0, 0.62, 0, 0.26, 1.65, 0.28);
    for (let i = 0; i < 7; i++) {
      const y = -0.08 + i * 0.23;
      disc(head, i % 2 ? armor : bronze, 0, y, 0, 0.25, 0.17);
      for (const side of [-1, 1]) {
        const bolt = disc(head, bronze, side * 0.255, y, 0, 0.06, 0.05);
        bolt.rotation.z = Math.PI / 2;
      }
    }
    ball(head, joint, 0, 1.39, 0.08, 0.25);
    ball(head, armor, 0, 1.52, 0.2, 0.35, 0.29, 0.46);
    plate(head, bronze, 0, 1.39, 0.52, 0.56, 0.19, 0.35);
    plate(head, joint, 0, 1.35, 0.7, 0.26, 0.025, 0.015);
    plate(head, bronze, 0, 1.76, 0.23, 0.17, 0.1, 0.3);
    for (const side of [-1, 1]) {
      const ear = plate(head, bronze, side * 0.4, 1.67, 0.04, 0.3, 0.13, 0.19);
      ear.rotation.z = side * 0.3;
      disc(head, joint, side * 0.17, 1.91, 0, 0.045, 0.3);
      ball(head, bronze, side * 0.17, 2.07, 0, 0.085);
      ball(head, white, side * 0.23, 1.6, 0.55, 0.12);
      ball(head, joint, side * 0.23, 1.6, 0.65, 0.065);
      ball(head, light, side * 0.23 - 0.018, 1.625, 0.697, 0.025);
    }
  }
  spray.visible = false;
  return { root, head, spray };
}
