import { describe, expect, it } from "vitest";
import { Vector3 } from "three";
import { GameCamera } from "../src/game/Camera";

describe("camera in the expanded glades", () => {
  for (const [width, height] of [
    [1180, 820],
    [820, 1180],
  ]) {
    it(`keeps a walking player inside the view at both edges at ${width}x${height}`, () => {
      const camera = new GameCamera();
      camera.resize(width, height);
      for (const z of [-8, 3, 25, 32]) {
        const player = new Vector3(0, 0, z);
        camera.setMode("glade", player);
        for (const destination of [13.5, -13.5]) {
          while (Math.abs(player.x - destination) > 0.01) {
            player.x +=
              Math.sign(destination - player.x) *
              Math.min(3.4 / 60, Math.abs(destination - player.x));
            camera.update(player, 1 / 60);
            camera.camera.updateMatrixWorld();
            for (const y of [0, 1.8]) {
              const projected = new Vector3(player.x, y, z).project(
                camera.camera,
              );
              expect(Math.abs(projected.x)).toBeLessThan(0.8);
              expect(Math.abs(projected.y)).toBeLessThan(0.8);
            }
          }
        }
      }
    });
  }
});
