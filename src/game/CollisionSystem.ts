export interface Obstacle {
  x: number;
  z: number;
  halfX: number;
  halfZ: number;
}
interface EllipseObstacle {
  x: number;
  z: number;
  radiusX: number;
  radiusZ: number;
}
export class CollisionSystem {
  obstacles: Obstacle[] = [];
  dynamic: Obstacle[] = [];
  ellipses: EllipseObstacle[] = [];
  constructor(
    private halfWidth = 11.1,
    private halfDepth = 8.1,
    private centerZ = 0,
  ) {}
  add(x: number, z: number, halfX: number, halfZ = halfX) {
    this.obstacles.push({ x, z, halfX, halfZ });
  }
  addEllipse(x: number, z: number, radiusX: number, radiusZ: number) {
    this.ellipses.push({ x, z, radiusX, radiusZ });
  }
  free(x: number, z: number, radius = 0.32) {
    if (
      Math.abs(x) > this.halfWidth - radius ||
      Math.abs(z - this.centerZ) > this.halfDepth - radius
    )
      return false;
    const hitsBox = [...this.obstacles, ...this.dynamic].some((o) => {
      const dx = Math.max(Math.abs(x - o.x) - o.halfX, 0);
      const dz = Math.max(Math.abs(z - o.z) - o.halfZ, 0);
      return dx * dx + dz * dz < radius * radius;
    });
    if (hitsBox) return false;

    return !this.ellipses.some((o) => {
      // Expanding both ellipse radii by the player's radius closely models a
      // round character touching the curved shore.
      const dx = (x - o.x) / (o.radiusX + radius);
      const dz = (z - o.z) / (o.radiusZ + radius);
      return dx * dx + dz * dz < 1;
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
  moveWithinBounds(
    position: { x: number; z: number },
    dx: number,
    dz: number,
    radius = 0.32,
  ) {
    position.x = Math.max(
      -this.halfWidth + radius,
      Math.min(this.halfWidth - radius, position.x + dx),
    );
    position.z = Math.max(
      this.centerZ - this.halfDepth + radius,
      Math.min(this.centerZ + this.halfDepth - radius, position.z + dz),
    );
  }
}
