import { expect, it } from "vitest";
import { Color, DirectionalLight, HemisphereLight, Scene } from "three";
import { applyAreaEnvironment, CAVE_ENVIRONMENT, DEFAULT_ENVIRONMENT } from "../src/game/environment";
import { VolcanoInteriorArea } from "../src/game/VolcanoInteriorArea";
import { World } from "../src/game/World";
import { VolcanoArea } from "../src/game/VolcanoArea";
import type { Area } from "../src/game/Area";

it("applies the cave lighting and restores every default on exit and repeated area changes", () => {
  const scene = new Scene(), sun = new DirectionalLight(), ambient = new HemisphereLight();
  const cave = new VolcanoInteriorArea(), world = new World(), volcano = new VolcanoArea();
  try {
    const sequence: Area[] = [cave, volcano, cave, world];
    for (const area of sequence) {
      applyAreaEnvironment(scene, sun, ambient, area.environment);
      const expected = area === cave ? CAVE_ENVIRONMENT : DEFAULT_ENVIRONMENT;
      expect(scene.background).toEqual(expected.background ? new Color(expected.background) : null);
      expect(sun.color).toEqual(new Color(expected.sun));
      expect(sun.intensity).toBe(expected.sunIntensity);
      expect(ambient.color).toEqual(new Color(expected.sky));
      expect(ambient.groundColor).toEqual(new Color(expected.ground));
      expect(ambient.intensity).toBe(expected.ambientIntensity);
    }
    expect(scene.children).toHaveLength(0); // Profiles reuse lights, never allocate new ones.
  } finally { cave.dispose(); world.dispose(); volcano.dispose(); }
});
