import * as THREE from "three";
import type { Area } from "../Area";

/** Shared continuous footsteps for ground and low-flying companions. */
export class CompanionTrail {
  private trail: THREE.Vector3[] = [];
  private lastSample = new THREE.Vector3();
  private speed = 0;
  private blockedTime = 0;
  constructor(private root: THREE.Group, private followDistance = 1.3, private side = -1, private spawnDistance = 0.7) {}
  restart(position: THREE.Vector3) {
    this.trail = [position.clone()];
    this.lastSample.copy(position);
    this.speed = this.blockedTime = 0;
  }
  reset(position: THREE.Vector3, area: Area) {
    this.restart(position);
    this.root.position.copy(position);
    for (const [dx, dz] of [[this.side * 0.9, this.spawnDistance], [-this.side * 0.9, this.spawnDistance], [0, 1], [0, -1]]) {
      if (area.collision.free(position.x + dx, position.z + dz, 0.3)) {
        this.root.position.set(position.x + dx, 0, position.z + dz);
        break;
      }
    }
  }
  update(dt: number, position: THREE.Vector3, area: Area, maxSpeed: number): number {
    if (this.lastSample.distanceTo(position) >= 0.1) {
      this.trail.push(position.clone());
      this.lastSample.copy(position);
    }
    if (this.trail.length > 100) this.trail.shift();
    const distance = this.root.position.distanceTo(position);
    if (distance > 7) {
      this.reset(position, area);
      return 0;
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
    const excess = Math.max(0, remaining - this.followDistance);
    const desiredSpeed = Math.min(maxSpeed, excess * 3);
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
    return dt > 0 ? travelled / dt : 0;
  }
}
