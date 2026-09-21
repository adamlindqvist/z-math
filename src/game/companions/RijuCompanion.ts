import * as THREE from "three";
import type { Area } from "../Area";
import { Riju } from "../entities/Riju";
import { CompanionTrail } from "./CompanionTrail";
import { hasRiju } from "./definitions";
import { gameStore } from "../../store/gameStore";
import { DESERT_TEMPLE as NATURE_TEMPLE } from "../desert/layout";

export class RijuCompanion {
  readonly model = new Riju();
  readonly root = this.model.root;
  private following = new CompanionTrail(this.root, 4.6, 1, 1.8);
  private mounted = false;
  private waiting = false;
  private elapsed = 0;
  private greeting = 0;
  reset(position: THREE.Vector3, area: Area) {
    this.following.reset(position, area);
    this.greeting = 0;
    this.mounted = true;
    const state = gameStore.getState();
    const unlocked = hasRiju(state.dungeons);
    this.waiting = !unlocked && state.location?.world === "desert";
    this.root.visible = unlocked || this.waiting;
    if (this.waiting) {
      this.root.position.set(NATURE_TEMPLE.x - 2, 0, NATURE_TEMPLE.z + 1.8);
      this.root.rotation.y = 0;
    }
    this.model.animate(this.elapsed, 0, false, 0, false, this.waiting);
  }
  update(dt: number, position: THREE.Vector3, area: Area, falling = false) {
    const state = gameStore.getState();
    const unlocked = hasRiju(state.dungeons);
    const waiting = !unlocked && state.location?.world === "desert";
    if (!this.mounted || waiting !== this.waiting || (unlocked && !this.root.visible && !falling)) this.reset(position, area);
    if (this.waiting) {
      this.root.visible = !falling;
      if (!falling && !state.overlay && !state.motion) {
        this.elapsed += dt;
        this.model.animate(this.elapsed, 0, false, dt, false, true);
      }
      return;
    }
    this.root.visible = unlocked && !falling;
    if (!unlocked || falling || state.overlay || state.motion) return;
    this.elapsed += dt;
    const speed = this.following.update(dt, position, area, state.riding ? 7 : 4);
    const greeting = !state.riju.greeted && !state.riding && !state.encounter && !state.yunoboHelping;
    this.model.animate(this.elapsed, speed, greeting, dt);
    if (greeting) {
      this.greeting += dt;
      if (this.greeting >= 0.9) gameStore.greetRiju();
    }
  }
}
