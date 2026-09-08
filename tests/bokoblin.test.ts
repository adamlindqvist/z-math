import { describe, expect, it } from "vitest";
import { Mesh, type Material } from "three";
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
    expect(
      materials(bokoblin).every((mat) => mat.opacity === 1),
    ).toBe(true);
  });

  it("keeps the guard hidden when loading an unlocked bridge", () => {
    const bokoblin = new Bokoblin(true);
    bokoblin.update(1, true, false);
    expect(bokoblin.root.visible).toBe(false);
  });
});
