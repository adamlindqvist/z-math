import { afterEach, describe, expect, it } from "vitest";
import {
  createGameStore,
  gameStore,
  parseSave,
  type ChestId,
} from "../src/store/gameStore";
import { World } from "../src/game/World";
import { InteractionSystem } from "../src/game/InteractionSystem";
import { Scene, Vector3 } from "three";

const target = (id: ChestId) => ({
  kind: "chest" as const,
  id,
  label: "Öppna",
});
const unlock = (store: ReturnType<typeof createGameStore>) => {
  store.grantItems(["temple-sword", "temple-shield"]);
  store.setTarget("bokoblin");
  store.interact();
};
const solve = (store: ReturnType<typeof createGameStore>, id: ChestId) => {
  store.setTarget(target(id));
  store.interact();
  store.beginQuiz();
  for (let i = 0; i < 3; i++) {
    store.answer(store.getState().question!.correctAnswer);
    store.finishQuiz();
  }
};
afterEach(() => gameStore.reset());
describe("southern glade", () => {
  it("opens extra ground in both glades while keeping landmarks solid at their new positions", () => {
    const world = new World();
    try {
      expect(world.collision.free(world.spawn.x, world.spawn.z)).toBe(true);
      for (const [x, z] of [
        [13, 2],
        [0, -9.5],
        [10.5, 27],
        [3, 33],
      ])
        expect(world.collision.free(x, z), `new ground at ${x}, ${z}`).toBe(
          true,
        );
      for (const [x, z] of [
        [14.5, 2],
        [0, -10.5],
        [11.8, 27],
        [3, 34.5],
      ])
        expect(world.collision.free(x, z), `edge at ${x}, ${z}`).toBe(false);
      const castle = world.root.getObjectByName("castle")!;
      expect(castle.position.toArray()).toEqual([-8.75, 0, -2.5]);
      expect(castle.scale.toArray()).toEqual([1, 1, 1]);
      expect(world.collision.free(-8.75, -2.5)).toBe(false);
      expect(world.collision.free(-6.7, -2)).toBe(true);
      expect(world.collision.free(8.375, 3.875)).toBe(false);
      expect(world.chest.root.position.toArray()).toEqual([7, 0, -4.625]);
      expect(world.chest.root.scale.toArray()).toEqual([1, 1, 1]);
      expect(world.collision.free(7, -4.625)).toBe(false);
    } finally {
      world.dispose();
    }
  });
  it("requires both owned items, even when unequipped, and unlocks only once", () => {
    for (const items of [[], ["temple-sword"], ["temple-shield"]] as const) {
      const s = createGameStore();
      s.grantItems(items);
      s.setTarget("bokoblin");
      s.interact();
      expect(s.getState().bridgeUnlocked).toBe(false);
      expect(s.getState().overlay).toBe("bokoblin");
    }
    const s = createGameStore();
    unlock(s);
    s.interact();
    expect(s.getState().bridgeUnlocked).toBe(true);
    expect(s.getState().equipment.weapon).toBeNull();
    expect(s.getState().rupees).toBe(0);
  });
  it("binds the quiz to its chest across target changes, retries and duplicate answers", () => {
    const s = createGameStore();
    s.setTarget(target("south"));
    s.interact();
    expect(s.getState().overlay).toBeNull();
    unlock(s);
    s.setTarget(target("south"));
    s.interact();
    s.beginQuiz();
    s.answer(-1);
    expect(s.getState().feedback).toBe("retry");
    s.answer(s.getState().question!.correctAnswer);
    s.close();
    expect(s.getState().chests.south).toBe(false);
    s.setTarget(target("south"));
    s.interact();
    s.beginQuiz();
    s.setTarget(target("glade"));
    for (let i = 0; i < 3; i++) {
      const answer = s.getState().question!.correctAnswer;
      s.answer(answer);
      s.answer(answer);
      s.finishQuiz();
      s.finishQuiz();
    }
    expect(s.getState().chests).toEqual({
      glade: false,
      south: true,
      "butterfly-01": false,
      "butterfly-02": false,
    });
    expect(s.getState().rupees).toBe(5);
    solve(s, "glade");
    expect(s.getState().rupees).toBe(10);
    s.setTarget(target("south"));
    s.interact();
    s.beginQuiz();
    s.answer(0);
    expect(s.getState().overlay).toBe("empty");
    expect(s.getState().rupees).toBe(10);
  });
  it("restores unlock and both rewards, validates saves and resets everything", () => {
    let raw = "";
    const storage = {
      getItem: () => raw,
      setItem: (_: string, v: string) => {
        raw = v;
      },
    };
    const s = createGameStore(storage);
    unlock(s);
    solve(s, "south");
    solve(s, "glade");
    expect(createGameStore(storage).getState()).toMatchObject({
      bridgeUnlocked: true,
      chests: { glade: true, south: true },
      rupees: 10,
    });
    const saved = JSON.parse(raw);
    for (const change of [
      { version: 4 },
      { rupees: 15 },
      { bridgeUnlocked: false },
      { items: ["green-clothes"] },
      { chests: { glade: true } },
    ]) {
      expect(
        parseSave(JSON.stringify({ ...saved, ...change })).bridgeUnlocked,
      ).toBe(false);
      expect(parseSave(JSON.stringify({ ...saved, ...change })).rupees).toBe(0);
    }
    s.reset();
    expect(createGameStore(storage).getState()).toMatchObject({
      bridgeUnlocked: false,
      chests: { glade: false, south: false },
    });
    const blocked = createGameStore({
      getItem() {
        throw Error();
      },
      setItem() {
        throw Error();
      },
    });
    unlock(blocked);
    solve(blocked, "south");
    expect(blocked.getState().rupees).toBe(5);
  });
  it("blocks the complete bridge width, keeps the gap solid and opens a round trip", () => {
    gameStore.reset();
    const w = new World();
    try {
      const interactions = new InteractionSystem(new Scene());
      interactions.update(new Vector3(0, 0, 8.475), w, 0);
      expect(gameStore.getState().target).toBe("bokoblin");
      for (const x of [-1.5, 0, 1.5]) {
        const p = { x, z: 8.5 };
        w.collision.move(p, 0, 8);
        expect(p.z).toBeLessThan(9.3);
      }
      for (const x of [-10, -3, 3, 10])
        expect(w.collision.free(x * 1.25, 12.5)).toBe(false);
      unlock(gameStore);
      w.update(1, 1);
      const p = { x: 0, z: 8.5 };
      w.collision.move(p, 0, 14);
      expect(p.z).toBeCloseTo(22.5);
      w.collision.move(p, 0, -14);
      expect(p.z).toBeCloseTo(8.5);
      expect(w.collision.free(11.5, 25)).toBe(false);
      expect(w.collision.free(0, 34.375)).toBe(false);
      interactions.update(new Vector3(4.375, 0, 29.95), w, 0);
      expect(gameStore.getState().target).toMatchObject({
        kind: "chest",
        id: "south",
      });
      gameStore.reset();
      w.update(0, 0);
      expect(w.bokoblin.root.visible).toBe(true);
      expect(w.collision.free(0, 9.875)).toBe(false);
    } finally {
      w.dispose();
    }
  });
  it("places collectible Rupees along the path to the southern chest", () => {
    const w = new World();
    try {
      const southernRupees = w.rupees.filter(({ id }) =>
        id.startsWith("south-path-"),
      );
      expect(
        southernRupees.map(({ root }) => [root.position.x, root.position.z]),
      ).toEqual([
        [0, 18.25],
        [-1, 21.25],
        [-0.75, 24.75],
        [1, 27.5],
      ]);
      for (const rupee of southernRupees) gameStore.collect(rupee.id);
      expect(gameStore.getState()).toMatchObject({
        rupees: 4,
        collected: [
          "south-path-1",
          "south-path-2",
          "south-path-3",
          "south-path-4",
        ],
      });
    } finally {
      w.dispose();
    }
  });
});
