import type { CollisionSystem } from "../CollisionSystem";
import { PLAYER_WALK_SPEED } from "../Player";
export type Point = { x: number; z: number };
const RABBIT_FOLLOW_SPEED = PLAYER_WALK_SPEED * 0.9;
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z);
export function clearRabbitPath(collision: CollisionSystem, from: Point, to: Point) {
  const steps = Math.max(1, Math.ceil(distance(from, to) / 0.08));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    if (!collision.free(from.x + (to.x - from.x) * t, from.z + (to.z - from.z) * t, 0.25)) return false;
  }
  return true;
}
// Only used on joining a trail or when a moving obstacle interrupts it.
export function rabbitRoute(collision: CollisionSystem, from: Point, to: Point): Point[] {
  if (clearRabbitPath(collision, from, to)) return [{ ...to }];
  const step = 0.4;
  const queue = [{ ...from, parent: -1 }];
  const seen = new Set(["0,0"]);
  for (let i = 0; i < queue.length && i < 14000; i++) {
    const current = queue[i];
    if (distance(current, to) < 0.65 && clearRabbitPath(collision, current, to)) {
      const route: Point[] = [{ ...to }];
      for (let j = i; j > 0; j = queue[j].parent) route.push({ x: queue[j].x, z: queue[j].z });
      return route.reverse();
    }
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = { x: current.x + dx * step, z: current.z + dz * step, parent: i };
      const key = `${Math.round((next.x - from.x) / step)},${Math.round((next.z - from.z) / step)}`;
      if (!seen.has(key) && clearRabbitPath(collision, current, next)) {
        seen.add(key); queue.push(next);
      }
    }
  }
  return [];
}
export class RabbitFollower {
  private trail: Point[] = [];
  private last: Point | null = null;
  private retry = 0;
  reset() { this.trail = []; this.last = null; this.retry = 0; }
  update(position: Point, player: Point, dt: number, collision: CollisionSystem, gap: number) {
    this.retry = Math.max(0, this.retry - dt);
    if (!this.last) {
      this.trail = rabbitRoute(collision, position, player);
      this.last = { ...player };
    } else if (distance(this.last, player) > 0.12) {
      this.trail.push({ ...player }); this.last = { ...player };
    }
    if (!this.trail.length && distance(position, player) > gap + 0.15 && !this.retry) {
      this.trail = rabbitRoute(collision, position, player); this.retry = 1;
    }
    // Bounded memory, including long debug walks. Reconnect without teleporting.
    if (this.trail.length > 1800) this.trail = rabbitRoute(collision, position, player);
    let length = 0, previous = position;
    for (const point of this.trail) { length += distance(previous, point); previous = point; }
    let budget = Math.min(RABBIT_FOLLOW_SPEED * dt, Math.max(0, length - gap));
    let moved = false;
    while (budget > 0 && this.trail.length) {
      const next = this.trail[0], d = distance(position, next);
      const amount = Math.min(budget, d);
      const destination = d < 0.001 ? next : {
        x: position.x + (next.x - position.x) * amount / d,
        z: position.z + (next.z - position.z) * amount / d,
      };
      if (!clearRabbitPath(collision, position, destination)) {
        if (!this.retry) {
          this.trail = rabbitRoute(collision, position, player);
          this.last = { ...player }; this.retry = 1;
        }
        break;
      }
      position.x = destination.x; position.z = destination.z;
      moved ||= amount > 0;
      budget -= amount;
      if (d <= amount + 0.001) this.trail.shift();
    }
    return moved;
  }
}
