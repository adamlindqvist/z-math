import { CAVE_ENVIRONMENT } from "./environment";
import { caveMouth, rockWall } from "./caveScenery";
import * as THREE from "three";
import { type Area, type Passage, disposeTree } from "./Area";
import { CollisionSystem } from "./CollisionSystem";
import { box, material, mesh } from "./models";
import { portal } from "./dungeons/models";
import { DUNGEONS, volcanoGateOpen } from "./dungeons/definitions";
import { gameStore, type GameState } from "../store/gameStore";

/** A small crossroads: return south, temple east, water world north. */
export class VolcanoInteriorArea implements Area {
  root = new THREE.Group();
  collision = new CollisionSystem(6.2, 8, -1.5);
  spawn = { x: 0, z: 4 };
  cameraMode = "room" as const;
  rupees = [];
  environment = CAVE_ENVIRONMENT;
  private gate = new THREE.Group();
  private opening = 0;
  private glow = new THREE.MeshStandardMaterial({ color: "#ffa34f", emissive: "#fa671e", emissiveIntensity: 0.7 });
  constructor() {
    this.root.name = "volcano-interior";
    const stone = material("#554951"), floor = material("#75665e"), trim = material("#877568");
    const strata = [stone, material("#65555a"), material("#493f47")];
    const outline = new THREE.Shape();
    [[-6.4, 5.7], [-6.9, 3.4], [-6.5, 0], [-6.8, -3.2], [-6.2, -9.3],
      [-3, -9.6], [1.4, -9.3], [6.4, -9.5], [6.8, -6], [6.3, -2],
      [6.7, 1.6], [6.5, 5.8], [3.4, 6.2], [-1.4, 6.1]].forEach(([x, z], i) =>
      i ? outline.lineTo(x, -z) : outline.moveTo(x, -z));
    outline.closePath();
    const floorGeometry = new THREE.ExtrudeGeometry(outline, { depth: 0.3, bevelEnabled: false });
    floorGeometry.rotateX(-Math.PI / 2);
    mesh(floorGeometry, floor, this.root, 0, -0.3);
    // Overlapping facets create solid boundaries; gaps remain only at the exits.
    for (const side of [-1, 1]) {
      for (let i = 0; i < 11; i++) {
        const z = -8.5 + i * 1.35;
        if (side === 1 && Math.abs(z) < 1.6) continue;
        rockWall(this.root, this.collision, strata[i % 3], side * (6.05 + Math.sin(i * 2) * 0.12), z,
          1.3, 1.65, 2.1 + (Math.sin(i * 1.7) + 1) * 0.5, i);
      }
    }
    for (let i = 0; i < 9; i++) {
      rockWall(this.root, this.collision, strata[i % 3], -5.6 + i * 1.4, -9.05, 1.7, 1.1, 2.8 + Math.sin(i) * 0.35, i);
    }
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        rockWall(this.root, this.collision, strata[i % 3], side * (3.25 + i * 1.1), -4.85,
          1.4, 1.3, 3.7 - i * 0.45, i + 2);
      }
      // Receding walls and floor facets give the revealed passage depth.
      for (let i = 0; i < 2; i++)
        rockWall(this.root, this.collision, strata[i], side * 3.1, -6.6 - i * 1.4, 1, 1.6, 2.7, i);
      box(this.root, trim, side * 2.8, 1.8, -4.65, 0.6, 3.6, 1);
      this.collision.add(side * 2.8, -4.65, 0.3, 0.5);
    }
    box(this.root, stone, 0, 3.6, -4.8, 6.2, 0.65, 1.2);
    for (let i = 0; i < 5; i++) {
      const cap = mesh(new THREE.DodecahedronGeometry(1, 0), strata[i % 3], this.root, -2.4 + i * 1.2, 3.9, -4.95);
      cap.scale.set(0.85, 0.45, 0.7);
    }
    this.gate.name = "great-volcano-gate";
    this.gate.position.z = -4.8;
    this.root.add(this.gate);
    for (const x of [-1.25, 1.25]) {
      box(this.gate, stone, x, 1.6, 0, 2.48, 3.2, 0.6);
      box(this.gate, this.glow, x, 1.6, 0.32, 0.09, 2.5, 0.04);
    }
    const emblem = mesh(new THREE.ConeGeometry(0.45, 0.9, 5), this.glow, this.gate, 0, 1.7, 0.55);
    emblem.rotation.z = -0.15;
    const fire = DUNGEONS.find((d) => d.id === "fire")!;
    const entrance = portal(this.root, fire.entrance.x, fire.entrance.z, "fire", true);
    entrance.name = "fire-entrance";
    entrance.rotation.y = fire.entrance.rotation!;
    for (const z of [-0.95, 0.95]) this.collision.add(5.35, z, 0.28, 0.25);
    caveMouth(this.root, this.collision, { x: 0, z: 5.35 }, true);
    // Irregular, broad stone paths preserve the same clear center aisle and right turn.
    const pathMaterial = material("#a08b76");
    const path = (points: number[][]) => {
      const shape = new THREE.Shape();
      points.forEach(([x, z], i) => i ? shape.lineTo(x, -z) : shape.moveTo(x, -z));
      shape.closePath();
      const geometry = new THREE.ShapeGeometry(shape);
      geometry.rotateX(-Math.PI / 2);
      const surface = mesh(geometry, pathMaterial, this.root, 0, 0.018);
      surface.receiveShadow = true;
    };
    path([[-0.8, 5.9], [-1.0, 3], [-0.86, 0.8], [-1.04, -2.6], [-0.9, -8.7],
      [0.8, -8.7], [0.92, -3], [0.86, 0], [1.02, 2.5], [0.78, 5.9]]);
    path([[0.55, 0.83], [2.2, 0.94], [4, 0.76], [5.5, 0.73],
      [5.5, -0.73], [3.3, -0.85], [1.1, -0.8]]);
    const cracks = material("#4c403e");
    for (let i = 0; i < 22; i++) {
      const side = i % 2 ? 1 : -1;
      const x = side * (2.2 + (i % 3) * 0.75), z = -3.6 + (i % 7) * 1.25;
      if (side === 1 && Math.abs(z) < 1.2) continue;
      const crack = box(this.root, cracks, x, 0.026, z, 0.6 + (i % 3) * 0.17, 0.016, 0.045);
      crack.rotation.y = i * 1.9;
      if (i % 3 === 0) {
        const ember = box(this.root, this.glow, x + 0.12, 0.038, z, 0.35, 0.018, 0.035);
        ember.rotation.y = crack.rotation.y;
      }
    }
    // Low edge rocks and ember seams stay away from the player's routes.
    for (const side of [-1, 1]) for (const z of [-2.9, 2.7]) {
      const x = side * 4.7;
      rockWall(this.root, this.collision, stone, x, z, 0.7, 0.8, 0.6, z);
      const seam = box(this.root, this.glow, x, 0.1, z + 0.48, 0.8, 0.035, 0.065);
      seam.rotation.y = side * 0.3;
    }
    this.opening = volcanoGateOpen(gameStore.getState().dungeons) ? 1 : 0;
    this.update(0, 0);
  }
  passages(): Passage[] {
    const fire = DUNGEONS.find((d) => d.id === "fire")!;
    return [
      ...(volcanoGateOpen(gameStore.getState().dungeons) && this.opening >= 1 ? [{ x: 0, z: -8, destination: { world: "water" as const } }] : []),
      { x: 0, z: 5.35, destination: { world: "volcano" } },
      { ...fire.entrance, destination: { dungeon: "fire", room: fire.rooms[0].id } },
    ];
  }
  interactions(_state: GameState) { return []; }
  update(dt: number, time: number) {
    const open = volcanoGateOpen(gameStore.getState().dungeons);
    this.opening = open ? Math.min(1, this.opening + dt * 0.6) : 0;
    // Keep the raised stone doors visible above a player-height opening.
    this.gate.position.y = this.opening * 2.6;
    this.collision.dynamic = this.opening < 1 ? [{ x: 0, z: -4.8, halfX: 2.5, halfZ: 0.3 }] : [];
    this.glow.emissiveIntensity = 0.7 + Math.sin(time * 1.4) * 0.15;
  }
  dispose() { disposeTree(this.root); }
}
