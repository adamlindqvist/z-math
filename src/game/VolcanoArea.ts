import * as THREE from "three";
import { type Area, type Interaction, disposeTree } from "./Area";
import { CollisionSystem } from "./CollisionSystem";
import { GLADE_SCALE, gladeDistance, gladePosition } from "./gladeLayout";
import { gladePath } from "./gladeScenery";
import { volcanoGround } from "./volcanoScenery";
import { material, mesh, box } from "./models";
import {
  buildVolcanoPortal,
  portalSpawn,
  VOLCANO_RETURN,
} from "./volcanoPortal";

import { Chest } from "./entities/Chest";
import { gameStore, type GameState } from "../store/gameStore";

import { Collectible } from "./entities/Collectible";
import { VOLCANO_CHEST_POSITION, VOLCANO_RUPEES } from "./volcanoLayout";
export { VOLCANO_CHEST_POSITION } from "./volcanoLayout";
export const VOLCANO_CLEARINGS = [
  [-5, 0],
  [4, 3],
  [1, -3],
] as const;
export const VOLCANO_LAVA = [
  [-8, -3, 1.3, 1.8],
  [6.7, -2.5, 1.5, 2],
  [0, 5.5, 1.7, 0.8],
] as const;
export class VolcanoArea implements Area {
  root = new THREE.Group();
  cameraMode = "glade" as const;
  collision = new CollisionSystem(gladeDistance(11.1), gladeDistance(8.1));
  spawn = portalSpawn(VOLCANO_RETURN, -1);
  rupees = VOLCANO_RUPEES.map(({ id, x, z }) => new Collectible(id, x, z));
  chest = new Chest(gameStore.getState().chests["volcano-01"]);
  private glow = new THREE.MeshStandardMaterial({
    color: "#ff833d",
    emissive: "#ff4d16",
    emissiveIntensity: 0.65,
    roughness: 1,
  });
  private portal = buildVolcanoPortal(
    this.root,
    this.collision,
    VOLCANO_RETURN,
    true,
  );
  passages() {
    return [{ ...VOLCANO_RETURN, destination: null }];
  }
  interactions(state: GameState): Interaction[] {
    return [{
      ...VOLCANO_CHEST_POSITION,
      target: { kind: "chest", id: "volcano-01", label: state.chests["volcano-01"] ? "Titta i kistan" : "Öppna" },
    }];
  }
  constructor() {
    this.root.name = "volcano-world";
    const { x, z } = VOLCANO_CHEST_POSITION;
    this.chest.root.position.set(x, 0, z);
    this.chest.root.userData.target = { kind: "chest", id: "volcano-01", label: "Öppna" };
    this.root.add(this.chest.root);
    for (const rupee of this.rupees) {
      rupee.update(0, gameStore.getState().collected.includes(rupee.id));
      this.root.add(rupee.root);
    }
    this.collision.add(x, z, 0.54, 0.4);
    this.chest.update(0, gameStore.getState().chests["volcano-01"]);
    const ground = material("#716570"),
      ash = material("#cfb8a0"),
      rock = material("#514b5b");
    const outline = new THREE.Shape();
    outline.moveTo(-11.1, -8.4);
    outline.lineTo(11.1, -8.4);
    outline.quadraticCurveTo(11.5, -8.4, 11.5, -8);
    outline.lineTo(11.5, 8);
    outline.quadraticCurveTo(11.5, 8.4, 11.1, 8.4);
    outline.lineTo(-11.1, 8.4);
    outline.quadraticCurveTo(-11.5, 8.4, -11.5, 8);
    outline.lineTo(-11.5, -8);
    outline.quadraticCurveTo(-11.5, -8.4, -11.1, -8.4);
    for (const [depth, y, surface] of [
      [0.9, -1.08, material("#49414e")],
      [0.12, -0.15, ground],
    ] as const) {
      const geometry = new THREE.ExtrudeGeometry(outline, {
        depth,
        bevelEnabled: true,
        bevelSegments: 1,
        steps: 1,
        bevelSize: 0.1,
        bevelThickness: 0.03,
      });
      geometry.rotateX(-Math.PI / 2);
      geometry.scale(GLADE_SCALE, 1, GLADE_SCALE);
      mesh(geometry, surface, this.root, 0, y);
    }
    const trailPoints: THREE.Vector3[] = [];
    const trail = (points: number[][]) =>
      trailPoints.push(
        ...gladePath(
          this.root,
          new THREE.CatmullRomCurve3(
            points.map(([x, z]) => new THREE.Vector3(x, 0.035, z)),
          ),
          ash,
        ),
      );
    trail([
      [-7, 5],
      [-7, 3],
      [-5, 0],
      [-2, 0.5],
      [1, 2],
      [4, 3],
      [5, 1],
      [3, -1],
      [1, -3],
    ]);
    trail([
      [-5, 0],
      [-4, -2],
      [-2, -3],
      [1, -3],
    ]);
    trail([
      [-4, -2],
      [-4, -4],
      [-4, -5.6],
    ]);
    trail([
      [4, 3],
      [6, 4.5],
      [8, 5],
    ]);
    for (const [x, z] of VOLCANO_CLEARINGS) {
      const p = gladePosition(x, z);
      mesh(
        new THREE.CylinderGeometry(1.55, 1.6, 0.04, 20),
        ash,
        this.root,
        p.x,
        0.025,
        p.z,
      );
    }
    for (const [x, z, rx, rz] of VOLCANO_LAVA) {
      const p = gladePosition(x, z);
      const rim = mesh(
        new THREE.CylinderGeometry(1, 1.08, 0.16, 18),
        rock,
        this.root,
        p.x,
        0.04,
        p.z,
      );
      rim.scale.set(gladeDistance(rx + 0.2), 1, gladeDistance(rz + 0.2));
      const lava = mesh(
        new THREE.CircleGeometry(1, 24),
        this.glow,
        this.root,
        p.x,
        0.13,
        p.z,
      );
      lava.rotation.x = -Math.PI / 2;
      lava.scale.set(gladeDistance(rx), gladeDistance(rz), 1);
      lava.castShadow = false;
      this.collision.addEllipse(
        p.x,
        p.z,
        gladeDistance(rx + 0.2),
        gladeDistance(rz + 0.2),
      );
    }
    // A hollow, low-poly crater makes the volcano readable from the overhead camera.
    const volcano = new THREE.Group();
    volcano.name = "volcano";
    volcano.position.set(gladeDistance(0), 0, gladeDistance(-6.3));
    this.root.add(volcano);
    mesh(
      new THREE.CylinderGeometry(1.05, 3.2, 3.4, 12, 1, true),
      rock,
      volcano,
      0,
      1.7,
    );
    const crater = mesh(
      new THREE.CylinderGeometry(1.05, 0.7, 0.6, 12, 1, true),
      material("#9c605b"),
      volcano,
      0,
      3.1,
    );
    (crater.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
    mesh(
      new THREE.CylinderGeometry(0.76, 0.76, 0.04, 16),
      this.glow,
      volcano,
      0,
      2.85,
    );
    this.collision.addEllipse(
      volcano.position.x,
      volcano.position.z,
      3.25,
      3.25,
    );
    const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
    for (const [x, z, s] of [
      [-9, 5, 0.65],
      [-9, 0, 0.6],
      [-6, -5, 0.9],
      [-4, 5, 0.55],
      [3, 6, 0.7],
      [8, 1, 0.7],
      [9, -6, 1],
      [-9, -6, 0.9],
      [5, -5, 0.6],
      [9, 6, 0.5],
    ]) {
      const p = gladePosition(x, z);
      const b = mesh(rockGeometry, rock, this.root, p.x, s * 0.65, p.z);
      b.scale.set(s * 1.2, s, s);
      b.rotation.y = x;
      this.collision.add(p.x, p.z, s);
    }
    const trunk = material("#493c46");
    for (const [x, z] of [
      [-10, 2],
      [-6, 6],
      [9, 3],
      [-7, -6],
      [7, -6],
    ]) {
      const p = gladePosition(x, z);
      mesh(
        new THREE.CylinderGeometry(0.12, 0.25, 1.8, 6),
        trunk,
        this.root,
        p.x,
        0.9,
        p.z,
      );
      const branch = box(
        this.root,
        trunk,
        p.x + 0.2,
        1.2,
        p.z,
        0.7,
        0.13,
        0.14,
      );
      branch.rotation.z = 0.7;
      this.collision.add(p.x, p.z, 0.25);
    }
    // Fixed placements keep decorations out of paths and make reloads identical.
    for (let i = 0; i < 42; i++) {
      const x = -10 + ((i * 7.31) % 20),
        z = -7 + ((i * 3.73) % 14);
      if (this.collision.free(gladeDistance(x), gladeDistance(z), 0.1)) {
        const pebble = mesh(
          rockGeometry,
          rock,
          this.root,
          gladeDistance(x),
          0.045,
          gladeDistance(z),
        );
        pebble.name = "volcano-pebble";
        pebble.scale.set(0.11, 0.07, 0.08);
      }
    }
    for (const [x, z] of [
      [-8, -0.6],
      [5.5, -4.7],
      [1.3, 6.1],
    ]) {
      const p = gladePosition(x, z);
      mesh(
        new THREE.ConeGeometry(0.18, 0.6, 5),
        this.glow,
        this.root,
        p.x,
        0.3,
        p.z,
      );
      this.collision.add(p.x, p.z, 0.22);
      const crack = box(
        this.root,
        this.glow,
        p.x + 0.3,
        0.025,
        p.z + 0.2,
        0.8,
        0.025,
        0.065,
      );
      crack.rotation.y = 0.6;
      crack.castShadow = false;
    }
    // Burnt ground detail, scattered like the glade flowers but fire themed.
    volcanoGround(this.root, this.collision, trailPoints, this.glow, {
      seed: 53,
      count: 110,
      minX: -10.5,
      minZ: -7.35,
      width: 21,
      depth: 14.7,
    });
  }
  update(dt: number, time: number) {
    const state = gameStore.getState();
    this.chest.update(dt, state.chests["volcano-01"] && !(state.activeChest === "volcano-01" && state.overlay === "quiz"));
    for (const rupee of this.rupees) rupee.update(time, state.collected.includes(rupee.id));
    this.glow.emissiveIntensity = 0.65 + Math.sin(time * 1.4) * 0.12;
    this.portal.update(true, time);
  }
  dispose() {
    disposeTree(this.root);
  }
}
