import { VOLCANO_RUPEES } from "../src/game/volcanoLayout";
import { disposeTree } from "../src/game/Area";
import { afterEach, describe, expect, it } from "vitest";
import { Scene, Vector3 } from "three";
import { createGameStore, gameStore, parseSave } from "../src/store/gameStore";
import { DUNGEONS, volcanoUnlocked } from "../src/game/dungeons/definitions";
import { World } from "../src/game/World";
import {
  VolcanoArea,
  VOLCANO_CLEARINGS,
  VOLCANO_CHEST_POSITION,
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
  it("collects the four trail rupees only in the volcano and keeps them collected after reload", () => {
    const storage = memory(), s = createGameStore(storage);
    for (const { id } of VOLCANO_RUPEES) s.collect(id);
    expect(s.getState().collected).toEqual([]);
    completeFire(s);
    s.close();
    s.travelTo(null);
    s.travelTo({ world: "volcano" });
    const before = s.getState().rupees;
    for (const { id } of VOLCANO_RUPEES) { s.collect(id); s.collect(id); }
    expect(s.getState().rupees).toBe(before + 4);
    const restored = createGameStore(storage);
    for (const { id } of VOLCANO_RUPEES) restored.collect(id);
    expect(restored.getState().rupees).toBe(before + 4);
    expect(restored.getState().collected).toEqual(VOLCANO_RUPEES.map(r => r.id));
  });
  it("picks up trail rupees by walking over them and hides them on revisits", () => {
    completeFire(gameStore);
    gameStore.close();
    gameStore.travelTo(null);
    gameStore.travelTo({ world: "volcano" });
    const area = new VolcanoArea(), interaction = new InteractionSystem(new Scene());
    try {
      const before = gameStore.getState().rupees;
      for (const rupee of area.rupees) {
        interaction.update(rupee.root.position.clone(), area, 0);
        area.update(0, 0);
        expect(rupee.root.visible).toBe(false);
      }
      expect(gameStore.getState().rupees).toBe(before + 4);
      const returned = new VolcanoArea();
      expect(returned.rupees.every(r => !r.root.visible)).toBe(true);
      returned.dispose();
    } finally {
      area.dispose();
      disposeTree(interaction.ring);
      disposeTree(interaction.arrow);
    }
  });
  it("opens the first treasure with three picture sums, allows retries and saves only one reward", () => {
    const storage = memory(), s = createGameStore(storage);
    const target = { kind: "chest" as const, id: "volcano-01" as const, label: "Öppna" };
    s.setTarget(target);
    s.interact();
    expect(s.getState().activeChest).toBeNull();
    completeFire(s);
    s.close();
    s.travelTo(null);
    s.travelTo({ world: "volcano" });
    const before = s.getState().rupees;
    const begin = () => { s.setTarget(target); s.interact(); s.beginQuiz(); };
    begin();
    s.answer(s.getState().question!.correctAnswer);
    s.finishQuiz();
    s.close();
    expect(s.getState().chests["volcano-01"]).toBe(false);
    begin();
    expect(s.getState().quizCorrectAnswers).toBe(0);
    s.answer(-1);
    expect(s.getState().feedback).toBe("retry");
    s.replaceQuestion();
    const keys = new Set<string>();
    for (let i = 0; i < 3; i++) {
      const q = s.getState().question!;
      expect(q.groups).toHaveLength(2);
      expect(q.correctAnswer).toBeLessThanOrEqual(5);
      expect(q.answerDots).toBe(true);
      expect(q.answers).toHaveLength(3);
      expect(keys.has(q.key)).toBe(false);
      keys.add(q.key);
      s.answer(q.correctAnswer);
      s.answer(q.correctAnswer);
      s.finishQuiz();
    }
    expect(s.getState().chests["volcano-01"]).toBe(true);
    expect(s.getState().rupees).toBe(before + 5);
    const restored = createGameStore(storage);
    expect(restored.getState().chests["volcano-01"]).toBe(true);
    expect(restored.getState().rupees).toBe(before + 5);
    restored.setTarget(target);
    restored.interact();
    expect(restored.getState().overlay).toBe("empty");
    restored.beginQuiz();
    expect(restored.getState().question).toBeNull();
    expect(restored.getState().rupees).toBe(before + 5);
  });
  it("makes the treasure reachable and animates it after the quiz, including on return", () => {
    completeFire(gameStore);
    gameStore.close();
    gameStore.travelTo(null);
    gameStore.travelTo({ world: "volcano" });
    const area = new VolcanoArea(), interaction = new InteractionSystem(new Scene());
    try {
      const approach = { x: VOLCANO_CHEST_POSITION.x, z: VOLCANO_CHEST_POSITION.z + 1.1 };
      reachable(area.collision, area.spawn, [approach]);
      interaction.update(new Vector3(approach.x, 0, approach.z), area, 0);
      expect(gameStore.getState().target).toMatchObject({ kind: "chest", id: "volcano-01" });
      gameStore.interact();
      gameStore.beginQuiz();
      for (let i = 0; i < 3; i++) {
        gameStore.answer(gameStore.getState().question!.correctAnswer);
        area.update(1, 0);
        expect(area.chest.openAmount).toBe(0);
        gameStore.finishQuiz();
      }
      area.update(1, 0);
      expect(area.chest.openAmount).toBe(1);
      const returned = new VolcanoArea();
      expect(returned.chest.lid.rotation.x).toBeCloseTo(-1.8);
      returned.dispose();
    } finally {
      area.dispose();
      disposeTree(interaction.ring);
      disposeTree(interaction.arrow);
    }
  });
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
        ...VOLCANO_RUPEES,
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
      expect(area.rupees).toHaveLength(4);
      expect(area.interactions(gameStore.getState())).toHaveLength(1);
      expect(area.collision.free(VOLCANO_CHEST_POSITION.x, VOLCANO_CHEST_POSITION.z)).toBe(false);
    } finally {
      area.dispose();
      world.dispose();
    }
  });

  it("scatters burnt ground detail that never blocks the player", () => {
    const area = new VolcanoArea(), twinArea = new VolcanoArea();
    try {
      const ground = area.root.getObjectByName("volcano-ground");
      expect(ground).toBeDefined();
      expect(ground!.children.length).toBeGreaterThan(20);
      for (const detail of ground!.children)
        expect(area.collision.free(detail.position.x, detail.position.z, 0.05)).toBe(true);
      const twin = twinArea.root.getObjectByName("volcano-ground")!;
      expect(twin.children).toHaveLength(ground!.children.length);
      expect(twin.children[0].position.toArray()).toEqual(ground!.children[0].position.toArray());
    } finally {
      area.dispose();
      twinArea.dispose();
    }
  });
});
