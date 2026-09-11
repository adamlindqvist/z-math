import { afterEach, expect, it } from "vitest";
import { Scene, Vector3 } from "three";
import { createGameStore, gameStore, parseSave } from "../src/store/gameStore";
import { FIRE_SHIELD_CHEST_POSITION, World } from "../src/game/World";
import { InteractionSystem } from "../src/game/InteractionSystem";
import { disposeTree } from "../src/game/Area";

const id = "south-fire-shield";
const target = { kind: "chest" as const, id, label: "Öppna" };
const unlock = (s: ReturnType<typeof createGameStore>) => {
  s.grantItems(["temple-sword", "temple-shield"]);
  s.setTarget("bokoblin"); s.interact();
};
const begin = (s: ReturnType<typeof createGameStore>) => {
  s.setTarget(target); s.interact(); s.beginQuiz();
};
afterEach(() => gameStore.reset());
it("requires the bridge, allows retries and gives the shield and five rupees exactly once", () => {
  let raw = "";
  const storage = { getItem: () => raw, setItem: (_key: string, value: string) => { raw = value; } };
  const s = createGameStore(storage);
  begin(s); expect(s.getState().overlay).toBeNull();
  unlock(s);
  // Visiting the volcano never requires the new reward.
  s.travelTo({ world: "volcano" }); expect(s.getState().location?.world).toBe("volcano");
  begin(s); expect(s.getState().overlay).toBeNull();
  s.travelTo(null); begin(s);
  s.answer(-1); expect(s.getState().feedback).toBe("retry");
  expect(s.getState().rupees).toBe(0);
  s.replaceQuestion();
  s.answer(s.getState().question!.correctAnswer); s.finishQuiz();
  s.close();
  expect(s.getState().chests[id]).toBe(false);
  expect(s.getState().items).not.toContain("fire-shield");
  begin(s); expect(s.getState().quizCorrectAnswers).toBe(0);
  for (let i = 0; i < 3; i++) {
    const q = s.getState().question!;
    expect(q.kind).toBe("addition");
    expect(q.correctAnswer).toBeLessThanOrEqual(5);
    s.answer(q.correctAnswer); s.answer(q.correctAnswer); s.finishQuiz();
    if (i < 2) expect(s.getState().chests[id]).toBe(false);
  }
  expect(s.getState()).toMatchObject({
    rupees: 5, chests: { [id]: true, south: false },
    equipment: { shield: "fire-shield" }, rewardItems: ["fire-shield"], overlay: "itemReward",
  });
  const good = raw;
  const restored = createGameStore(storage);
  expect(restored.getState().chests[id]).toBe(true);
  expect(restored.getState().equipment.shield).toBe("fire-shield");
  begin(restored); expect(restored.getState().overlay).toBe("empty");
  expect(restored.getState().rupees).toBe(5);
  expect(restored.getState().items.filter(i => i === "fire-shield")).toHaveLength(1);
  restored.close(); restored.equipItem("temple-shield", "shield");
  expect(createGameStore(storage).getState().equipment.shield).toBe("temple-shield");
  for (const change of [
    (p: any) => { p.bridgeUnlocked = false; },
    (p: any) => { p.items = p.items.filter((i: string) => i !== "fire-shield"); p.equipment.shield = null; },
    (p: any) => { p.version -= 1; },
  ]) {
    const bad = JSON.parse(good); change(bad);
    expect(parseSave(JSON.stringify(bad)).chests[id]).toBe(false);
  }
});
it("puts a reachable chest on the former temple site and exposes its interaction after the bridge", () => {
  const world = new World(), interaction = new InteractionSystem(new Scene());
  try {
    const p = FIRE_SHIELD_CHEST_POSITION;
    expect(world.fireShieldChest.root.position.toArray()).toEqual([-6.25, 0, 22.5]);
    expect(world.collision.free(p.x, p.z)).toBe(false);
    expect(world.interactions().some(o => typeof o.target === "object" && o.target.id === id)).toBe(false);
    unlock(gameStore); world.update(0, 0);
    // Walk from the main path to the front of the chest with player-sized clearance.
    const approach = { x: p.x, z: p.z + 1.2 };
    for (let x = 0; x >= p.x; x -= 0.1)
      expect(world.collision.free(x, approach.z), `approach ${x},${approach.z}`).toBe(true);
    interaction.update(new Vector3(approach.x, 0, approach.z), world, 0);
    expect(gameStore.getState().target).toMatchObject({ id });
    begin(gameStore);
    for (let i = 0; i < 3; i++) { gameStore.answer(gameStore.getState().question!.correctAnswer); gameStore.finishQuiz(); }
    gameStore.close(); world.update(1, 1);
    expect(world.interactions().find(o => typeof o.target === "object" && o.target.id === id)?.target).toMatchObject({ label: "Titta i kistan" });
    expect(world.passages().some(p => p.destination?.world === "volcano")).toBe(true);
  } finally { world.dispose(); disposeTree(interaction.ring); disposeTree(interaction.arrow); }
});
