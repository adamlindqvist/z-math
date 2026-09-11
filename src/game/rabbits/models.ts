import * as THREE from "three";
import { ball, box, material, mesh, silhouette } from "../models";
import type { CollisionSystem } from "../CollisionSystem";
import { FARMER_POSITION, RABBITS, farmPosition } from "./definitions";

export function rabbitModel(color: string) {
  const root = new THREE.Group();
  const fur = material(color), pink = material("#eea6a8"), eye = material("#2e343b");
  ball(root, fur, 0, 0.32, 0, 0.29, 0.32, 0.4).name = "rabbit-body";
  ball(root, fur, 0, 0.58, 0.25, 0.24);
  for (const side of [-1, 1]) {
    const ear = new THREE.Group();
    ear.name = side < 0 ? "rabbit-ear-left" : "rabbit-ear-right";
    ear.position.set(side * 0.12, 0.72, 0.22);
    ear.rotation.z = -side * 0.13;
    root.add(ear);
    ball(ear, fur, 0, 0.24, 0, 0.085, 0.3, 0.07);
    ball(ear, pink, 0, 0.26, 0.061, 0.043, 0.2, 0.018);
    ball(root, eye, side * 0.105, 0.63, 0.46, 0.032);
    ball(root, fur, side * 0.2, 0.09, 0.16, 0.12, 0.08, 0.18);
  }
  ball(root, pink, 0, 0.54, 0.487, 0.045, 0.03, 0.025).name = "rabbit-nose";
  ball(root, material("#fff8eb"), 0, 0.36, -0.38, 0.13);
  return root;
}
export function buildFarm(root: THREE.Group, collision: CollisionSystem) {
  const group = new THREE.Group(); group.name = "rabbit-farm"; root.add(group);
  const barn = new THREE.Group(); barn.name = "rabbit-barn";
  const pos = farmPosition(-3.4, 21);
  barn.position.set(pos.x, 0, pos.z); group.add(barn);
  const red = material("#bc5146"), trim = material("#fff0d5"), roof = material("#665963"), wood = material("#b98e59");
  box(barn, red, 0, 0.95, 0, 2.2, 1.9, 2);
  collision.add(pos.x, pos.z, 1.1, 1);
  for (let x = -0.9; x <= 1; x += 0.3) box(barn, material("#d56b53"), x, 0.95, 1.015, 0.035, 1.7, 0.025);
  for (const side of [-1, 1]) {
    box(barn, trim, side * 1.04, 0.95, 1.04, 0.12, 1.9, 0.08);
    const panel = box(barn, roof, side * 0.61, 2.1, 0, 1.5, 0.16, 2.45);
    panel.rotation.z = -side * 0.45;
  }
  const gable = silhouette(barn, red, [[-1.1, 1.9], [0, 2.45], [1.1, 1.9]]);
  gable.position.z = 1;
  // Door faces the open eastern yard.
  box(barn, wood, 1.12, 0.65, 0, 0.07, 1.3, 0.85);
  for (const side of [-1, 1]) box(barn, trim, 1.17, 0.65, side * 0.47, 0.08, 1.4, 0.08);
  box(barn, trim, 1.17, 1.36, 0, 0.08, 0.1, 1);
  const farmer = new THREE.Group(); farmer.name = "farmer";
  farmer.position.set(FARMER_POSITION.x, 0, FARMER_POSITION.z);
  farmer.userData.target = { kind: "farmer", label: "Prata" }; group.add(farmer);
  const denim = material("#53798b"), skin = material("#ffd2ab"), straw = material("#e9c474");
  ball(farmer, material("#eac88b"), 0, 0.72, 0, 0.34, 0.4, 0.26);
  box(farmer, denim, 0, 0.55, 0.21, 0.38, 0.46, 0.1);
  for (const side of [-1, 1]) {
    box(farmer, denim, side * 0.15, 0.25, 0, 0.21, 0.42, 0.24);
    ball(farmer, skin, side * 0.38, 0.65, 0, 0.1, 0.21, 0.1);
    ball(farmer, material("#644c38"), side * 0.15, 0.07, 0.08, 0.14, 0.09, 0.2);
  }
  ball(farmer, skin, 0, 1.22, 0, 0.28);
  for (const side of [-1, 1]) ball(farmer, material("#343c3b"), side * 0.1, 1.26, 0.26, 0.027);
  ball(farmer, material("#9f7853"), 0, 1.12, 0.26, 0.14, 0.035, 0.035);
  mesh(new THREE.CylinderGeometry(0.49, 0.49, 0.065, 12), straw, farmer, 0, 1.48);
  mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.23, 12), straw, farmer, 0, 1.61);
  collision.add(FARMER_POSITION.x, FARMER_POSITION.z, 0.3);
  // Short decorative fence sections leave the yard open to the main path.
  for (const z of [22.6]) {
    const p = farmPosition(-4.1, z);
    for (const x of [-0.8, 0, 0.8]) box(group, trim, p.x + x, 0.28, p.z, 0.1, 0.56, 0.1);
    box(group, trim, p.x, 0.35, p.z, 1.7, 0.1, 0.1);
    collision.add(p.x, p.z, 0.9, 0.08);
  }
  const sign = new THREE.Group(); sign.name = "rabbit-sign";
  sign.position.set(FARMER_POSITION.x - 0.15, 2.35, FARMER_POSITION.z - 0.15); group.add(sign);
  box(sign, wood, 0, 0, 0, 1.45, 0.65, 0.1);
  for (const x of [-0.62, 0.62]) box(sign, wood, x, -1.15, -0.04, 0.07, 2.3, 0.07);
  const pictures = RABBITS.map((r, i) => {
    const picture = new THREE.Group(); picture.position.set((i - 1) * 0.43, -0.08, 0.08); sign.add(picture);
    const ink = material("#746855");
    ball(picture, ink, 0, 0, 0, 0.13, 0.12, 0.025);
    for (const x of [-0.06, 0.06]) ball(picture, ink, x, 0.14, 0, 0.04, 0.12, 0.025);
    picture.name = `rabbit-picture-${r.id}`;
    return ink;
  });
  const flowers = new THREE.Group(); flowers.name = "rabbit-garden-flowers"; group.add(flowers);
  const green = material("#659d59"), colors = [material("#f1a6ba"), material("#f8d16e"), material("#bba1df")];
  for (let i = 0; i < 18; i++) {
    const x = pos.x - 1.35 + (i % 6) * 0.48, z = pos.z - 1.4 - Math.floor(i / 6) * 0.28;
    box(flowers, green, x, 0.15, z, 0.035, 0.3, 0.035);
    for (let j = 0; j < 5; j++) ball(flowers, colors[i % 3], x + Math.cos(j * Math.PI * 0.4) * 0.085, 0.32, z + Math.sin(j * Math.PI * 0.4) * 0.085, 0.067, 0.045, 0.067);
  }
  flowers.visible = false;
  return { pictures, flowers };
}
