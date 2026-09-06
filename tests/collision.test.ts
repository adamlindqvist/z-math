import { describe, it, expect } from "vitest";
import { CollisionSystem } from "../src/game/CollisionSystem";
describe("collisions", () => {
  it("prevents tunnelling through a wall", () => {
    const c = new CollisionSystem();
    c.add(1, 0, 0.1, 2);
    const p = { x: 0, z: 0 };
    c.move(p, 4, 0);
    expect(p.x).toBeLessThan(0.6);
  });
  it("slides along an obstacle", () => {
    const c = new CollisionSystem();
    c.add(1, 0, 0.2, 2);
    const p = { x: 0.45, z: 0 };
    c.move(p, 0.5, 1);
    expect(p.x).toBeLessThan(0.5);
    expect(p.z).toBeCloseTo(1);
  });
  it("keeps the player inside world bounds", () => {
    const c = new CollisionSystem();
    const p = { x: 10, z: 7 };
    c.move(p, 3, 3);
    expect(p.x).toBeLessThanOrEqual(10.78);
    expect(p.z).toBeLessThanOrEqual(7.78);
  });
});
