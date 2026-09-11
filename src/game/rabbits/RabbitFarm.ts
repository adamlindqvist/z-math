import * as THREE from "three";
import { gameStore } from "../../store/gameStore";
import type { Interaction } from "../Area";
import type { CollisionSystem } from "../CollisionSystem";
import { material, mesh, silhouette } from "../models";
import { FARMER_POSITION, FARM_YARD, HOME_RADIUS, FOLLOW_GAP, RABBITS, rabbitsHome } from "./definitions";
import { RabbitFollower } from "./following";
import { buildFarm, rabbitModel } from "./models";

export class RabbitFarm {
  readonly rabbits = RABBITS.map(definition => ({
    definition, root: rabbitModel(definition.color), follower: new RabbitFollower(), following: false,
  }));
  private scenery: ReturnType<typeof buildFarm>;
  private hearts = new THREE.Group();
  private carrot = new THREE.Group();
  private careSequence = -1;
  private careTime = 0;
  private bloom = 0;
  private resetId: number;
  private idleTime = 0;
  private idleParts = this.rabbits.map(({ root }) => ({
    body: root.getObjectByName("rabbit-body")!,
    nose: root.getObjectByName("rabbit-nose")!,
    left: root.getObjectByName("rabbit-ear-left")!,
    right: root.getObjectByName("rabbit-ear-right")!,
  }));
  constructor(root: THREE.Group, private collision: CollisionSystem, private store = gameStore) {
    this.scenery = buildFarm(root, collision);
    this.resetId = store.getState().resetId;
    for (const rabbit of this.rabbits) {
      rabbit.root.name = `rabbit-${rabbit.definition.id}`;
      root.add(rabbit.root);
    }
    const pink = material("#f18aa6");
    for (let i = 0; i < 3; i++) {
      const heart = silhouette(this.hearts, pink, [[0, -0.13], [-0.17, 0.02], [-0.16, 0.14], [-0.07, 0.19], [0, 0.12], [0.07, 0.19], [0.16, 0.14], [0.17, 0.02]]);
      heart.position.x = (i - 1) * 0.3;
    }
    mesh(new THREE.ConeGeometry(0.085, 0.36, 8), material("#f59a40"), this.carrot).rotation.z = Math.PI;
    mesh(new THREE.ConeGeometry(0.1, 0.16, 6), material("#73a551"), this.carrot, 0, 0.23);
    root.add(this.hearts, this.carrot);
    this.restore();
  }
  private restore() {
    const state = this.store.getState();
    for (const rabbit of this.rabbits) {
      const p = state.rabbits[rabbit.definition.id] ? rabbit.definition.home : rabbit.definition.position;
      rabbit.root.position.set(p.x, 0, p.z);
      rabbit.follower.reset(); rabbit.following = false;
    }
    this.hearts.visible = this.carrot.visible = false;
    this.careSequence = -1; this.careTime = 0; this.idleTime = 0;
    this.bloom = rabbitsHome(state.rabbits) ? 1 : 0;
  }
  interactions(): Interaction[] {
    const state = this.store.getState();
    if (!state.bridgeUnlocked || state.location) return [];
    return [
      { target: { kind: "farmer", label: "Prata" }, ...FARMER_POSITION },
      ...this.rabbits.flatMap(({ definition, root }) => {
        const home = state.rabbits[definition.id];
        const available = !state.followingRabbits.includes(definition.id) &&
          (!home || (rabbitsHome(state.rabbits) && !state.rabbitCare));
        const target = { kind: "rabbit" as const, id: definition.id,
          label: !home ? "Följ med" : state.rabbitNextCare[definition.id] === "feed" ? "Mata" : "Klappa" };
        root.userData.target = available ? target : undefined;
        return available ? [{ target, x: root.position.x, z: root.position.z }] : [];
      }),
    ];
  }
  update(dt: number, time: number, player?: THREE.Vector3) {
    let state = this.store.getState();
    if (this.resetId !== state.resetId) { this.resetId = state.resetId; this.restore(); }
    this.scenery.pictures.forEach((ink, i) => ink.color.set(state.rabbits[RABBITS[i].id] ? RABBITS[i].color : "#746855"));
    const paused = !!state.overlay || !!state.motion || !state.bridgeUnlocked;
    if (paused) dt = 0;
    this.idleTime += dt;
    if (rabbitsHome(state.rabbits)) this.bloom = Math.min(1, this.bloom + dt);
    this.scenery.flowers.visible = this.bloom > 0;
    this.scenery.flowers.scale.y = Math.max(0.01, this.bloom);
    for (const rabbit of this.rabbits) {
      const { id, home } = rabbit.definition;
      const following = state.followingRabbits.includes(id);
      if (!following && rabbit.following) {
        const p = state.rabbits[id] ? home : rabbit.definition.position;
        rabbit.root.position.set(p.x, 0, p.z); rabbit.follower.reset();
      }
      rabbit.following = following;
      if (dt > 0) {
        const index = RABBITS.findIndex(r => r.id === id);
        const parts = this.idleParts[index];
        const idle = !following && !state.rabbits[id];
        const phase = this.idleTime + index * 1.7;
        const twitch = idle ? Math.pow(Math.max(0, Math.sin(phase * 1.8)), 8) : 0;
        parts.body.scale.y = 0.32 * (1 + (idle ? Math.sin(phase * 2.4) * 0.045 : 0));
        parts.nose.position.z = 0.487 + (idle ? Math.sin(phase * 13) * twitch * 0.018 : 0);
        parts.left.rotation.z = 0.13 + twitch * 0.22;
        parts.right.rotation.z = -0.13 - twitch * 0.13;
        if (idle) rabbit.root.rotation.y = Math.sin(phase * 0.75) * 0.22;
      }

      if (dt > 0 && player && following) {
        const before = rabbit.root.position.clone();
        const moved = rabbit.follower.update(rabbit.root.position, player, dt, this.collision,
          FOLLOW_GAP * (1 + state.followingRabbits.indexOf(id)));
        if (moved) rabbit.root.rotation.y = Math.atan2(rabbit.root.position.x - before.x, rabbit.root.position.z - before.z);
        rabbit.root.position.y = moved ? Math.abs(Math.sin(time * 11)) * 0.15 : 0;
        if (Math.hypot(player.x - FARM_YARD.x, player.z - FARM_YARD.z) < HOME_RADIUS &&
          Math.hypot(rabbit.root.position.x - FARM_YARD.x, rabbit.root.position.z - FARM_YARD.z) < HOME_RADIUS) {
          this.store.bringRabbitHome(id); state = this.store.getState();
        }
      } else if (dt > 0 && state.rabbits[id]) {
        const index = RABBITS.findIndex(r => r.id === id);
        const play = rabbitsHome(state.rabbits) && state.rabbitCare?.id !== id;
        rabbit.root.position.set(home.x + (play ? Math.sin(time + index * 2) * 0.16 : 0),
          play ? Math.max(0, Math.sin(time * 3 + index * 2)) * 0.12 : 0,
          home.z + (play ? Math.cos(time + index * 2) * 0.16 : 0));
      }
    }
    const care = state.rabbitCare;
    if (care && care.sequence !== this.careSequence) { this.careSequence = care.sequence; this.careTime = 0; }
    this.hearts.visible = !!care;
    this.carrot.visible = care?.action === "feed";
    if (care) {
      this.careTime += dt;
      const rabbit = this.rabbits.find(r => r.definition.id === care.id)!;
      this.hearts.position.copy(rabbit.root.position); this.hearts.position.y += 1.1 + this.careTime * 0.6;
      this.hearts.children.forEach((heart, i) => { heart.position.y = Math.sin(this.careTime * 3 + i) * 0.08; });
      this.hearts.scale.setScalar(Math.min(1, this.careTime * 5) * Math.min(1, (1.25 - this.careTime) * 4));
      this.carrot.position.copy(rabbit.root.position); this.carrot.position.y += 0.5; this.carrot.position.z += 0.5;
      if (this.careTime >= 1.25) this.store.finishRabbitCare(care.sequence);
    }
  }
}
