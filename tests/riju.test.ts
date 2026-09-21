import { afterEach, expect, it } from "vitest";
import { Vector3 } from "three";
import { createGameStore, gameStore, parseSave } from "../src/store/gameStore";
import { DUNGEONS } from "../src/game/dungeons/definitions";
import { hasRiju } from "../src/game/companions/definitions";
import { RijuCompanion } from "../src/game/companions/RijuCompanion";
import { DesertArea } from "../src/game/DesertArea";
import { disposeTree } from "../src/game/Area";
import { completeRabbitQuest } from "./helpers/rabbits";
import { defeatGiant } from "./helpers/volcano";

type Store = ReturnType<typeof createGameStore>;
function solveTemple(s: Store, id: string) {
  const temple = DUNGEONS.find((d) => d.id === id)!;
  for (const room of temple.rooms) {
    s.travelTo({ dungeon: id, room: room.id });
    expect(s.getState().location).toEqual({ dungeon: id, room: room.id });
    if (room.stones)
      room.stones.forEach((stone, i) => {
        for (
          let n = stone.start;
          n !== stone.goal;
          n += Math.sign(stone.goal - stone.start)
        ) {
          s.pushStone(i, stone.goal > stone.start ? 1 : -1);
          s.finishMotion();
        }
      });
    if (room.challenge) {
      s.setTarget({ kind: "challenge", id: room.challenge.id, label: "Öppna" });
      s.interact();
      while (s.getState().question) {
        s.answer(s.getState().question!.correctAnswer);
        s.finishQuiz();
      }
      s.close();
    }
  }
  s.travelTo(temple.entranceWorld ? { world: temple.entranceWorld } : null);
}
function enterWater(s: Store) {
  completeRabbitQuest(s);
  s.travelTo({ world: "volcano" });
  defeatGiant(s);
  s.travelTo({ world: "volcano-interior" });
  solveTemple(s, "fire");
  s.setTarget({ kind: "yunoboRock", label: "Hjälp, Yunobo!" }); s.interact(); s.finishYunoboHelp();
  s.travelTo({ world: "water" });
}

function enterDesert(s: Store) {
  enterWater(s); solveTemple(s, "water");
  s.setTarget({ kind: "sidonGate", label: "Öppna porten" }); s.interact();
  s.travelTo({ world: "desert" });
}
afterEach(() => { gameStore.debugEndSession(); gameStore.reset(); });

it("waits outside the temple, joins after treasure and opens the hole without an interaction", () => {
  enterDesert(gameStore);
  const area = new DesertArea(), riju = new RijuCompanion();
  const position = new Vector3(12, 0, 16.3);
  try {
    riju.reset(position, area);
    const waiting = riju.root.position.clone();
    expect(riju.root.visible).toBe(true);
    expect(area.collision.free(waiting.x, waiting.z)).toBe(true);
    riju.update(1, position, area);
    expect(riju.root.position).toEqual(waiting);
    expect(gameStore.getState().overlay).toBeNull();
    expect(area.passages(gameStore.getState()).some(p => p.fall)).toBe(false);
    gameStore.travelTo({ world: "underworld" });
    expect(gameStore.getState().location).toEqual({ world: "desert" });
    solveTemple(gameStore, "desert");
    expect(hasRiju(gameStore.getState().dungeons)).toBe(true);
    const templeExit = new DesertArea(true);
    try {
      templeExit.update(0.2, 0.2);
      expect(templeExit.passages(gameStore.getState()).some(p => p.fall)).toBe(false);
      riju.update(1, position, area);
      expect(gameStore.getState().overlay).toBe("riju");
      templeExit.update(5, 5);
      expect(templeExit.passages(gameStore.getState()).some(p => p.fall)).toBe(false);
      gameStore.close();
      templeExit.update(2, 7);
      expect(templeExit.passages(gameStore.getState()).some(p => p.fall)).toBe(true);
      expect(templeExit.interactions(gameStore.getState()).some(p => p.target !== null && typeof p.target === "object" && p.target.label.includes("Riju"))).toBe(false);
      gameStore.travelTo({ world: "underworld" });
      expect(gameStore.getState().location).toEqual({ world: "underworld" });
      gameStore.travelTo({ world: "desert" });
      const reloaded = new DesertArea();
      expect(reloaded.passages(gameStore.getState()).some(p => p.fall)).toBe(true);
      reloaded.dispose();
    } finally { templeExit.dispose(); }
  } finally { area.dispose(); disposeTree(riju.root); }
});

it("preserves progress and opens the underworld even for saves with the former lightning lock", () => {
  let raw = "";
  const storage = { getItem: () => raw, setItem: (_key: string, value: string) => { raw = value; } };
  const s = createGameStore(storage);
  s.greetRiju(); expect(s.getState().overlay).toBeNull();
  enterDesert(s); solveTemple(s, "desert"); s.greetRiju(); s.close();
  const before = parseSave(raw);
  for (const holeOpened of [false, true]) {
    const old = JSON.parse(raw); old.riju.holeOpened = holeOpened;
    const saved = JSON.stringify(old);
    expect(parseSave(saved)).toEqual(before);
    const restored = createGameStore({ getItem: () => saved, setItem: () => { throw Error(); } });
    restored.travelTo({ world: "underworld" });
    expect(restored.getState().location?.world).toBe("underworld");
    expect(restored.getState().riju.greeted).toBe(true);
  }
  const legacy = JSON.parse(raw); delete legacy.riju;
  expect(parseSave(JSON.stringify(legacy))).toEqual({ ...before, riju: { greeted: false } });
  s.greetRiju(); expect(s.getState().overlay).toBeNull();
});

it("keeps debug unlocks isolated from the real adventure", () => {
  const s = createGameStore();
  s.openDebug(); s.debugTravelTo({ world: "underworld" }); s.closeDebug();
  expect(hasRiju(s.getState().dungeons)).toBe(true);
  s.debugEndSession();
  expect(s.getState().riju).toEqual({ greeted: false });
});
