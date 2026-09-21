import { afterEach, expect, it } from "vitest";
import { Scene, Vector3 } from "three";
import { gameStore } from "../src/store/gameStore";
import { InteractionSystem } from "../src/game/InteractionSystem";
import { UnderworldArea } from "../src/game/UnderworldArea";

it("blocks the approach to Ganondorf until the army is defeated and keeps the exit reachable", () => {
  const area = new UnderworldArea();
  try {
    const boss = area.root.getObjectByName("ganondorf")!;
    expect(boss).toBeDefined();
    expect(boss.position.z).toBeLessThan(-20);
    const player = { ...area.spawn };
    area.collision.move(
      player,
      boss.position.x - player.x,
      boss.position.z + 1.6 - player.z,
    );
    expect(player.x).toBeCloseTo(boss.position.x);
    expect(player.z).toBeGreaterThan(-17);
    expect(area.collision.free(boss.position.x, boss.position.z)).toBe(false);
    expect(area.collision.free(boss.position.x + 1.3, boss.position.z)).toBe(false);
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      expect(
        area.collision.free(
          boss.position.x + Math.cos(angle) * 1.7,
          boss.position.z + Math.sin(angle) * 1.7,
        ),
      ).toBe(true);
    }
    area.update(1, 1);
    expect(area.interactions()).toHaveLength(4);
    expect(area.rupees).toEqual([]);
    const exit = area.interactions()[0];
    area.collision.move(player, exit.x - player.x, exit.z - player.z);
    expect(player.x).toBeCloseTo(exit.x);
    expect(player.z).toBeCloseTo(exit.z);
    expect(exit.target).toEqual({ kind: "underworldLadder", label: "Klättra upp" });
    expect(area.passages()).toEqual([]);
  } finally {
    area.dispose();
  }
});


afterEach(() => { gameStore.debugEndSession(); gameStore.reset(); });

it("requires an explicit climb action at the ladder and hides it when out of reach", () => {
  gameStore.openDebug();
  gameStore.debugTravelTo({ world: "underworld" });
  gameStore.close();
  const area = new UnderworldArea();
  const scene = new Scene();
  const interactions = new InteractionSystem(scene);
  try {
    const exit = area.interactions()[0];
    const foot = new Vector3(exit.x, 0, exit.z);
    interactions.update(foot, area, 0);
    expect(gameStore.getState().location).toEqual({ world: "underworld" });
    expect(gameStore.getState().target).toEqual(exit.target);
    interactions.update(new Vector3(exit.x + 3, 0, exit.z), area, 1);
    expect(gameStore.getState().target).toBeNull();
    gameStore.interact();
    expect(gameStore.getState().location).toEqual({ world: "underworld" });
    interactions.update(foot, area, 2);
    gameStore.openDebug();
    gameStore.interact();
    expect(gameStore.getState().location).toEqual({ world: "underworld" });
    gameStore.close();
    interactions.update(foot, area, 3);
    gameStore.interact();
    expect(gameStore.getState().location).toEqual({ world: "desert" });
    expect(gameStore.getState().target).toBeNull();
    gameStore.setTarget(exit.target);
    gameStore.interact();
    expect(gameStore.getState().location).toEqual({ world: "desert" });
  } finally {
    area.dispose();
    for (const marker of [interactions.ring, interactions.arrow]) {
      marker.geometry.dispose();
      (marker.material as import("three").Material).dispose();
    }
  }
});
