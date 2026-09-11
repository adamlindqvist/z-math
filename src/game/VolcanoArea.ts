import { StrangeRock } from "./entities/StrangeRock";
import { VOLCANO_ROCK_SECRET } from "./secrets/definitions";
import { caveMouth } from "./caveScenery";
import { StoneGiantEncounter } from "./minibosses/StoneGiantEncounter";
import { RUNE_STONES, STONE_GIANT_CENTER, inStoneGiantArena, minibossDefeated } from "./minibosses/definitions";
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
  VOLCANO_INNER_ENTRANCE,
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
  rock = new StrangeRock(VOLCANO_ROCK_SECRET, gameStore.getState().secrets[VOLCANO_ROCK_SECRET.id].revealed);
  private secretResetId = gameStore.getState().resetId;
  private rockRupees = VOLCANO_ROCK_SECRET.pickupIds.map((id, i) => {
    const angle = i * Math.PI * 2 / VOLCANO_ROCK_SECRET.pickupIds.length;
    return new Collectible(id, VOLCANO_ROCK_SECRET.position.x + Math.cos(angle) * 0.28,
      VOLCANO_ROCK_SECRET.position.z + Math.sin(angle) * 0.28);
  });
  rupees = [...VOLCANO_RUPEES.map(({ id, x, z }) => new Collectible(id, x, z)), ...this.rockRupees];
  miniboss = new StoneGiantEncounter();
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
  private innerPortal = caveMouth(this.root, this.collision, VOLCANO_INNER_ENTRANCE);
  passages(state = gameStore.getState()) {
    return [{ ...VOLCANO_RETURN, destination: null },
      ...(minibossDefeated(state.minibosses, "stone_giant") ? [{ ...VOLCANO_INNER_ENTRANCE, destination: { world: "volcano-interior" as const } }] : [])];
  }
  interactions(state: GameState): Interaction[] {
    const rockInteractions: Interaction[] = this.rock.phase === "waiting" &&
      !state.activeSecret && !state.encounter && !state.secrets[VOLCANO_ROCK_SECRET.id].revealed
      ? [{ ...VOLCANO_ROCK_SECRET.position, target: { kind: "secret", id: VOLCANO_ROCK_SECRET.id, label: "Flytta" } }] : [];
    return [...rockInteractions, ...this.miniboss.interactions(state), {
      ...VOLCANO_CHEST_POSITION,
      target: { kind: "chest", id: "volcano-01", label: state.chests["volcano-01"] ? "Titta i kistan" : "Öppna" },
    }];
  }
  constructor() {
    this.root.name = "volcano-world";
    this.root.add(this.miniboss.root, this.rock.root);
    this.collision.dynamic = this.rock.obstacle();
    for (const stone of RUNE_STONES) this.collision.add(stone.x, stone.z, 0.57);

    const { x, z } = VOLCANO_CHEST_POSITION;
    this.chest.root.position.set(x, 0, z);
    this.chest.root.userData.target = { kind: "chest", id: "volcano-01", label: "Öppna" };
    this.root.add(this.chest.root);
    for (const rupee of this.rupees) {
      rupee.update(0, gameStore.getState().collected.includes(rupee.id));
      this.root.add(rupee.root);
    }
    this.updateRockRupees(0);
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
    trail([[1, -3], [0, -3.84]]);
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
      if (inStoneGiantArena(p.x, p.z)) continue;
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
    // Grow upward and sideways while keeping the entrance and front slope in place.
    volcano.scale.set(1.2, 1.15, 1);
    volcano.position.set(gladeDistance(0), 0, gladeDistance(-6.9));
    this.root.add(volcano);
    const mountainGeometry = new THREE.CylinderGeometry(1.05, 3.2, 3.4, 12, 3, true);
    const vertices = mountainGeometry.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
      const angle = Math.atan2(z, x);
      const variation = y > 1.6 ? 1 : 0.92 + Math.sin(angle * 3 + y) * 0.07;
      vertices.setXYZ(i, x * variation, y, z * variation);
    }
    mountainGeometry.computeVertexNormals();
    mesh(
      mountainGeometry,
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
      3.05,
    );
    this.collision.addEllipse(
      volcano.position.x,
      volcano.position.z,
      3.25 * volcano.scale.x,
      3.25 * volcano.scale.z,
    );
    const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const shoulder = mesh(rockGeometry, rock, this.root, side * (1.2 + i * 0.28), 0.8 + i * 0.25, -6.45 - i * 0.8);
        shoulder.scale.set(0.8, 1.3 + i * 0.3, 1.1);
        shoulder.name = "volcano-rock-shoulder";
        this.collision.addEllipse(shoulder.position.x, shoulder.position.z, 0.8, 1.1);
      }
    }
    for (const [x, z, s] of [
      [-9, 5, 0.65],
      [-9, 0, 0.6],
      [-6, -5, 0.9],
      [-4, 5, 0.55],
      [-3, 6, 0.7],
      [10, 0, 0.7],
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
      [10, 3],
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
      if (!inStoneGiantArena(gladeDistance(x), gladeDistance(z)) && this.collision.free(gladeDistance(x), gladeDistance(z), 0.1)) {
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
      exclude: (x, z) => inStoneGiantArena(x, z) || Math.hypot(x - VOLCANO_INNER_ENTRANCE.x, z - VOLCANO_INNER_ENTRANCE.z) < 2,
    });
  }
  update(dt: number, time: number, playerPosition?: THREE.Vector3) {
    this.miniboss.update(dt, playerPosition);
    const state = gameStore.getState();
    if (this.secretResetId !== state.resetId) {
      this.secretResetId = state.resetId;
      this.rock.reset(state.secrets[VOLCANO_ROCK_SECRET.id].revealed);
    }
    if (state.activeSecret === VOLCANO_ROCK_SECRET.id) this.rock.start();
    if (this.rock.update(dt, !!state.overlay || !!state.motion || !!state.encounter))
      gameStore.revealSecret(VOLCANO_ROCK_SECRET.id);
    // A chest can appear under the player after the collapse. Let them walk
    // out before making it solid; never trap them inside a new obstacle.
    const clearOfChest = !playerPosition || Math.hypot(
      Math.max(Math.abs(playerPosition.x - STONE_GIANT_CENTER.x) - 0.54, 0),
      Math.max(Math.abs(playerPosition.z - STONE_GIANT_CENTER.z) - 0.4, 0),
    ) >= 0.32;
    this.collision.dynamic = clearOfChest && minibossDefeated(state.minibosses, "stone_giant") && !state.encounter
      ? [{ ...STONE_GIANT_CENTER, halfX: 0.54, halfZ: 0.4 }] : [];
    this.collision.dynamic.push(...this.rock.obstacle(playerPosition));
    this.chest.update(dt, state.chests["volcano-01"] && !(state.activeChest === "volcano-01" && state.overlay === "quiz"));
    for (const rupee of this.rupees) rupee.update(time, state.collected.includes(rupee.id));
    this.updateRockRupees(time);
    this.glow.emissiveIntensity = 0.65 + Math.sin(time * 1.4) * 0.12;
    const opened = minibossDefeated(state.minibosses, "stone_giant");
    if (!opened) this.collision.dynamic.push({ ...VOLCANO_INNER_ENTRANCE, halfX: 0.7, halfZ: 0.2 });
    this.innerPortal.update(opened, time);
    this.portal.update(true, time);
  }
  private updateRockRupees(time: number) {
    const state = gameStore.getState();
    for (const rupee of this.rockRupees)
      rupee.update(time, !state.secrets[VOLCANO_ROCK_SECRET.id].revealed || state.collected.includes(rupee.id));
  }
  dispose() {
    disposeTree(this.root);
  }
}
