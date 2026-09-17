import * as THREE from "three";
import { Yunobo } from "../entities/Yunobo";
import type { Area } from "../Area";
import { gameStore } from "../../store/gameStore";
import { hasYunobo, YUNOBO_ROCK } from "./definitions";

/** Follow the player's recorded footsteps, never push or interact with the world. */
export class YunoboCompanion {
  readonly model = new Yunobo();
  readonly root = this.model.root;
  private trail: THREE.Vector3[] = [];
  private elapsed = 0;
  private greeting = 0;
  private helpTime = 0;
  private helpStart = new THREE.Vector3();
  private mounted = false;
  private lastSample = new THREE.Vector3();
  private speed = 0;
  private blockedTime = 0;
  reset(position: THREE.Vector3, area: Area) {
    this.trail = [position.clone()];
    this.lastSample.copy(position);
    this.speed = this.blockedTime = 0;
    this.root.position.copy(position);
    // Prefer a free spot beside the hero; narrow doorways can use the hero's spot.
    for (const [dx, dz] of [[-0.9, 0.7], [0.9, 0.7], [0, 1], [0, -1]]) {
      if (area.collision.free(position.x + dx, position.z + dz, 0.3)) {
        this.root.position.set(position.x + dx, 0, position.z + dz);
        break;
      }
    }
    this.helpTime = this.greeting = 0;
    this.mounted = true;
    this.root.visible = hasYunobo(gameStore.getState().dungeons);
    this.model.animate(this.elapsed, 0, false);
  }
  update(dt: number, position: THREE.Vector3, area: Area, falling = false) {
    const state = gameStore.getState();
    const unlocked = hasYunobo(state.dungeons);
    if (!this.mounted || (unlocked && !this.root.visible && !falling)) this.reset(position, area);
    this.root.visible = unlocked && !falling;
    if (!unlocked || falling || state.overlay || state.motion) return;
    this.elapsed += dt;
    if (!state.yunobo.greeted && !state.riding) {
      this.greeting += dt;
      this.root.rotation.y = Math.atan2(position.x - this.root.position.x, position.z - this.root.position.z);
      this.model.animate(this.elapsed, 0, true, 0, dt);
      if (this.greeting >= 0.9) gameStore.greetYunobo();
      return;
    }
    if (state.yunoboHelping) {
      if (this.helpTime === 0) this.helpStart.copy(this.root.position);
      this.helpTime = Math.min(1.1, this.helpTime + dt);
      const t = this.helpTime / 1.1;
      this.root.position.lerpVectors(this.helpStart, new THREE.Vector3(YUNOBO_ROCK.x, 0, YUNOBO_ROCK.z + 0.7), t);
      this.root.rotation.y = Math.atan2(YUNOBO_ROCK.x - this.helpStart.x, YUNOBO_ROCK.z - this.helpStart.z);
      this.model.animate(this.elapsed, 0, false, t, dt);
      if (t >= 1) {
        gameStore.finishYunoboHelp();
        this.trail = [position.clone()];
        this.lastSample.copy(position);
        this.speed = 0;
      }
      return;
    }
    this.helpTime = 0;
    if (this.lastSample.distanceTo(position) >= 0.1) {
      this.trail.push(position.clone());
      this.lastSample.copy(position);
    }
    if (this.trail.length > 100) this.trail.shift();
    const distance = this.root.position.distanceTo(position);
    if (distance > 7) {
      this.reset(position, area);
      return;
    }
    // Measure the entire remaining route, including the moving endpoint. This
    // avoids switching between full speed and a stop at every sampled footstep.
    let remaining = 0;
    let previous = this.root.position;
    for (const point of this.trail) {
      remaining += previous.distanceTo(point);
      previous = point;
    }
    remaining += previous.distanceTo(position);
    const excess = Math.max(0, remaining - 1.3);
    const desiredSpeed = Math.min(state.riding ? 7 : 4, excess * 3);
    this.speed = THREE.MathUtils.damp(this.speed, desiredSpeed, 8, dt);
    let budget = Math.min(excess, this.speed * dt);
    let travelled = 0;
    let heading: number | null = null;
    // Spend the whole frame's movement budget, even when crossing waypoints.
    while (budget > 0.00001) {
      const target = this.trail[0] ?? position;
      const dx = target.x - this.root.position.x, dz = target.z - this.root.position.z;
      const length = Math.hypot(dx, dz);
      if (length < 0.0001) {
        if (this.trail.length) { this.trail.shift(); continue; }
        break;
      }
      const step = Math.min(length, budget);
      const x = this.root.position.x, z = this.root.position.z;
      area.collision.move(this.root.position, dx / length * step, dz / length * step, 0.22);
      const moved = Math.hypot(this.root.position.x - x, this.root.position.z - z);
      travelled += moved;
      budget -= step;
      if (moved > 0.00001) heading = Math.atan2(this.root.position.x - x, this.root.position.z - z);
      if (moved < step * 0.5) break;
    }
    if (heading !== null) {
      const angle = Math.atan2(Math.sin(heading - this.root.rotation.y), Math.cos(heading - this.root.rotation.y));
      this.root.rotation.y += angle * (1 - Math.exp(-10 * dt));
    }
    this.blockedTime = travelled < 0.001 && excess > 1 ? this.blockedTime + dt : 0;
    if (this.blockedTime > 0.7 && distance > 2.5) this.reset(position, area);
    this.model.animate(this.elapsed, dt > 0 ? travelled / dt : 0, false, 0, dt);
  }
}
