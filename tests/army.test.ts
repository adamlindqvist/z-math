import { afterEach, expect, it } from "vitest";
import { createGameStore, gameStore, parseSave, SAVE_VERSION } from "../src/store/gameStore";
import { ARMY } from "../src/game/underworld/army";
import { UnderworldArea } from "../src/game/UnderworldArea";

afterEach(() => { gameStore.debugEndSession(); gameStore.reset(); });
function enter() {
  gameStore.openDebug(); gameStore.debugTravelTo({ world: "underworld" }); gameStore.close();
}
it("requires each quiz, allows retries and cancellation, then removes each guard in smoke and opens the barrier", () => {
  enter();
  const area = new UnderworldArea();
  try {
    for (const [index, b] of ARMY.entries()) {
      const target = { kind: "armyBokoblin" as const, id: b.id, label: "Möt Bokoblin" };
      gameStore.setTarget(target); gameStore.interact();
      gameStore.answer(-1);
      expect(gameStore.getState().feedback).toBe("retry");
      expect(gameStore.getState().defeatedArmy).toHaveLength(index);
      gameStore.close();
      gameStore.setTarget(target); gameStore.interact();
      for (let i = 0; i < 3; i++) {
        const answer = gameStore.getState().question!.correctAnswer;
        gameStore.answer(answer); gameStore.answer(answer);
        expect(gameStore.getState().quizCorrectAnswers).toBe(i + 1);
        gameStore.finishQuiz();
      }
      expect(gameStore.getState().armyQuiz).toBeNull();
      expect(gameStore.getState().defeatedArmy).toHaveLength(index + 1);
      area.update(0.4, 1);
      const guard = area.root.getObjectByName(`army-${b.id}`)!;
      expect(guard.getObjectByName("red-smoke")!.visible).toBe(true);
      area.update(2, 3);
      expect(guard.children.every(child => !child.visible)).toBe(true);
      expect(area.interactions()).toHaveLength(3 - index);
      expect(area.collision.free(0, -17)).toBe(index === 2);
      gameStore.setTarget(target); gameStore.interact();
      expect(gameStore.getState().overlay).toBeNull();
    }
    const reloaded = new UnderworldArea();
    expect(reloaded.interactions()).toHaveLength(1);
    expect(reloaded.collision.free(0, -17)).toBe(true);
    reloaded.dispose();
  } finally { area.dispose(); }
});
it("persists victories while preserving saves made before the army existed", () => {
  enter();
  const old = { ...gameStore.getState(), version: SAVE_VERSION, defeatedArmy: undefined };
  expect(parseSave(JSON.stringify(old))).toMatchObject({ location: { world: "underworld" }, defeatedArmy: [], rupees: old.rupees, chests: old.chests });
  let raw = JSON.stringify(old);
  const storage = { getItem: () => raw, setItem: (_key: string, value: string) => { raw = value; } };
  const store = createGameStore(storage);
  store.setTarget({ kind: "armyBokoblin", id: "right", label: "Möt" }); store.interact();
  for (let i = 0; i < 3; i++) { store.answer(store.getState().question!.correctAnswer); store.finishQuiz(); }
  expect(createGameStore(storage).getState()).toMatchObject({ defeatedArmy: ["right"], rupees: old.rupees, location: { world: "underworld" } });
  expect(parseSave(JSON.stringify({ ...old, defeatedArmy: ["bad", "right", "right"] })).defeatedArmy).toEqual(["right"]);
});
it("ignores army interactions outside the underworld", () => {
  const store = createGameStore();
  store.setTarget({ kind: "armyBokoblin", id: "left", label: "Möt" }); store.interact();
  expect(store.getState().question).toBeNull();
});
