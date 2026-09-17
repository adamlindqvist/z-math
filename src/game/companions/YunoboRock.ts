import * as THREE from "three";
import { ball, box, material, mesh, flame } from "../models";
import { gameStore, type GameState } from "../../store/gameStore";
import { hasYunobo, YUNOBO_ROCK } from "./definitions";
import type { Interaction } from "../Area";

export class YunoboRock {
  root = new THREE.Group();
  private stone = new THREE.Group();
  private flowers = new THREE.Group();
  private emblem: THREE.Group;
  private bloom = 1;
  private wasHelping = false;
  constructor() {
    this.root.name = "yunobo-rock";
    this.stone.userData.target = { kind: "yunoboRock", label: "Hjälp, Yunobo!" };
    this.root.position.set(YUNOBO_ROCK.x, 0, YUNOBO_ROCK.z);
    this.root.add(this.stone, this.flowers);
    const rock = material("#8a6c60"), crack = material("#ffcd76");
    crack.emissive.set("#f9a64e");
    crack.emissiveIntensity = 0.6;
    const boulder = mesh(new THREE.DodecahedronGeometry(0.7, 0), rock, this.stone, 0, 0.6, 0);
    boulder.scale.set(1.1, 0.95, 0.85);
    for (const [x, y, angle] of [[-0.15, 0.86, -0.6], [0.02, 0.61, 0.55], [-0.06, 0.36, -0.3]])
      box(this.stone, crack, x, y, 0.56, 0.045, 0.35, 0.035).rotation.z = angle;
    this.emblem = flame(this.stone, 0, 1.5, 0, 0.48);
    const petals = material("#ffce7e"), center = material("#fff4c6"), stem = material("#6dba89");
    petals.emissive.set("#ff9e47"); petals.emissiveIntensity = 0.55;
    center.emissive.set("#fff0a2"); center.emissiveIntensity = 0.65;
    for (let i = 0; i < 5; i++) {
      const x = Math.sin(i * 2.4) * 0.42, z = Math.cos(i * 2.4) * 0.35;
      const y = 0.36 + i % 2 * 0.18;
      box(this.flowers, stem, x, y / 2, z, 0.045, y, 0.045);
      for (let j = 0; j < 5; j++) {
        const a = j / 5 * Math.PI * 2;
        ball(this.flowers, petals, x + Math.sin(a) * 0.13, y, z + Math.cos(a) * 0.13, 0.1, 0.05, 0.1);
      }
      ball(this.flowers, center, x, y + 0.04, z, 0.085, 0.05, 0.085);
    }
    this.update(0, 0);
  }
  interactions(state: GameState): Interaction[] {
    return hasYunobo(state.dungeons) && !state.yunobo.rockBroken ? [{
      x: YUNOBO_ROCK.x, z: YUNOBO_ROCK.z,
      target: { kind: "yunoboRock", label: "Hjälp, Yunobo!" },
    }] : [];
  }
  get blocking() {
    const state = gameStore.getState();
    return hasYunobo(state.dungeons) && (!state.yunobo.rockBroken || state.yunoboHelping);
  }
  update(dt: number, time: number) {
    const state = gameStore.getState();
    this.root.visible = hasYunobo(state.dungeons);
    if (this.wasHelping && !state.yunoboHelping) this.bloom = 0;
    this.wasHelping = state.yunoboHelping;
    if (!state.overlay) this.bloom = Math.min(1, this.bloom + dt * 1.6);
    this.stone.visible = !state.yunobo.rockBroken || state.yunoboHelping;
    this.flowers.visible = state.yunobo.rockBroken && !state.yunoboHelping;
    this.flowers.scale.setScalar(0.25 + this.bloom * 0.75);
    this.emblem.position.y = 1.5 + Math.sin(time * 2) * 0.08;
  }
}
