import { expect, it } from "vitest";
import { createGameStore, SAVE_KEY } from "../src/store/gameStore";
import type { SoundEvent } from "../src/audio/types";
import { BUTTERFLY_SECRETS } from "../src/game/secrets/definitions";
const setup = () => {
  const data = new Map<string, string>();
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
  const store = createGameStore(storage);
  const events: SoundEvent[] = [];
  const off = store.subscribeSound((event) => events.push(event));
  return { store, events, off, storage };
};
it("emits pickups once, never on restore, reset, blocked actions or removed subscriptions", () => {
  const { store, events, off, storage } = setup();
  store.interact();
  store.collect("unknown");
  store.collect("path-1");
  store.collect("path-1");
  expect(events).toEqual(["rupee"]);
  const restored = createGameStore(storage);
  restored.subscribeSound((event) => events.push(event));
  restored.collect("path-1");
  restored.reset();
  expect(events).toEqual(["rupee"]);
  expect(storage.getItem(SAVE_KEY)).not.toBeNull();
  off();
  store.collect("path-2");
  expect(events).toHaveLength(1);
});
it.each([false, true])(
  "gives repeated retry feedback and a single completion (temple=%s)",
  (temple) => {
    const { store: s, events } = setup();
    if (temple) {
      s.travelTo({ dungeon: "moss", room: "light" });
      s.setTarget({ kind: "challenge", id: "light-lock", label: "Räkna" });
    } else s.setTarget({ kind: "chest", id: "glade", label: "Öppna" });
    s.interact();
    if (!temple) s.beginQuiz();
    s.answer(99);
    s.answer(99);
    expect(events).toEqual(["interact", "retry", "retry"]);
    const required = temple ? 5 : 3;
    for (let i = 0; i < required; i++) {
      const answer = s.getState().question!.correctAnswer;
      s.answer(answer);
      s.answer(answer);
      s.finishQuiz();
    }
    expect(events).toEqual([
      "interact",
      "retry",
      "retry",
      ...Array(required - 1).fill("correct"),
      "complete",
    ]);
  },
);
it("celebrates the last stone only when it lands and ignores overlapping pushes", () => {
  const { store: s, events } = setup();
  s.travelTo({ dungeon: "moss", room: "light" });
  s.setTarget({ kind: "challenge", id: "light-lock", label: "Räkna" });
  s.interact();
  while (s.getState().question) {
    s.answer(s.getState().question!.correctAnswer);
    s.finishQuiz();
  }
  s.travelTo({ dungeon: "moss", room: "stones" });
  events.length = 0;
  for (const [index, direction] of [
    [0, -1],
    [0, -1],
    [1, 1],
    [1, 1],
    [2, -1],
  ] as const) {
    expect(s.pushStone(index, direction)).toBe(true);
    expect(s.pushStone(index, direction)).toBe(false);
    expect(events.at(-1)).toBe("stone");
    s.finishMotion();
  }
  s.finishMotion();
  s.pushStone(0, 1);
  expect(events).toEqual([
    "stone",
    "stone",
    "stone",
    "stone",
    "stone",
    "solved",
  ]);
});
it("emits successful interactions, new items, bridge and secret rewards once", () => {
  const { store: s, events } = setup();
  s.setTarget("npc");
  s.interact();
  s.interact();
  s.close();
  s.grantItems(["temple-sword", "temple-shield"]);
  s.grantItems(["temple-sword"]);
  s.setTarget("bokoblin");
  s.interact();
  s.interact();
  const secret = BUTTERFLY_SECRETS[0];
  s.discoverSecret(secret.id);
  s.revealSecret(secret.id);
  s.revealSecret(secret.id);
  s.setTarget({ kind: "chest", id: secret.chestId, label: "Öppna" });
  s.interact();
  expect(events).toEqual([
    "interact",
    "reward",
    "discovery",
    "discovery",
    "reward",
  ]);
});
it("keeps debug travel and grants silent", () => {
  const { store, events } = setup();
  store.openDebug();
  store.debugTravelTo({ dungeon: "moss", room: "stones" });
  store.grantItems(["temple-sword"]);
  expect(events).toEqual([]);
});
