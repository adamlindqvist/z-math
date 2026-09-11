import * as THREE from "three";
import { ball, box, material, mesh, silhouette } from "../models";
import type { CollisionSystem } from "../CollisionSystem";
import { FARMER_POSITION, FARM_YARD, RABBITS, farmPosition } from "./definitions";

function buildRabbitPen(parent: THREE.Group, collision: CollisionSystem) {
  const pen = new THREE.Group(); pen.name = "rabbit-pen";
  pen.position.set(FARM_YARD.x, 0, FARM_YARD.z); parent.add(pen);
  const cream = material("#fff0d5"), wood = material("#b98e59"), grass = material("#acd17d");
  const lawn = box(pen, grass, 0, 0.055, 0.8, 3.4, 0.06, 2.3);
  lawn.castShadow = false;
  // A wide north entrance meets the farm path; low rails keep rabbits visible.
  const fence = (x: number, z: number, width: number, depth: number) => {
    for (const y of [0.25, 0.5]) box(pen, cream, x, y, z, width, 0.09, depth);
    collision.add(FARM_YARD.x + x, FARM_YARD.z + z, width / 2, depth / 2);
  };
  fence(-1.7, 0.875, 0.1, 2.05);
  fence(1.7, 0.875, 0.1, 2.05);
  fence(0, 1.9, 3.4, 0.1);
  for (const side of [-1, 1]) {
    fence(side * 1.4, -0.15, 0.6, 0.1);
    for (const z of [-0.15, 0.875, 1.9]) {
      box(pen, wood, side * 1.7, 0.34, z, 0.16, 0.68, 0.16);
      ball(pen, cream, side * 1.7, 0.7, z, 0.12, 0.07, 0.12);
    }
    box(pen, wood, side * 1.1, 0.34, -0.15, 0.16, 0.68, 0.16);
  }
  box(pen, wood, 0, 0.34, 1.9, 0.16, 0.68, 0.16);

  // A picture on the entrance stone guides children who cannot read yet.
  const marker = new THREE.Group(); marker.name = "rabbit-pen-entrance";
  marker.position.set(0, 0.105, -0.12); marker.rotation.x = -Math.PI / 2; pen.add(marker);
  mesh(new THREE.CircleGeometry(0.65, 24), material("#f7dfa0"), marker).castShadow = false;
  const ink = material("#886441");
  ball(marker, ink, 0, -0.09, 0.018, 0.24, 0.2, 0.012);
  for (const side of [-1, 1]) {
    ball(marker, ink, side * 0.12, 0.2, 0.018, 0.075, 0.22, 0.012);
    ball(marker, cream, side * 0.085, -0.055, 0.035, 0.026, 0.03, 0.008);
  }
  const hay = material("#e5bf6b");
  ball(pen, hay, -0.85, 0.16, 1.5, 0.48, 0.12, 0.22);
  for (let i = 0; i < 5; i++) {
    const strand = box(pen, cream, -1.15 + i * 0.15, 0.25, 1.5, 0.035, 0.025, 0.28);
    strand.rotation.y = (i % 2 ? 1 : -1) * 0.35;
  }
  mesh(new THREE.CylinderGeometry(0.27, 0.22, 0.13, 12), material("#b9825f"), pen, 0.9, 0.14, 1.5);
  const water = mesh(new THREE.CircleGeometry(0.22, 12), material("#7ecbd4"), pen, 0.9, 0.21, 1.5);
  water.rotation.x = -Math.PI / 2; water.castShadow = false;
}

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
  const barnScale = 1.15;
  barn.position.set(pos.x, 0, pos.z); barn.scale.setScalar(barnScale); group.add(barn);
  const red = material("#bc5146"), trim = material("#fff0d5"), roof = material("#665963"), wood = material("#b98e59");
  box(barn, red, 0, 0.95, 0, 2.2, 1.9, 2);
  collision.add(pos.x, pos.z, 1.1 * barnScale, barnScale);
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
  farmer.rotation.y = Math.atan2(farmer.position.x - pos.x, farmer.position.z - pos.z);
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
  buildRabbitPen(group, collision);
  const sign = new THREE.Group(); sign.name = "rabbit-sign";
  // Stand along the right fence, facing out toward the path.
  sign.position.set(FARM_YARD.x + 1.78, 2.35, FARM_YARD.z + 0.875);
  sign.rotation.y = Math.PI / 2;
  group.add(sign);
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
