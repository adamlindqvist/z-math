import * as THREE from "three";
import type { Area } from "../Area";
import { Tulin } from "../entities/Tulin";
import { CompanionTrail } from "./CompanionTrail";
import { hasTulin } from "./definitions";
import { gameStore } from "../../store/gameStore";
import { gladeDistance } from "../gladeLayout";
import { DUNGEONS } from "../dungeons/definitions";

export class TulinCompanion {
  readonly model = new Tulin();
  readonly root = this.model.root;
  // Fly to the other side at arrival and farther behind so Yunobo stays visible.
  private following = new CompanionTrail(this.root, 2.4, 1);
  private mounted = false;
  private waiting = false;
  private elapsed = 0;
  private greeting = 0;
  private bridgeUnlocked = gameStore.getState().bridgeUnlocked;
  private gustTime: number | null = null;
  private gustStart = new THREE.Vector3();
  private wind = new THREE.Group();
  private windMaterial = new THREE.MeshBasicMaterial({ color: "#ddfff6", transparent: true, opacity: 0.7, depthWrite: false });
  constructor() {
    this.wind.name = "tulin-bridge-wind";
    this.root.add(this.wind);
    for (let i = 0; i < 5; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.025, 4, 20, Math.PI * 1.6), this.windMaterial);
      ring.rotation.z = i * 1.7;
      this.wind.add(ring);
    }
    this.wind.visible = false;
  }
  reset(position: THREE.Vector3, area: Area) {
    this.following.reset(position, area);
    this.greeting = 0;
    this.bridgeUnlocked = gameStore.getState().bridgeUnlocked;
    this.gustTime = null;
    this.wind.visible = false;
    this.mounted = true;
    const state = gameStore.getState();
    const unlocked = hasTulin(state.dungeons);
    this.waiting = !unlocked && !state.location && area.cameraMode === "glade";
    this.root.visible = unlocked || this.waiting;
    if (this.waiting) {
      const entrance = DUNGEONS.find(d => d.id === "moss")!.entrance;
      // Stand beside the approach, outside both the doorway and its stepping stones.
      this.root.position.set(entrance.x - 2, 0, entrance.z + 1.4);
      this.root.rotation.y = 0;
    }
    this.model.animate(this.elapsed, 0, this.waiting, false, this.waiting);
  }
  update(dt: number, position: THREE.Vector3, area: Area, falling = false) {
    const state = gameStore.getState();
    const unlocked = hasTulin(state.dungeons);
    const waiting = !unlocked && !state.location && area.cameraMode === "glade";
    if (!this.mounted || waiting !== this.waiting || (unlocked && !this.root.visible && !falling)) this.reset(position, area);
    if (this.waiting) {
      this.root.visible = !falling;
      if (!falling && !state.overlay && !state.motion) {
        this.elapsed += dt;
        this.model.animate(this.elapsed, 0, true, false, true);
      }
      return;
    }
    if (!this.bridgeUnlocked && state.bridgeUnlocked && !state.location) {
      this.gustTime = 0;
      this.gustStart.copy(this.root.position);
    }
    this.bridgeUnlocked = state.bridgeUnlocked;
    this.root.visible = (unlocked || this.gustTime !== null) && !falling;
    if ((!unlocked && this.gustTime === null) || falling || state.overlay || state.motion) return;
    this.elapsed += dt;
    if (this.gustTime !== null) {
      this.gustTime = Math.min(0.9, this.gustTime + dt);
      const t = this.gustTime / 0.9;
      const destination = new THREE.Vector3(-1.4, 0, gladeDistance(7.9) + 0.45);
      this.root.position.lerpVectors(this.gustStart, destination, Math.min(1, this.gustTime / 0.18));
      this.root.rotation.y = Math.atan2(1.4, -0.45);
      this.model.animate(this.elapsed, 0, false, true);
      this.wind.visible = true;
      this.windMaterial.opacity = Math.min(1, (1 - t) * 4) * 0.75;
      this.wind.children.forEach((ring, i) => {
        const travel = (t * 2 + i / 5) % 1;
        ring.position.set(0, 1.4 + travel * 0.5, 0.5 + travel * 6.5);
        ring.scale.setScalar(0.7 + travel * 1.8);
      });
      if (t >= 1) {
        this.gustTime = null;
        this.wind.visible = false;
        this.following.restart(position);
      }
      return;
    }
    const speed = this.following.update(dt, position, area, state.riding ? 7 : 4);
    const greeting = !state.tulin.greeted && !state.riding && !state.encounter && !state.yunoboHelping;
    this.model.animate(this.elapsed, speed, greeting);
    if (greeting) {
      this.greeting += dt;
      if (this.greeting >= 0.9) gameStore.greetTulin();
    }
  }
}
