import { describe, expect, it } from "vitest";
import { Mesh, Vector3, type Material } from "three";
import { Bokoblin } from "../src/game/entities/Bokoblin";

function materials(bokoblin: Bokoblin) {
  const result = new Set<Material>();
  bokoblin.root.traverse((object) => {
    if (object instanceof Mesh)
      (Array.isArray(object.material)
        ? object.material
        : [object.material]
      ).forEach((mat) => result.add(mat));
  });
  return [...result];
}

describe("Bokoblin flight", () => {
  it("alternates leg steps, freezes them in dialogs and plants both feet when guarding", () => {
    const bokoblin = new Bokoblin(false);
    const origin = bokoblin.root.position.clone();
    const left = bokoblin.root.getObjectByName("left-leg")!;
    const right = bokoblin.root.getObjectByName("right-leg")!;
    const far = origin.clone().add(new Vector3(0, 0, -10));
    bokoblin.update(0.2, false, false, far);
    const firstStep = left.rotation.x;
    expect(Math.abs(firstStep)).toBeGreaterThan(0.1);
    expect(right.rotation.x).toBe(-firstStep);
    bokoblin.update(0.5, false, false, far);
    expect(left.rotation.x * firstStep).toBeLessThan(0);
    expect(right.rotation.x).toBe(-left.rotation.x);
    const pausedStep = left.rotation.x;
    bokoblin.update(1, false, true, far);
    expect(left.rotation.x).toBe(pausedStep);
    expect(right.rotation.x).toBe(-pausedStep);
    const near = origin.clone().add(new Vector3(0, 0, -4));
    bokoblin.update(0.02, false, false, near);
    expect(left.rotation.x).not.toBe(pausedStep);
    expect(right.rotation.x).toBe(-left.rotation.x);
    bokoblin.update(0.5, false, false, near);
    bokoblin.update(0.1, false, false, near);
    expect(left.rotation.x).toBe(0);
    expect(Math.abs(right.rotation.x)).toBe(0);
    expect(bokoblin.root.position).toEqual(origin);
  });

  it("patrols both sides and runs home when the player approaches the bridge", () => {
    const bokoblin = new Bokoblin(false);
    const origin = bokoblin.root.position.clone();
    const far = origin.clone().add(new Vector3(0, 0, -10));
    const positions: number[] = [];
    for (let i = 0; i < 100; i++) {
      bokoblin.update(0.1, false, false, far);
      positions.push(bokoblin.root.position.x);
      expect(bokoblin.root.position.z).toBe(origin.z);
      expect(Math.abs(bokoblin.root.position.x)).toBeLessThanOrEqual(1.1);
    }
    expect(Math.min(...positions)).toBeLessThan(-1);
    expect(Math.max(...positions)).toBeGreaterThan(1);
    for (let i = 0; i < 40 && Math.abs(bokoblin.root.position.x) < 0.8; i++)
      bokoblin.update(0.1, false, false, far);
    const away = Math.abs(bokoblin.root.position.x);
    expect(away).toBeGreaterThan(0.5);
    const near = origin.clone().add(new Vector3(0, 0, -5));
    bokoblin.update(0.1, false, false, near);
    expect(away - Math.abs(bokoblin.root.position.x)).toBeCloseTo(0.42);
    bokoblin.update(0.3, false, false, near);
    expect(bokoblin.root.position.x).toBe(0);
    bokoblin.update(1, false, false, near);
    expect(bokoblin.root.position).toEqual(origin);
    // Remain on guard near the detection boundary, then resume when far away.
    bokoblin.update(1, false, false, origin.clone().add(new Vector3(0, 0, -6)));
    expect(bokoblin.root.position).toEqual(origin);
    bokoblin.update(1, false, false, far);
    expect(Math.abs(bokoblin.root.position.x)).toBeGreaterThan(0.5);
  });

  it("freezes patrol during dialogs and guards approaches from the other bank", () => {
    const bokoblin = new Bokoblin(false);
    const origin = bokoblin.root.position.clone();
    bokoblin.update(
      1,
      false,
      false,
      origin.clone().add(new Vector3(0, 0, -10)),
    );
    const position = bokoblin.root.position.clone();
    const rotation = bokoblin.root.rotation.clone();
    const near = origin.clone().add(new Vector3(0, 0, 4));
    bokoblin.update(10, false, true, near);
    expect(bokoblin.root.position).toEqual(position);
    expect(bokoblin.root.rotation.toArray()).toEqual(rotation.toArray());
    bokoblin.update(0.5, false, false, near);
    bokoblin.update(0.1, false, false, near);
    expect(bokoblin.root.position).toEqual(origin);
  });

  it("smoothly faces the player while staying at the bridge", () => {
    const bokoblin = new Bokoblin(false);
    const origin = bokoblin.root.position.clone();
    const player = origin.clone().add(new Vector3(3, 4, 0));
    bokoblin.update(0.1, false, false, player);
    expect(bokoblin.root.rotation.y).toBeLessThan(0);
    expect(bokoblin.root.rotation.y).toBeGreaterThan(-Math.PI / 2);
    for (let i = 0; i < 100; i++) bokoblin.update(0.1, false, false, player);
    const facing = new Vector3(0, 0, -1).applyQuaternion(
      bokoblin.root.quaternion,
    );
    expect(facing.x).toBeCloseTo(1);
    expect(facing.y).toBe(0);
    expect(bokoblin.root.position).toEqual(origin);
  });

  it("takes the short turn behind itself and pauses tracking during dialogs", () => {
    const bokoblin = new Bokoblin(false);
    const origin = bokoblin.root.position.clone();
    bokoblin.update(
      10,
      false,
      false,
      origin.clone().add(new Vector3(0.1, 0, 3)),
    );
    const before = bokoblin.root.rotation.y;
    const player = origin.clone().add(new Vector3(-0.1, 0, 3));
    bokoblin.update(0.1, false, false, player);
    expect(Math.abs(bokoblin.root.rotation.y - before)).toBeLessThan(0.1);
    const turned = bokoblin.root.rotation.y;
    bokoblin.update(10, false, true, origin.clone().add(new Vector3(3, 0, 0)));
    expect(bokoblin.root.rotation.y).toBe(turned);
    bokoblin.update(1, false, false, origin);
    expect(bokoblin.root.rotation.y).toBe(turned);
    bokoblin.update(0.1, true, false, player);
    expect(bokoblin.root.rotation.y).toBe(-Math.PI / 2);
  });

  it("fades during the original short flight without shrinking", () => {
    const bokoblin = new Bokoblin(false);
    expect(materials(bokoblin).every((mat) => mat.opacity === 1)).toBe(true);
    bokoblin.update(0.45, true, false);
    expect(bokoblin.root.position.x).toBeCloseTo(1.9);
    expect(bokoblin.root.visible).toBe(true);
    expect(bokoblin.root.scale.toArray()).toEqual([1, 1, 1]);
    for (const mat of materials(bokoblin)) {
      expect(mat.opacity).toBeCloseTo(0.5);
      expect(mat.transparent).toBe(true);
    }
    bokoblin.update(0.45, true, false);
    expect(bokoblin.root.position.x).toBeCloseTo(3.8);
    expect(bokoblin.root.scale.toArray()).toEqual([1, 1, 1]);
    expect(materials(bokoblin).every((mat) => mat.opacity === 0)).toBe(true);
    expect(bokoblin.root.visible).toBe(false);
  });

  it("pauses the flight and fade and restores the guard on reset", () => {
    const bokoblin = new Bokoblin(false);
    for (const dt of [0.2, 0.4]) {
      bokoblin.update(dt, true, false);
      const position = bokoblin.root.position.clone();
      const opacity = materials(bokoblin)[0].opacity;
      bokoblin.update(10, true, true);
      expect(bokoblin.root.position).toEqual(position);
      expect(materials(bokoblin)[0].opacity).toBe(opacity);
      expect(bokoblin.root.visible).toBe(true);
    }
    bokoblin.update(0, false, true);
    expect(bokoblin.root.visible).toBe(true);
    expect(bokoblin.root.position.toArray()).toEqual([0, 0, 9.875]);
    expect(bokoblin.root.rotation.y).toBe(0);
    expect(materials(bokoblin).every((mat) => mat.opacity === 1)).toBe(true);
  });

  it("keeps the guard hidden when loading an unlocked bridge", () => {
    const bokoblin = new Bokoblin(true);
    bokoblin.update(1, true, false);
    expect(bokoblin.root.visible).toBe(false);
  });
});
