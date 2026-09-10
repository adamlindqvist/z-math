import { disposeTree } from "../src/game/Area";
import { afterEach, describe, expect, it } from "vitest";
import { Scene, Vector3 } from "three";
import { createGameStore, gameStore, parseSave } from "../src/store/gameStore";
import { DUNGEONS, volcanoUnlocked } from "../src/game/dungeons/definitions";
import { World } from "../src/game/World";
import {
  VolcanoArea,
  VOLCANO_CLEARINGS,
  VOLCANO_LAVA,
} from "../src/game/VolcanoArea";
import {
  portalSpawn,
  VOLCANO_ENTRANCE,
  VOLCANO_RETURN,
} from "../src/game/volcanoPortal";
import { gladePosition } from "../src/game/gladeLayout";
import { InteractionSystem } from "../src/game/InteractionSystem";
import type { CollisionSystem } from "../src/game/CollisionSystem";

type Store = ReturnType<typeof createGameStore>;
function quiz(s: Store, id: string) {
  s.setTarget({ kind: "challenge", id, label: "Räkna" });
  s.interact();
  while (s.getState().question) {
    s.answer(s.getState().question!.correctAnswer);
    s.finishQuiz();
  }
}
function completeFire(s: Store) {
  s.grantItems(["temple-sword", "temple-shield"]);
  s.setTarget("bokoblin");
  s.interact();
  s.travelTo({ dungeon: "fire", room: "light" });
  quiz(s, "fire-light-lock");
  s.travelTo({ dungeon: "fire", room: "stones" });
  DUNGEONS.find((d) => d.id === "fire")!.rooms[1].stones!.forEach(
    (stone, i) => {
      while (s.getState().dungeons.fire.stones.stones[i] < stone.goal) {
        s.pushStone(i, 1);
        s.finishMotion();
      }
    },
  );
  s.travelTo({ dungeon: "fire", room: "treasure" });
  quiz(s, "fire-treasure-lock");
}
function memory() {
  let raw = "";
  return {
    getItem: () => raw,
    setItem: (_k: string, v: string) => {
      raw = v;
    },
  };
}
function reachable(
  collision: CollisionSystem,
  start: { x: number; z: number },
  goals: { x: number; z: number }[],
) {
  const queue = [[Math.round(start.x * 5), Math.round(start.z * 5)]];
  const seen = new Set([queue[0].join(",")]);
  for (let i = 0; i < queue.length; i++) {
    const [x, z] = queue[i];
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx,
        nz = z + dz,
        key = `${nx},${nz}`;
      if (!seen.has(key) && collision.free(nx / 5, nz / 5, 0.4)) {
        seen.add(key);
        queue.push([nx, nz]);
      }
    }
  }
  for (const p of goals)
    expect(
      seen.has(`${Math.round(p.x * 5)},${Math.round(p.z * 5)}`),
      `reachable ${p.x},${p.z}`,
    ).toBe(true);
}
afterEach(() => gameStore.reset());
describe("Vulkanvärlden", () => {
  it("unlocks only after the final reward, survives equipment changes and reload, and restricts adjacency", () => {
    const storage = memory(),
      s = createGameStore(storage);
    s.grantItems(["fire-sword", "fire-shield"]);
    s.travelTo({ world: "volcano" });
    expect(s.getState().location).toBeNull();
    completeFire(s);
    expect(volcanoUnlocked(s.getState().dungeons)).toBe(true);
    s.travelTo({ world: "volcano" });
    expect(s.getState().location).toEqual({
      dungeon: "fire",
      room: "treasure",
    });
    s.close();
    s.travelTo({ world: "volcano" });
    expect(s.getState().location?.dungeon).toBe("fire");
    s.travelTo(null);
    s.equipItem("temple-sword", "weapon");
    s.equipItem("temple-shield", "shield");
    s.pause();
    s.travelTo({ world: "volcano" });
    expect(s.getState().location).toBeNull();
    s.close();
    s.travelTo({ world: "volcano" });
    expect(s.getState().location).toEqual({ world: "volcano" });
    const restored = createGameStore(storage);
    expect(restored.getState().location).toEqual({ world: "volcano" });
    restored.travelTo({ castle: "hall" });
    expect(restored.getState().location).toEqual({ world: "volcano" });
    restored.travelTo({ dungeon: "fire", room: "light" });
    expect(restored.getState().location).toEqual({ world: "volcano" });
    restored.travelTo(null);
    expect(restored.getState().location).toBeNull();
    restored.travelTo({ castle: "hall" });
    restored.travelTo({ world: "volcano" });
    expect(restored.getState().location).toEqual({ castle: "hall" });
  });
  it("rejects a locked or malformed saved world and remains playable without storage", () => {
    const storage = memory(),
      s = createGameStore(storage);
    s.pause();
    s.close();
    s.collect("path-1");
    const saved = JSON.parse(storage.getItem());
    saved.location = { world: "volcano" };
    expect(parseSave(JSON.stringify(saved)).location).toBeNull();
    completeFire(s);
    const unlocked = JSON.parse(storage.getItem());
    unlocked.location = { world: "volcano", castle: "hall" };
    expect(parseSave(JSON.stringify(unlocked)).location).toBeNull();
    const broken = createGameStore({
      getItem() {
        throw Error();
      },
      setItem() {
        throw Error();
      },
    });
    completeFire(broken);
    broken.close();
    broken.travelTo(null);
    broken.travelTo({ world: "volcano" });
    expect(broken.getState().location).toEqual({ world: "volcano" });
  });
  it("activates the world portal and performs both automatic passages without spawn bounce", () => {
    const world = new World(),
      volcano = new VolcanoArea(),
      interaction = new InteractionSystem(new Scene());
    try {
      expect(world.passages().some((p) => p.destination?.world)).toBe(false);
      completeFire(gameStore);
      gameStore.close();
      gameStore.travelTo(null);
      world.update(0, 0);
      expect(
        world.passages().some((p) => p.destination?.world === "volcano"),
      ).toBe(true);
      interaction.update(
        new Vector3(VOLCANO_ENTRANCE.x, 0, VOLCANO_ENTRANCE.z),
        world,
        0,
      );
      expect(gameStore.getState().location).toEqual({ world: "volcano" });
      const position = new Vector3(volcano.spawn.x, 0, volcano.spawn.z);
      expect(position.z).toBeLessThan(VOLCANO_RETURN.z);
      // Continue in the direction used to enter the fire portal.
      for (let step = 0; step < 40; step++) {
        volcano.collision.move(position, 0, -0.05);
        interaction.update(position, volcano, 0);
        expect(gameStore.getState().location).toEqual({ world: "volcano" });
      }
      expect(position.z).toBeCloseTo(volcano.spawn.z - 2);
      // Only intentionally turning around and walking back through should return.
      for (let step = 0; step < 80 && gameStore.getState().location; step++) {
        volcano.collision.move(position, 0, 0.05);
        interaction.update(position, volcano, 0);
      }
      expect(gameStore.getState().location).toBeNull();
      const spawn = portalSpawn(VOLCANO_ENTRANCE, 1);
      position.set(spawn.x, 0, spawn.z);
      expect(position.z).toBeGreaterThan(VOLCANO_ENTRANCE.z);
      for (let step = 0; step < 30; step++) {
        world.collision.move(position, 0, 0.05);
        interaction.update(position, world, 0);
        expect(gameStore.getState().location).toBeNull();
      }
      expect(position.z).toBeCloseTo(spawn.z + 1.5);
    } finally {
      world.dispose();
      volcano.dispose();
      disposeTree(interaction.ring);
      disposeTree(interaction.arrow);
    }
  });
  it("connects every clearing and both portal approaches while blocking lava and edges", () => {
    const area = new VolcanoArea(),
      world = new World();
    try {
      reachable(area.collision, area.spawn, [
        VOLCANO_RETURN,
        ...VOLCANO_CLEARINGS.map(([x, z]) => gladePosition(x, z)),
        gladePosition(8, 5),
      ]);
      reachable(world.collision, gladePosition(0, 17), [
        VOLCANO_ENTRANCE,
        portalSpawn(VOLCANO_ENTRANCE, 1),
      ]);
      for (const [x, z] of VOLCANO_LAVA) {
        const p = gladePosition(x, z);
        expect(area.collision.free(p.x, p.z)).toBe(false);
      }
      expect(area.collision.free(0, -7.8)).toBe(false);
      expect(area.collision.free(15, 0)).toBe(false);
      expect(area.rupees).toEqual([]);
      expect(area.interactions()).toEqual([]);
    } finally {
      area.dispose();
      world.dispose();
    }
  });
});
