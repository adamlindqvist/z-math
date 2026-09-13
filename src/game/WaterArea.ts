import { WATER_ENTRY, WATER_SPAWN } from "./water/layout";
import * as THREE from "three";
import { type Area, type Interaction, type Passage, disposeTree } from "./Area";
import { CollisionSystem } from "./CollisionSystem";
import { Chest } from "./entities/Chest";
import { Collectible } from "./entities/Collectible";
import { gameStore, type GameState } from "../store/gameStore";
import { natureRestored } from "./dungeons/definitions";
import { WORLD_OBJECTS, type WorldObjectId } from "./interactables/definitions";
import {
  NATURE_EXIT,
  NATURE_TEMPLE,
  NATURE_CHEST,
  NATURE_RUPEES,
} from "./nature/layout";
import { animal } from "./nature/models";
import { UNDERWATER_ENVIRONMENT } from "./environment";
import { SeaModels, seabed, reefScenery } from "./water/scenery";
import {
  basaltMouth,
  waterTemple,
  shellGate,
  seaLife,
} from "./water/landmarks";

export class WaterArea implements Area {
  root = new THREE.Group();
  collision = new CollisionSystem(11, 14, 11);
  spawn = { ...WATER_SPAWN };
  cameraMode = "glade" as const;
  environment = UNDERWATER_ENVIRONMENT;
  rupees: Collectible[];
  private chest;
  private models = new SeaModels();
  private gate;
  private progress: number;
  private light;
  private seaweed;
  private life;
  private elapsed = 0;
  private ella = animal("water");
  private reefMaterials: {
    material: THREE.MeshStandardMaterial;
    color: THREE.Color;
  }[] = [];
  private objects = new Map<WorldObjectId, THREE.Group>();
  private anemone = new THREE.Group();
  private clamLid = new THREE.Group();
  private reaction: WorldObjectId | null = null;
  private reactionTime = 2;
  private lastEvent = gameStore.getState().objectEvent;
  constructor(animateRestoration = false) {
    this.root.name = "underwater-world";
    const m = this.models,
      state = gameStore.getState();
    this.progress =
      natureRestored(state.dungeons, "water") && !animateRestoration ? 1 : 0;
    this.light = seabed(this.root);
    this.seaweed = reefScenery(this.root, this.collision, m);
    basaltMouth(this.root, this.collision, m);
    waterTemple(this.root, this.collision, m);
    this.gate = shellGate(this.root, this.collision, m);
    this.life = seaLife(this.root, m);
    // Ella's pale garden is a single recognisable reef, distinct from the healthy perimeter.
    const garden = new THREE.Group();
    garden.name = "ellas-coral-garden";
    this.root.add(garden);
    m.rock(garden, -6, 8, 1.6, 0.45, 1.5);
    this.collision.addEllipse(-6, 8, 1.65, 1.6);
    const colors = ["#ec879e", "#b29ae7", "#ffbd82", "#6bd1bd"];
    for (let i = 0; i < 8; i++) {
      const a = i * 2.4,
        mat = new THREE.MeshStandardMaterial({
          color: "#b7c6c1",
          roughness: 0.85,
        });
      this.reefMaterials.push({
        material: mat,
        color: new THREE.Color(colors[i % colors.length]),
      });
      m.coral(
        garden,
        -6 + Math.cos(a) * 1.02,
        8 + Math.sin(a) * 0.98,
        0.9 + (i % 3) * 0.22,
        i,
        mat,
      ).position.y = 0.18;
    }
    this.ella.root.position.set(-3, 0, 8);
    this.ella.root.rotation.y = 0.65;
    this.objects.set("ella", this.ella.root);
    this.root.add(this.ella.root);
    this.collision.add(-3, 8, 0.65, 0.9);
    // A low rocky pocket frames the chest without hiding its approach.
    m.rock(this.root, -7.5, 17.5, 0.9, 0.55, 1.3);
    this.collision.addEllipse(-7.5, 17.5, 0.75, 1.1);
    m.coral(this.root, -6.4, 17.1, 0.65, 0, m.palette.pink);
    m.coral(this.root, -5.8, 19.3, 0.65, 2, m.palette.violet);
    m.shell(this.root, -4.5, 19, 0.8);
    m.star(this.root, -3.6, 18.8, 0.5);
    this.chest = new Chest(state.chests["water-01"]);
    this.chest.root.position.set(-5, 0, 18);
    this.root.add(this.chest.root);
    this.chest.root.userData.target = {
      kind: "chest",
      id: "water-01",
      label: "Öppna",
    };
    this.collision.add(-5, 18, 0.5, 0.35);
    this.rupees = NATURE_RUPEES.filter((r) => r.world === "water").map(
      (r) => new Collectible(r.id, r.x, r.z),
    );
    this.rupees.forEach((r) => this.root.add(r.root));
    const anemone = new THREE.Group();
    anemone.position.set(-4, 0, 16);
    anemone.name = "sea-anemone";
    anemone.add(this.anemone);
    this.root.add(anemone);
    m.put(anemone, m.sphere, m.palette.violet, 0, 0.1, 0, 0.42, 0.12, 0.36);
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      m.limb(
        this.anemone,
        m.palette.pink,
        [Math.cos(a) * 0.17, 0.1, Math.sin(a) * 0.17],
        [Math.cos(a) * 0.34, 0.55 + (i % 3) * 0.07, Math.sin(a) * 0.34],
        0.045,
      );
      m.put(
        this.anemone,
        m.sphere,
        m.palette.ivory,
        Math.cos(a) * 0.34,
        0.55 + (i % 3) * 0.07,
        Math.sin(a) * 0.34,
        0.045,
      );
    }
    this.objects.set("sea-anemone", anemone);
    this.collision.add(-4, 16, 0.35);
    const clam = new THREE.Group();
    clam.name = "pearl-clam";
    clam.position.set(4, 0, 10);
    this.root.add(clam);
    m.shell(clam, 0, 0, 1.5);
    m.put(clam, m.sphere, m.palette.pearl, 0, 0.2, 0, 0.14);
    this.clamLid.position.set(0, 0.13, -0.36);
    clam.add(this.clamLid);
    m.shell(this.clamLid, 0, 0.36, 1.5);
    this.objects.set("pearl-clam", clam);
    this.collision.add(4, 10, 0.4);
    for (const [id, object] of this.objects)
      object.userData.target = {
        kind: "worldObject",
        id,
        label: WORLD_OBJECTS[id].label,
      };
    this.update(0, 0);
  }
  passages(state: GameState): Passage[] {
    return [
      { ...WATER_ENTRY, destination: { world: "volcano-interior" } },
      { ...NATURE_TEMPLE, destination: { dungeon: "water", room: "light" } },
      ...(natureRestored(state.dungeons, "water") && this.progress >= 1
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
          id: "water-01",
          label: state.chests["water-01"] ? "Titta i kistan" : "Öppna",
        },
      },
      ...[...this.objects].map(([id, object]) => ({
        x: object.position.x,
        z: object.position.z,
        target: object.userData.target,
      })),
    ];
  }
  update(dt: number, _time: number) {
    const state = gameStore.getState(),
      step = state.overlay ? 0 : dt;
    this.elapsed += step;
    this.progress = natureRestored(state.dungeons, "water")
      ? Math.min(1, this.progress + step * 0.45)
      : 0;
    const smooth = this.progress * this.progress * (3 - 2 * this.progress);
    this.gate.update(smooth);
    this.collision.dynamic =
      this.progress < 1 ? [{ x: 0, z: 0, halfX: 1.45, halfZ: 0.32 }] : [];
    for (const entry of this.reefMaterials)
      entry.material.color.set("#b7c6c1").lerp(entry.color, smooth);
    this.light.uniforms.time.value = this.elapsed;
    this.seaweed.forEach(
      (g, i) => (g.rotation.z = Math.sin(this.elapsed * 0.75 + i) * 0.07),
    );
    this.life(this.elapsed);
    this.rupees.forEach((r) =>
      r.update(this.elapsed, state.collected.includes(r.id)),
    );
    this.chest.update(
      step,
      state.chests["water-01"] &&
        !(state.activeChest === "water-01" && state.overlay === "quiz"),
    );
    if (state.objectEvent !== this.lastEvent) {
      this.lastEvent = state.objectEvent;
      if (state.objectEvent && this.objects.has(state.objectEvent.id)) {
        this.reaction = state.objectEvent.id;
        this.reactionTime = 0;
      }
    }
    this.reactionTime = Math.min(2, this.reactionTime + step);
    const pulse = Math.sin((this.reactionTime / 2) * Math.PI);
    this.anemone.scale.y =
      this.reaction === "sea-anemone" ? 1 - pulse * 0.75 : 1;
    this.anemone.rotation.y = Math.sin(this.elapsed) * 0.05;
    this.clamLid.rotation.x =
      this.reaction === "pearl-clam" ? -pulse * 1.05 : 0;
    this.ella.head.rotation.x =
      Math.sin(this.elapsed * 1.4) * 0.025 +
      (this.reaction === "ella" ? pulse * 0.16 : 0);
    this.ella.spray.visible = false;
  }
  dispose() {
    disposeTree(this.root);
  }
}
