export interface Obstacle {
  x: number;
  z: number;
  halfX: number;
  halfZ: number;
}
export class CollisionSystem {
  obstacles: Obstacle[] = [];
  add(x: number, z: number, halfX: number, halfZ = halfX) {
    this.obstacles.push({ x, z, halfX, halfZ });
  }
  free(x: number, z: number, radius = 0.32) {
    if (Math.abs(x) > 11.1 - radius || Math.abs(z) > 8.1 - radius) return false;
    return !this.obstacles.some((o) => {
      const dx = Math.max(Math.abs(x - o.x) - o.halfX, 0);
      const dz = Math.max(Math.abs(z - o.z) - o.halfZ, 0);
      return dx * dx + dz * dz < radius * radius;
    });
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
