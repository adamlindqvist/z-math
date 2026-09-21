import * as THREE from "three";
import type { Area } from "../Area";
import { Sidon } from "../entities/Sidon";
import { CompanionTrail } from "./CompanionTrail";
import { hasSidon } from "./definitions";
import { gameStore } from "../../store/gameStore";
import { NATURE_TEMPLE, NATURE_EXIT } from "../nature/layout";

export class SidonCompanion {
  readonly model = new Sidon();
  readonly root = this.model.root;
  private following = new CompanionTrail(this.root, 3.5, -1, 1.8);
  private mounted = false;
  private waiting = false;
  private gateOpened = gameStore.getState().sidon.gateOpened;
  private helpTime: number | null = null;
  private helpStart = new THREE.Vector3();
  private water = new THREE.Group();
  private waterMaterial = new THREE.MeshBasicMaterial({ color: "#99f6ed", transparent: true, opacity: 0.65, depthWrite: false });
  private elapsed = 0;
  private greeting = 0;
  constructor() {
    this.water.name = "sidon-gate-water";
    this.root.add(this.water);
    for (let i = 0; i < 3; i++) {
      this.water.add(new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.025, 4, 24), this.waterMaterial));
    }
    this.water.visible = false;
  }
  reset(position: THREE.Vector3, area: Area) {
    this.following.reset(position, area);
    this.greeting = 0;
    this.mounted = true;
    const state = gameStore.getState();
    const unlocked = hasSidon(state.dungeons);
    this.waiting = !unlocked && state.location?.world === "water";
    this.gateOpened = state.sidon.gateOpened;
    this.helpTime = null;
    this.water.visible = false;
    this.root.visible = unlocked || this.waiting;
    if (this.waiting) {
      this.root.position.set(NATURE_TEMPLE.x - 2, 0, NATURE_TEMPLE.z + 1.8);
      this.root.rotation.y = 0;
    }
    this.model.animate(this.elapsed, 0, false, 0, false, this.waiting);
  }
  update(dt: number, position: THREE.Vector3, area: Area, falling = false) {
    const state = gameStore.getState();
    const unlocked = hasSidon(state.dungeons);
    const waiting = !unlocked && state.location?.world === "water";
    if (!this.mounted || waiting !== this.waiting || (unlocked && !this.root.visible && !falling)) this.reset(position, area);
    if (this.waiting) {
      this.root.visible = !falling;
      if (!falling && !state.overlay && !state.motion) {
        this.elapsed += dt;
        this.model.animate(this.elapsed, 0, false, dt, false, true);
      }
      return;
    }
    if (!this.gateOpened && state.sidon.gateOpened && state.location?.world === "water") {
      this.helpTime = 0;
      this.helpStart.copy(this.root.position);
    }
    this.gateOpened = state.sidon.gateOpened;
    this.root.visible = unlocked && !falling;
    if (!unlocked || falling || state.overlay || state.motion) return;
    this.elapsed += dt;
    if (this.helpTime !== null) {
      this.helpTime = Math.min(2.2, this.helpTime + dt);
      const t = this.helpTime / 2.2;
      this.root.position.lerpVectors(this.helpStart, new THREE.Vector3(NATURE_EXIT.x - 0.9, 0, NATURE_EXIT.z + 1.4), Math.min(1, this.helpTime / 0.45));
      this.root.rotation.y = Math.atan2(0.9, -1.4);
      this.model.animate(this.elapsed, 0, false, dt, true);
      this.water.visible = true;
      this.waterMaterial.opacity = Math.min(1, (1 - t) * 5) * 0.65;
      this.water.children.forEach((ring, i) => {
        const pulse = (t * 2 + i / 3) % 1;
        ring.position.set(0, 1.4, 0.4 + pulse * 2);
        ring.scale.setScalar(0.6 + pulse * 2);
      });
      if (t >= 1) {
        this.helpTime = null;
        this.water.visible = false;
        this.following.restart(position);
      }
      return;
    }
    const speed = this.following.update(dt, position, area, state.riding ? 7 : 4);
    const greeting = !state.sidon.greeted && !state.riding && !state.encounter && !state.yunoboHelping;
    this.model.animate(this.elapsed, speed, greeting, dt);
    if (greeting) {
      this.greeting += dt;
      if (this.greeting >= 0.9) gameStore.greetSidon();
    }
  }
}
