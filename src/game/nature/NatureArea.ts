import * as THREE from "three";
import {
  type Area,
  type Interaction,
  type Passage,
  disposeTree,
} from "../Area";
import { CollisionSystem } from "../CollisionSystem";
import { ball, box, material, mesh } from "../models";
import { Collectible } from "../entities/Collectible";
import { Chest } from "../entities/Chest";
import { DUNGEONS, natureRestored } from "../dungeons/definitions";
import { portal } from "../dungeons/models";
import {
  WORLD_OBJECTS,
  type WorldObjectId,
} from "../interactables/definitions";
import { gameStore, type GameState } from "../../store/gameStore";
import { DEFAULT_ENVIRONMENT } from "../environment";
import {
  NATURE_ENTRY,
  NATURE_EXIT,
  NATURE_CHEST,
  NATURE_RUPEES,
  type NatureWorld,
} from "./layout";
import { animal, palm } from "./models";

/** Shared lifecycle and interaction plumbing; scenery and traversal differ by world. */
export class NatureArea implements Area {
  root = new THREE.Group();
  collision = new CollisionSystem(10, 13, 11);
  cameraMode = "glade" as const;
  spawn = { x: 0, z: 20.6 };
  rupees: Collectible[];
  environment;
  private chest;
  private animal;
  private water = new THREE.Group();
  private bridge = new THREE.Group();
  private bridgeProgress: number;
  private plants: ReturnType<typeof palm>[] = [];
  private objects = new Map<WorldObjectId, THREE.Group>();
  private particles = new THREE.Group();
  private lastEvent = gameStore.getState().objectEvent;
  private reactionTime = 2;
  private reacting: WorldObjectId | null = null;
  constructor(
    private world: NatureWorld,
    animateRestoration = false,
  ) {
    const wet = world === "water",
      state = gameStore.getState();
    this.root.name = `${world}-world`;
    this.environment = {
      ...DEFAULT_ENVIRONMENT,
      background: wet ? "#b8e6e9" : "#f3dba0",
      ground: wet ? "#78b5a8" : "#caa66b",
    };
    this.bridgeProgress =
      natureRestored(state.dungeons, world) && !animateRestoration ? 1 : 0;
    const sand = material(wet ? "#e6d6a0" : "#e4bd78"),
      path = material(wet ? "#f7e8b7" : "#f3d79d");
    box(this.root, sand, 0, -0.18, 11, 20, 0.3, 26);
    // Generous paths connect every essential interaction.
    box(this.root, path, 0, 0.005, 11, 1.9, 0.03, 23);
    box(this.root, path, -2.5, 0.01, 18, 5, 0.03, 1.7);
    box(this.root, path, 2.5, 0.01, 7.4, 5, 0.03, 1.7);
    box(this.root, path, 5, 0.01, 6.7, 1.4, 0.03, 1.5);
    box(this.root, path, -1.5, 0.01, 8, 3, 0.03, 1.7);
    this.root.add(this.water, this.bridge, this.particles);
    this.water.name = wet ? "restored-waterfall" : "restored-oasis";
    const pool = material("#4dbacb", 0.35);
    // The pond bed remains impassable even when dry, so filling it never traps the player.
    ball(this.root, material("#baa782"), -6, -0.08, 8, 2.1, 0.13, 2.2);
    this.collision.addEllipse(-6, 8, 2.1, 2.2);
    ball(this.water, pool, -6, 0.04, 8, 1.95, 0.07, 2.05);
    for (const [x, z] of [
      [-8, 6],
      [-8, 10],
      [-5, 5],
      [-4.7, 10],
    ]) {
      this.plants.push(palm(this.root, x, z, wet));
      this.collision.add(x, z, 0.3);
    }
    if (wet) {
      // Two channels divide the shore into islands. Only the wooden bridges cross water.
      for (const [z, depth] of [
        [14, 2],
        [3, 4],
      ]) {
        box(this.root, pool, 0, 0.055, z, 20, 0.07, depth);
        for (const side of [-1, 1])
          this.collision.add(side * 5.65, z, 4.35, depth / 2);
        const deck = z === 3 ? this.bridge : new THREE.Group();
        if (z !== 3) this.root.add(deck);
        deck.position.set(0, 0, z + depth / 2);
        for (let i = 0; i < depth * 5; i++)
          box(
            deck,
            material("#a27c51"),
            0,
            0.12,
            -i * 0.2 - 0.1,
            2.5,
            0.12,
            0.18,
          );
        for (const side of [-1, 1]) {
          box(
            deck,
            material("#d9b985"),
            side * 1.22,
            0.48,
            -depth / 2,
            0.08,
            0.08,
            depth,
          );
          this.collision.add(side * 1.3, z, 0.06, depth / 2);
        }
      }
      for (let i = 0; i < 5; i++)
        ball(
          this.root,
          material("#819c9a"),
          -7 + i * 0.5,
          0.9,
          5.7,
          0.6,
          1.2,
          0.4,
        );
      box(this.water, pool, -6, 0.95, 6, 1.1, 1.9, 0.1);
      for (let i = 0; i < 18; i++) {
        const x = (i % 2 ? -1 : 1) * (3 + (i % 5) * 1.2),
          z = 15.5 + Math.floor(i / 6) * 2.6;
        for (let j = 0; j < 3; j++)
          box(
            this.root,
            material("#809954"),
            x + j * 0.11,
            0.23,
            z,
            0.055,
            0.46 + j * 0.08,
            0.06,
          );
      }
      portal(this.root, 0, 0, "sand", true);
    } else {
      for (let i = 0; i < 18; i++) {
        const side = i % 2 ? 1 : -1,
          x = side * (7.5 + (i % 3) * 0.4),
          z = -0.5 + Math.floor(i / 2) * 2.7;
        if (side < 0 && z > 3 && z < 12) continue;
        ball(
          this.root,
          material(i % 3 ? "#d6a764" : "#c69a66"),
          x,
          0.12,
          z,
          1.5,
          0.4 + (i % 3) * 0.25,
          1.2,
        );
        this.collision.addEllipse(x, z, 1.4, 1.1);
        if (i % 3 === 0) {
          const cactus = material("#71955d");
          box(this.root, cactus, x, 0.8, z, 0.3, 1.4, 0.32);
          box(this.root, cactus, x + 0.27, 0.95, z, 0.5, 0.18, 0.2);
          box(this.root, cactus, x + 0.5, 1.12, z, 0.17, 0.5, 0.2);
        }
      }
      // Sunlit sandstone landmark ends the trail beyond the temple.
      for (const x of [-2, 2])
        box(this.root, material("#c59254"), x, 1, 0, 0.8, 2, 0.8);
    }
    portal(
      this.root,
      NATURE_ENTRY.x,
      NATURE_ENTRY.z,
      wet ? "fire" : "water",
      true,
    );
    const temple = DUNGEONS.find((d) => d.id === world)!;
    portal(this.root, temple.entrance.x, temple.entrance.z, temple.theme, true);
    for (const p of [
      NATURE_ENTRY,
      temple.entrance,
      ...(wet ? [NATURE_EXIT] : []),
    ])
      for (const side of [-1, 1])
        this.collision.add(p.x + side * 0.95, p.z, 0.25, 0.28);
    this.chest = new Chest(state.chests[`${world}-01`]);
    this.chest.root.position.set(NATURE_CHEST.x, 0, NATURE_CHEST.z);
    this.chest.root.userData.target = {
      kind: "chest",
      id: `${world}-01`,
      label: "Öppna",
    };
    this.root.add(this.chest.root);
    this.collision.add(-5, 18, 0.5, 0.35);
    this.rupees = NATURE_RUPEES.filter((r) => r.world === world).map(
      (r) => new Collectible(r.id, r.x, r.z),
    );
    this.rupees.forEach((r) => this.root.add(r.root));
    this.animal = animal(world);
    for (const id of Object.keys(WORLD_OBJECTS) as WorldObjectId[]) {
      const definition = WORLD_OBJECTS[id];
      if (
        !("world" in definition.location) ||
        definition.location.world !== world
      )
        continue;
      let object: THREE.Group;
      if (definition.behavior.kind === "animal") object = this.animal.root;
      else if (id === "desert-palm") object = palm(this.root, 0, 0).root;
      else {
        object = new THREE.Group();
        if (id === "sand-pot") {
          mesh(
            new THREE.CylinderGeometry(0.28, 0.36, 0.6, 8),
            material("#be7850"),
            object,
            0,
            0.3,
          );
          box(object, material("#f3d998"), 0, 0.58, 0, 0.62, 0.08, 0.62);
        } else {
          ball(
            object,
            material(id === "pearl-clam" ? "#ffe4c7" : "#8aadae"),
            0,
            0.22,
            0,
            0.4,
            0.24,
            0.35,
          );
          if (id === "pearl-clam")
            for (let i = -2; i <= 2; i++)
              box(
                object,
                material("#d5a18b"),
                i * 0.11,
                0.41,
                0,
                0.025,
                0.025,
                0.4,
              );
        }
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
        definition.behavior.kind === "animal" ? 0.65 : 0.3,
        definition.behavior.kind === "animal" ? 0.9 : 0.3,
      );
    }
    for (let i = 0; i < 8; i++)
      ball(
        this.particles,
        material(wet ? "#c4f5f5" : "#efd6a0"),
        Math.sin(i * 2) * 0.4,
        i * 0.08,
        Math.cos(i * 2) * 0.4,
        0.065,
      );
    this.update(0, 0);
  }
  passages(state: GameState): Passage[] {
    const temple = DUNGEONS.find((d) => d.id === this.world)!;
    return [
      {
        ...NATURE_ENTRY,
        destination: {
          world: this.world === "water" ? "volcano-interior" : "water",
        },
      },
      {
        ...temple.entrance,
        destination: { dungeon: this.world, room: "light" },
      },
      ...(this.world === "water" &&
      natureRestored(state.dungeons, "water") &&
      this.bridgeProgress >= 1
        ? [{ ...NATURE_EXIT, destination: { world: "desert" as const } }]
        : []),
    ];
  }
  interactions(state: GameState): Interaction[] {
    return [
      {
        ...NATURE_CHEST,
        target: {
          kind: "chest",
          id: `${this.world}-01`,
          label: state.chests[`${this.world}-01`] ? "Titta i kistan" : "Öppna",
        },
      },
      ...[...this.objects].map(([id]) => ({
        x: WORLD_OBJECTS[id].x,
        z: WORLD_OBJECTS[id].z,
        target: {
          kind: "worldObject" as const,
          id,
          label: WORLD_OBJECTS[id].label,
        },
      })),
    ];
  }
  update(dt: number, time: number) {
    const state = gameStore.getState(),
      restored = natureRestored(state.dungeons, this.world);
    this.water.visible = restored;
    this.bridgeProgress = restored
      ? Math.min(1, this.bridgeProgress + dt * 0.65)
      : 0;
    this.bridge.rotation.x = (-(1 - this.bridgeProgress) * Math.PI) / 2;
    this.collision.dynamic =
      this.world === "water" && this.bridgeProgress < 1
        ? [{ x: 0, z: 3, halfX: 1.3, halfZ: 2 }]
        : [];
    if (this.world === "desert")
      this.plants.forEach((p) =>
        p.leaves.color.set(restored ? "#619951" : "#b4a061"),
      );
    this.rupees.forEach((r) => r.update(time, state.collected.includes(r.id)));
    this.chest.update(
      dt,
      state.chests[`${this.world}-01`] &&
        !(state.activeChest === `${this.world}-01` && state.overlay === "quiz"),
    );
    if (state.objectEvent !== this.lastEvent) {
      this.lastEvent = state.objectEvent;
      if (state.objectEvent && this.objects.has(state.objectEvent.id)) {
        this.reacting = state.objectEvent.id;
        this.reactionTime = 0;
      }
    }
    this.reactionTime = Math.min(
      2,
      this.reactionTime + (state.overlay ? 0 : dt),
    );
    const pulse = Math.sin((this.reactionTime / 2) * Math.PI);
    const animalAction = this.reacting === "ella" || this.reacting === "gullan";
    this.animal.head.rotation.x =
      restored && animalAction ? pulse * 0.6 : Math.sin(time * 1.4) * 0.025;
    this.animal.spray.visible =
      this.world === "water" &&
      restored &&
      animalAction &&
      this.reactionTime < 2;
    this.animal.spray.scale.setScalar(0.9 + Math.sin(time * 8) * 0.1);
    this.particles.visible =
      !!this.reacting && !animalAction && this.reactionTime < 2;
    if (this.reacting) {
      const object = this.objects.get(this.reacting)!;
      if (!animalAction)
        object.rotation.z = Math.sin(this.reactionTime * 10) * pulse * 0.08;
      this.particles.position.copy(object.position);
      this.particles.position.y = pulse * 0.9;
      this.particles.rotation.y = time;
    }
  }
  dispose() {
    disposeTree(this.root);
  }
}
