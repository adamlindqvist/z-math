import * as THREE from "three";
import { ball, box, material, mesh, silhouette } from "../models";
import { CollisionSystem } from "../CollisionSystem";
import { ObjectReaction, type ReactionKind } from "../interactables/ObjectReaction";
import { WORLD_OBJECTS, type WorldObjectId } from "../interactables/definitions";

import { royalMedallion } from "../royalMedallion";
import { KingRhoam } from "../entities/KingRhoam";
type Medallion = ReturnType<typeof royalMedallion>;
export function furnishThroneRoom(root: THREE.Group, collision: CollisionSystem, revealed: readonly string[]) {
  const stone = material("#d8c9b0"), trim = material("#a89270"), dark = material("#483b48"), wood = material("#845236"), gold = material("#ecca70", 0.35), red = material("#9e3449"), steel = material("#909da8", 0.4);
  const reactions = new Map<WorldObjectId, ObjectReaction>();
  const symbols = new Map<WorldObjectId, Medallion>();
  const flames: THREE.Mesh[] = [];
  const eyes: THREE.Mesh[] = [];
  const register = (id: WorldObjectId, object: THREE.Object3D, animated: THREE.Object3D = object, kind: ReactionKind = "wobble") => {
    object.name = id;
    object.userData.target = { kind: "worldObject", id, label: WORLD_OBJECTS[id].label };
    reactions.set(id, new ObjectReaction(animated, kind, revealed.includes(id)));
  };
  const flame = (parent: THREE.Object3D, x: number, y: number, z: number, scale = 1) => {
    const m = material("#ffc86a"); m.emissive.set("#ff9b36"); m.emissiveIntensity = 0.8;
    const f = ball(parent, m, x, y, z, 0.08 * scale, 0.15 * scale, 0.08 * scale);
    f.castShadow = false; flames.push(f); return f;
  };
  const group = (x: number, z: number, rotation = 0) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotation; root.add(g); return g;
  };
  // Cutaway architecture: no ceiling or tall foreground wall.
  box(root, stone, 0, -0.15, 0, 9.6, 0.3, 8.8);
  box(root, stone, 0, 1.4, -4.35, 9.6, 2.8, 0.3);
  for (const x of [-4.75, 4.75]) box(root, stone, x, 0.46, 0, 0.3, 0.92, 8.8);
  for (const x of [-2.9, 2.9]) box(root, stone, x, 0.16, 4.35, 3.8, 0.32, 0.3);
  for (const x of [-0.98, 0.98]) { box(root, trim, x, 0.32, 4.1, 0.34, 0.64, 0.55); collision.add(x, 4.1, 0.18, 0.28); }
  box(root, gold, 0, 0.012, 0.85, 2.14, 0.025, 6.5);
  box(root, red, 0, 0.03, 0.85, 1.94, 0.025, 6.5);
  for (const x of [-2.9, 2.9]) for (const z of [-1.6, 1.6]) {
    if (x > 0 && z < 0) continue; // Clear approach on the throne’s right.
    mesh(new THREE.CylinderGeometry(0.17, 0.22, 1.9, 10), stone, root, x, 0.95, z);
    box(root, trim, x, 0.08, z, 0.48, 0.16, 0.48);
    box(root, gold, x, 1.95, z, 0.45, 0.13, 0.45);
    collision.add(x, z, 0.25);
  }
  // Banners deliberately lack the circular puzzle seal.
  for (const x of [-3.6, 0.9, 3.6]) {
    const g = group(x, -4.12);
    const flag = silhouette(g, red, [[-0.35,2.65],[0.35,2.65],[0.35,1.45],[0,1.2],[-0.35,1.45]], 0.04);
    flag.position.z = 0.05;
    box(g, gold, 0, 2.7, 0, 0.9, 0.07, 0.07);
    box(g, gold, 0, 2, 0.1, 0.28, 0.08, 0.05);
    for (const dx of [-0.1,0,0.1]) mesh(new THREE.ConeGeometry(0.05,0.15,4),gold,g,dx,2.11,0.1);
  }
  for (const x of [-3, 0.55, 3]) {
    box(root, trim, x, 1.7, -4.02, 0.12, 0.45, 0.22);
    flame(root, x, 2.03, -3.94, 1.25);
  }
  // Sky pictures, not additional rendered scenes.
  for (const side of [-1, 1]) {
    const g = group(side * 4.57, -0.55, -side * Math.PI / 2);
    box(g, trim, 0, 1.65, 0, 1.35, 1.85, 0.14);
    box(g, material("#9dcee0"), 0, 1.65, 0.09, 1.12, 1.6, 0.05);
    ball(g, material("#6c9778"), 0, 1.02, 0.16, 0.55, 0.3, 0.04);
    for (const x of [-0.23,0.1,0.33]) box(g, material("#698594"), x, 1.2, 0.18, 0.12, 0.35, 0.04);
    const cloud = ball(g, material("#fff3dc"), -0.15, 2.02, 0.18, 0.27, 0.11, 0.04);
    box(g, trim, 0, 1.65, 0.23, 0.05, 1.65, 0.04);
    box(g, trim, 0, 1.65, 0.23, 1.15, 0.06, 0.04);
    if (side === -1) register("royal-window", g, cloud, "cloud");
  }
  // Sliding centre includes its decorative steps. The newly exposed floor is flat.
  const throne = group(0, -2.7);
  box(throne, trim, 0, 0.08, 0.45, 1.5, 0.16, 1.35);
  box(throne, stone, 0, 0.22, 0.15, 1.4, 0.15, 1);
  box(throne, gold, 0, 1.1, -0.28, 1.15, 1.65, 0.2);
  box(throne, red, 0, 1.12, -0.14, 0.92, 1.4, 0.14);
  box(throne, red, 0, 0.68, 0.12, 1.05, 0.2, 0.75);
  for (const x of [-0.57,0.57]) {
    box(throne, gold, x, 0.67, 0.2, 0.12, 0.85, 0.12);
    box(throne, gold, x, 1.04, 0.12, 0.17, 0.13, 0.8);
    ball(throne, gold, x, 1.17, 0.45, 0.12);
  }
  royalMedallion(throne, 0, 1.72, 0.02, 0.75);
  const indicators = [-0.43, 0, 0.43].map(x => royalMedallion(throne, x, 0.29, 0.69, 0.65));
  register("royal-throne", throne);
  // Parent the seated king to the throne so he follows its secret slide.
  throne.add(new KingRhoam().root);
  // The western niche wall hides most of the chest.

  box(root, trim, -0.94, 0.47, -3.2, 0.2, 0.94, 1.8);
  collision.add(-0.94, -3.2, 0.1, 0.9);
  box(root, dark, 0, 0.01, -3.6, 1.55, 0.015, 1.1);
  box(root, trim, 0.7, 0.02, -2.72, 0.025, 0.025, 1.6);
  // Mounted on the inner face of the back-left pillar, visible from the entrance.
  const shield = group(-2.72, -1.42, Math.PI / 4);
  box(shield, trim, 0, 1.1, -0.1, 0.12, 0.32, 0.18);
  ball(shield, gold, 0, 1.1, 0, 0.43, 0.59, 0.1);
  ball(shield, red, 0, 1.1, 0.09, 0.36, 0.51, 0.06);
  symbols.set("royal-shield", royalMedallion(shield, 0, 1.12, 0.17, 1.2));
  register("royal-shield", shield);
  // Empty armour: hollow neck, detached helmet, no face or character model.
  const armour = (id: WorldObjectId, x: number, z: number) => {
    const g = group(x, z);
    box(g, trim, 0, 0.08, 0, 0.64, 0.16, 0.64);
    mesh(new THREE.CylinderGeometry(0.24,0.3,0.65,8,1,true),steel,g,0,0.65,0);
    ball(g, dark, 0, 0.99, 0, 0.15, 0.035, 0.15);
    for (const side of [-1,1]) {
      box(g, steel, side * 0.16, 0.3, 0, 0.19, 0.43, 0.23);
      ball(g, steel, side * 0.31, 0.77, 0, 0.13, 0.29, 0.14);
    }
    const helmet = new THREE.Group(); helmet.position.y = 1.25; g.add(helmet);
    ball(helmet, steel, 0, 0, 0, 0.26, 0.28, 0.23);
    box(helmet, dark, 0, -0.03, 0.2, 0.33, 0.15, 0.055);
    box(helmet, steel, 0, 0.01, 0.24, 0.35, 0.06, 0.06);
    collision.add(x, z, 0.34);
    register(id,g,id === "loose-helmet" ? helmet : g,id === "loose-helmet" ? "helmet" : "wobble");
    if (id === "royal-armour") symbols.set(id, royalMedallion(g,0,0.73,0.28,0.95));
  };
  armour("royal-armour", 4.15, -2.65);
  armour("loose-helmet", 4.15, 0.4);

  // Painted previous king: flat shapes inside a frame, never a live person.
  const portrait = group(-1.95, -4.04);
  portrait.rotation.x = -0.16;
  box(portrait,gold,0,1.57,0,1.32,1.63,0.13);
  box(portrait,material("#405775"),0,1.57,0.085,1.12,1.43,0.03);
  ball(portrait,red,0,1.15,0.13,0.4,0.35,0.035);
  ball(portrait,material("#e6ba92"),0,1.77,0.14,0.24,0.29,0.035);
  box(portrait,gold,0,2.03,0.16,0.43,0.13,0.04);
  for (const x of [-0.15,0,0.15]) box(portrait,gold,x,2.13,0.16,0.065,0.18,0.04);
  for (const x of [-0.09,0.09]) eyes.push(ball(portrait,dark,x,1.82,0.18,0.024,0.032,0.012));
  symbols.set("royal-portrait", royalMedallion(portrait,0,1.18,0.2,0.95));
  register("royal-portrait",portrait);
  // Map and book have separate large tappable surfaces.
  const table = group(-2.8, 2.95);
  box(table,wood,0,0.67,0,2.1,0.14,1.05);
  for (const x of [-0.85,0.85]) for (const z of [-0.35,0.35]) box(table,wood,x,0.32,z,0.13,0.64,0.13);
  collision.add(-2.8,2.95,1.05,0.53);
  const map = new THREE.Group(); table.add(map);
  box(map,material("#efe0b6"),-0.28,0.755,0,1.35,0.03,0.8);
  ball(map,material("#7bafbd"),-0.35,0.78,0,0.4,0.012,0.25);
  ball(map,material("#739a60"),0.15,0.78,0.12,0.2,0.015,0.2);
  const boat = new THREE.Group(); boat.position.set(-0.4,0.8,0); map.add(boat);
  box(boat,wood,0,0,0,0.28,0.06,0.1);
  box(boat,gold,0,0.13,0,0.025,0.24,0.025);
  silhouette(boat,material("#fff8e1"),[[0,0.22],[0.16,0.06],[0,0.06]],0.02);
  register("royal-map",map,boat);
  const book = new THREE.Group(); book.position.set(0.7,0.78,0); table.add(book);
  box(book,red,0,0,0,0.48,0.09,0.62);
  box(book,material("#fff0cc"),0,0.06,0,0.44,0.035,0.58);
  const bookMark = royalMedallion(book,0,0.09,0,0.6); bookMark.root.rotation.x = -Math.PI / 2;
  register("royal-book",book);
  for (const [id,x,z] of [["royal-pot",2.2,3.5]] as const) {
    const g = group(x,z);
    mesh(new THREE.CylinderGeometry(0.23,0.3,0.5,10),material("#b77f53"),g,0,0.25,0);
    const lid = mesh(new THREE.CylinderGeometry(0.27,0.27,0.07,10),gold,g,0,0.53,0);
    ball(lid,gold,0,0.07,0,0.065);
    collision.add(x,z,0.3);
    register(id,g,id === "royal-pot" ? lid : g,id === "royal-pot" ? "lift" : "wobble");
  }
  return { throne, indicators, symbols, reactions, flames, eyes };
}
