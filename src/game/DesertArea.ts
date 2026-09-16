import { shellGate } from "./water/landmarks";
import { SeaModels } from "./water/scenery";
import * as THREE from "three";
import { type Area, type Interaction, type Passage, disposeTree } from "./Area";
import { CollisionSystem } from "./CollisionSystem";
import { Chest } from "./entities/Chest";
import { Collectible } from "./entities/Collectible";
import { gameStore, type GameState } from "../store/gameStore";
import { natureRestored } from "./dungeons/definitions";
import { WORLD_OBJECTS, type WorldObjectId } from "./interactables/definitions";
import { animal, palm } from "./nature/models";
import { NATURE_RUPEES } from "./nature/layout";
import { DEFAULT_ENVIRONMENT } from "./environment";
import { ball, material, mesh } from "./models";
import { portal } from "./dungeons/models";
import { desertGround, desertScenery } from "./desert/scenery";
import {
  DESERT_ENTRY,
  DESERT_SPAWN,
  DESERT_TEMPLE,
  DESERT_CHEST,
  DESERT_OASIS,
  DESERT_OBJECTS,
} from "./desert/layout";

export class DesertArea implements Area {
  root = new THREE.Group();
  collision = new CollisionSystem(24, 22, 11);
  cameraMode = "glade" as const;
  spawn = { ...DESERT_SPAWN };
  environment = {
    ...DEFAULT_ENVIRONMENT,
    background: "#f3dba0",
    ground: "#caa66b",
  };
  rupees: Collectible[];
  private chest;
  private gullan = animal("desert");
  private oasis = new THREE.Group();
  private plants: ReturnType<typeof palm>[] = [];
  private objects = new Map<WorldObjectId, THREE.Group>();
  private particles = new THREE.Group();
  private disposeScenery;
  private lastEvent = gameStore.getState().objectEvent;
  private reacting: WorldObjectId | null = null;
  private reactionTime = 2;
  private elapsed = 0;
  constructor() {
    const state = gameStore.getState();
    this.root.name = "desert-world";
    desertGround(this.root);
    this.oasis.name = "restored-oasis";
    this.root.add(this.oasis, this.particles);
    const { x, z } = DESERT_OASIS;
    ball(this.root, material("#baa782"), x, -0.08, z, 2.8, 0.13, 2.2);
    this.collision.addEllipse(x, z, 2.8, 2.2);
    ball(this.oasis, material("#4dbacb", 0.35), x, 0.04, z, 2.65, 0.07, 2.05);
    for (const [px, pz] of [
      [-2.5, 8],
      [1, 7.5],
      [2.5, 11.8],
    ]) {
      this.plants.push(palm(this.root, px, pz, false));
      this.collision.add(px, pz, 0.3);
    }
    this.disposeScenery = desertScenery(this.root, this.collision, this.oasis);
    const shellRoot = new THREE.Group();
    shellRoot.position.set(DESERT_ENTRY.x, 0, DESERT_ENTRY.z);
    shellRoot.rotation.y = DESERT_ENTRY.rotation;
    this.root.add(shellRoot);
    const shellCollision = new CollisionSystem();
    const gate = shellGate(shellRoot, shellCollision, new SeaModels(), "water");
    // The same shell is seen from the desert side, already open after restoration.
    this.collision.obstacles.push(...gate.update(1));
    for (const o of shellCollision.obstacles)
      this.collision.add(
        DESERT_ENTRY.x - o.x,
        DESERT_ENTRY.z - o.z,
        o.halfX,
        o.halfZ,
      );
    for (const o of shellCollision.ellipses)
      this.collision.addEllipse(
        DESERT_ENTRY.x - o.x,
        DESERT_ENTRY.z - o.z,
        o.radiusX,
        o.radiusZ,
      );
    for (const [position, theme] of [[DESERT_TEMPLE, "sand"]] as const) {
      portal(this.root, position.x, position.z, theme, true);
      for (const side of [-1, 1])
        this.collision.add(position.x + side * 0.95, position.z, 0.25, 0.28);
    }
    this.chest = new Chest(state.chests["desert-01"]);
    this.chest.root.position.set(DESERT_CHEST.x, 0, DESERT_CHEST.z);
    this.chest.root.userData.target = {
      kind: "chest",
      id: "desert-01",
      label: "Öppna",
    };
    this.root.add(this.chest.root);
    this.collision.add(DESERT_CHEST.x, DESERT_CHEST.z, 0.5, 0.35);
    this.rupees = NATURE_RUPEES.filter((r) => r.world === "desert").map(
      (r) => new Collectible(r.id, r.x, r.z),
    );
    this.rupees.forEach((r) => this.root.add(r.root));
    for (const id of Object.keys(
      DESERT_OBJECTS,
    ) as (keyof typeof DESERT_OBJECTS)[]) {
      const definition = WORLD_OBJECTS[id];
      let object: THREE.Group;
      if (id === "gullan") object = this.gullan.root;
      else if (id === "desert-palm") object = palm(this.root, 0, 0).root;
      else {
        object = new THREE.Group();
        ball(object, material("#be7850"), 0, 0.3, 0, 0.33, 0.36, 0.33);
        mesh(
          new THREE.CylinderGeometry(0.24, 0.24, 0.09, 12),
          material("#f3d998"),
          object,
          0,
          0.61,
        );
      }
      object.position.set(definition.x, 0, definition.z);
      object.userData.target = {
        kind: "worldObject",
        id,
        label: definition.label,
      };
      this.objects.set(id, object);
      this.root.add(object);
      this.collision.add(
        definition.x,
        definition.z,
        id === "gullan" ? 0.65 : 0.3,
        id === "gullan" ? 0.9 : 0.3,
      );
    }
    const dust = material("#efd6a0");
    for (let i = 0; i < 8; i++)
      ball(
        this.particles,
        dust,
        Math.sin(i * 2) * 0.4,
        i * 0.08,
        Math.cos(i * 2) * 0.4,
        0.065,
      );
    this.update(0, 0);
  }
  passages(_state: GameState): Passage[] {
    return [
      { ...DESERT_ENTRY, destination: { world: "water" } },
      { ...DESERT_TEMPLE, destination: { dungeon: "desert", room: "light" } },
    ];
  }
  interactions(state: GameState, position?: THREE.Vector3): Interaction[] {
    return [
      {
        ...DESERT_CHEST,
        target: {
          kind: "chest",
          id: "desert-01",
          label: state.chests["desert-01"] ? "Titta i kistan" : "Öppna",
        },
      },
      ...[...this.objects].map(([id, object]) => ({
        // Measure reach from Gullan's body edge, so her own solid body
        // neither shortens the interaction range nor blocks line of sight.
        x:
          object.position.x +
          (id === "gullan" && position
            ? THREE.MathUtils.clamp(position.x - object.position.x, -0.65, 0.65)
            : 0),
        z:
          object.position.z +
          (id === "gullan" && position
            ? THREE.MathUtils.clamp(position.z - object.position.z, -0.9, 0.9)
            : 0),
        target: {
          kind: "worldObject" as const,
          id,
          label: WORLD_OBJECTS[id].label,
        },
      })),
    ];
  }
  update(dt: number, _time: number) {
    const state = gameStore.getState(),
      step = state.overlay ? 0 : dt;
    this.elapsed += step;
    const restored = natureRestored(state.dungeons, "desert");
    this.gullan.eyes.setTempleCompleted(restored);
    this.oasis.visible = restored;
    this.plants.forEach((p) =>
      p.leaves.color.set(restored ? "#619951" : "#b4a061"),
    );
    this.rupees.forEach((r) =>
      r.update(this.elapsed, state.collected.includes(r.id)),
    );
    this.chest.update(
      step,
      state.chests["desert-01"] &&
        !(state.activeChest === "desert-01" && state.overlay === "quiz"),
    );
    if (state.objectEvent !== this.lastEvent) {
      this.lastEvent = state.objectEvent;
      if (state.objectEvent && this.objects.has(state.objectEvent.id)) {
        this.reacting = state.objectEvent.id;
        this.reactionTime = 0;
      }
    }
    this.reactionTime = Math.min(2, this.reactionTime + step);
    const pulse = Math.sin((this.reactionTime / 2) * Math.PI);
    this.gullan.head.rotation.x =
      restored && this.reacting === "gullan"
        ? pulse * 0.6
        : Math.sin(this.elapsed * 1.4) * 0.025;
    this.particles.visible =
      !!this.reacting && this.reacting !== "gullan" && this.reactionTime < 2;
    if (this.reacting && this.reacting !== "gullan") {
      const object = this.objects.get(this.reacting)!;
      object.rotation.z = Math.sin(this.reactionTime * 10) * pulse * 0.08;
      this.particles.position.copy(object.position);
      this.particles.position.y = pulse * 0.9;
      this.particles.rotation.y = this.elapsed;
    }
  }
  dispose() {
    this.disposeScenery();
    disposeTree(this.root);
  }
}
