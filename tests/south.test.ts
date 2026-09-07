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
    expect(s.getState().equipment.sword).toBeNull();
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
    expect(s.getState().chests).toEqual({ glade: false, south: true });
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
      interactions.update(new Vector3(0, 0, 6.5), w, 0);
      expect(gameStore.getState().target).toBe("bokoblin");
      for (const x of [-1.1, 0, 1.1]) {
        const p = { x, z: 6.8 };
        w.collision.move(p, 0, 8);
        expect(p.z).toBeLessThan(7.3);
      }
      for (const x of [-10, -3, 3, 10])
        expect(w.collision.free(x, 10)).toBe(false);
      unlock(gameStore);
      w.update(1, 1);
      const p = { x: 0, z: 6.8 };
      w.collision.move(p, 0, 14);
      expect(p.z).toBeCloseTo(20.8);
      w.collision.move(p, 0, -14);
      expect(p.z).toBeCloseTo(6.8);
      expect(w.collision.free(9.2, 20)).toBe(false);
      expect(w.collision.free(0, 27.5)).toBe(false);
      interactions.update(new Vector3(3.5, 0, 24.2), w, 0);
      expect(gameStore.getState().target).toMatchObject({
        kind: "chest",
        id: "south",
      });
      gameStore.reset();
      w.update(0, 0);
      expect(w.bokoblin.root.visible).toBe(true);
      expect(w.collision.free(0, 7.9)).toBe(false);
    } finally {
      w.dispose();
    }
  });
});
