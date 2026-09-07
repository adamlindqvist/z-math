export interface Obstacle {
  x: number;
  z: number;
  halfX: number;
  halfZ: number;
}
export class CollisionSystem {
  obstacles: Obstacle[] = [];
  dynamic: Obstacle[] = [];
  constructor(
    private halfWidth = 11.1,
    private halfDepth = 8.1,
  ) {}
  add(x: number, z: number, halfX: number, halfZ = halfX) {
    this.obstacles.push({ x, z, halfX, halfZ });
  }
  free(x: number, z: number, radius = 0.32) {
    if (
      Math.abs(x) > this.halfWidth - radius ||
      Math.abs(z) > this.halfDepth - radius
    )
      return false;
    return ![...this.obstacles, ...this.dynamic].some((o) => {
      const dx = Math.max(Math.abs(x - o.x) - o.halfX, 0);
      const dz = Math.max(Math.abs(z - o.z) - o.halfZ, 0);
      return dx * dx + dz * dz < radius * radius;
    });
  }
  visible(from: { x: number; z: number }, to: { x: number; z: number }) {
    const distance = Math.hypot(to.x - from.x, to.z - from.z);
    for (let t = 0.15; t < distance - 0.8; t += 0.15) {
      if (
        !this.free(
          from.x + ((to.x - from.x) * t) / distance,
          from.z + ((to.z - from.z) * t) / distance,
          0.03,
        )
      )
        return false;
    }
    return true;
  }
  move(position: { x: number; z: number }, dx: number, dz: number) {
    // Small steps prevent tunnelling and allow sliding along solid edges.
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.15));
    for (let i = 0; i < steps; i++) {
      if (this.free(position.x + dx / steps, position.z))
        position.x += dx / steps;
      if (this.free(position.x, position.z + dz / steps))
        position.z += dz / steps;
    }
  }
}
