import { afterEach, expect, it } from "vitest";
import { Vector3 } from "three";
import { createGameStore, gameStore, parseSave, SAVE_VERSION } from "../src/store/gameStore";
import { DUNGEONS } from "../src/game/dungeons/definitions";
import { hasTulin } from "../src/game/companions/definitions";
import { TulinCompanion } from "../src/game/companions/TulinCompanion";
import { YunoboCompanion } from "../src/game/companions/YunoboCompanion";
import { VolcanoInteriorArea } from "../src/game/VolcanoInteriorArea";
import { CollisionSystem } from "../src/game/CollisionSystem";
import { disposeTree } from "../src/game/Area";
import { World } from "../src/game/World";
import { gladeDistance } from "../src/game/gladeLayout";

type Store = ReturnType<typeof createGameStore>;
function completeGlade(s: Store) {
  for (const room of DUNGEONS.find(d => d.id === "moss")!.rooms) {
    s.travelTo({ dungeon: "moss", room: room.id });
    room.stones?.forEach((stone, index) => {
      for (let n = stone.start; n !== stone.goal; n += Math.sign(stone.goal - stone.start)) {
        s.pushStone(index, Math.sign(stone.goal - stone.start) as -1 | 1); s.finishMotion();
      }
    });
    if (room.challenge) {
      s.setTarget({ kind: "challenge", id: room.challenge.id, label: "Öppna" }); s.interact();
      while (s.getState().question) { s.answer(s.getState().question!.correctAnswer); s.finishQuiz(); }
    }
  }
}
afterEach(() => { gameStore.debugEndSession(); gameStore.reset(); });

it("blows the bridge guard away once, freezes the gust on pause and never replays an open bridge", () => {
  completeGlade(gameStore); gameStore.close(); gameStore.greetTulin(); gameStore.close();
  gameStore.travelTo(null);
  const area = new World(), tulin = new TulinCompanion();
  const position = new Vector3(0, 0, gladeDistance(7.9) - 1.5);
  try {
    tulin.reset(position, area);
    const rupees = gameStore.getState().rupees;
    gameStore.setTarget("bokoblin"); gameStore.interact();
    expect(gameStore.getState().bridgeUnlocked).toBe(true);
    area.update(0.3, 0.3, position); tulin.update(0.3, position, area);
    const wind = tulin.root.getObjectByName("tulin-bridge-wind")!;
    expect(wind.visible).toBe(true);
    expect(area.bokoblin.root.position.y).toBeGreaterThan(1);
    gameStore.pause();
    const frozen = wind.children.map(ring => ring.position.clone());
    const guardPosition = area.bokoblin.root.position.clone();
    area.update(3, 3.3, position); tulin.update(3, position, area);
    expect(wind.children.map(ring => ring.position)).toEqual(frozen);
    expect(area.bokoblin.root.position).toEqual(guardPosition);
    gameStore.close();
    area.update(0.7, 4, position); tulin.update(0.7, position, area);
    expect(wind.visible).toBe(false);
    expect(area.bokoblin.root.visible).toBe(false);
    gameStore.setTarget("bokoblin"); gameStore.interact(); tulin.update(0.2, position, area);
    expect(wind.visible).toBe(false);
    expect(gameStore.getState().rupees).toBe(rupees);
    const reloaded = new TulinCompanion();
    reloaded.reset(position, area); reloaded.update(0.2, position, area);
    expect(reloaded.root.getObjectByName("tulin-bridge-wind")!.visible).toBe(false);
    disposeTree(reloaded.root);
  } finally { disposeTree(tulin.root); area.dispose(); }
});

it("unlocks Tulin from the final Glade reward and greets after the equipment dialog, once", () => {
  let raw = "";
  const storage = { getItem: () => raw, setItem: (_key: string, value: string) => { raw = value; } };
  const s = createGameStore(storage);
  s.grantItems(["temple-sword", "temple-shield"]);
  expect(hasTulin(s.getState().dungeons)).toBe(false);
  s.greetTulin(); expect(s.getState().overlay).toBeNull();
  s.reset(); completeGlade(s);
  expect(hasTulin(s.getState().dungeons)).toBe(true);
  expect(s.getState().overlay).toBe("itemReward");
  s.greetTulin(); expect(s.getState().overlay).toBe("itemReward");
  s.close(); s.greetTulin();
  expect(s.getState().overlay).toBe("tulin");
  const rupees = s.getState().rupees;
  s.close(); s.greetTulin();
  expect(s.getState().overlay).toBeNull();
  const reloaded = createGameStore(storage);
  reloaded.greetTulin();
  expect(reloaded.getState().overlay).toBeNull();
  expect(reloaded.getState().tulin.greeted).toBe(true);
  expect(reloaded.getState().rupees).toBe(rupees);
  reloaded.travelTo(null);
  expect(hasTulin(reloaded.getState().dungeons)).toBe(true);
});

it("loads existing version-20 saves without Tulin and keeps every other progress field", () => {
  let raw = "";
  const s = createGameStore({ getItem: () => raw, setItem: (_key, value) => { raw = value; } });
  completeGlade(s); s.close();
  const before = parseSave(raw), legacy = JSON.parse(raw);
  delete legacy.tulin;
  expect(SAVE_VERSION).toBe(20);
  expect(parseSave(JSON.stringify(legacy))).toEqual(before);
  expect(hasTulin(parseSave(JSON.stringify(legacy)).dungeons)).toBe(true);
  for (const tulin of [null, 42, "yes", { greeted: "yes" }])
    expect(parseSave(JSON.stringify({ ...legacy, tulin }))).toEqual(before);
});

it("isolates debug greetings and remains playable with unavailable storage", () => {
  let writes = 0;
  const s = createGameStore({ getItem: () => null, setItem: () => { writes++; throw Error("blocked"); } });
  completeGlade(s); s.close(); s.greetTulin(); s.close();
  expect(s.getState().tulin.greeted).toBe(true);
  expect(s.getState().savingAvailable).toBe(false);
  const debug = createGameStore({ getItem: () => null, setItem: () => { writes++; } });
  const before = writes;
  debug.openDebug(); debug.debugTravelTo({ dungeon: "moss", room: "treasure" });
  debug.debugCompleteCurrentRoom(); debug.closeDebug(); debug.greetTulin(); debug.close();
  expect(debug.getState().tulin.greeted).toBe(true);
  debug.debugEndSession();
  expect(hasTulin(debug.getState().dungeons)).toBe(false);
  expect(debug.getState().tulin.greeted).toBe(false);
  expect(writes).toBe(before);
});

it("queues both greetings, flies smoothly with Yunobo, freezes during dialogs and rejoins after travel", () => {
  completeGlade(gameStore); gameStore.close();
  gameStore.openDebug(); gameStore.debugTravelTo({ world: "water" }); gameStore.closeDebug();
  const area = new VolcanoInteriorArea();
  area.collision = new CollisionSystem(100, 100);
  const tulin = new TulinCompanion(), yunobo = new YunoboCompanion();
  const position = new Vector3(0, 0, 0);
  const update = (dt: number) => { tulin.update(dt, position, area); yunobo.update(dt, position, area); };
  try {
    tulin.reset(position, area); yunobo.reset(position, area);
    expect(tulin.root.position.distanceTo(yunobo.root.position)).toBeGreaterThan(1.5);
    update(1);
    expect(gameStore.getState().overlay).toBe("tulin");
    gameStore.close(); update(1);
    expect(gameStore.getState().overlay).toBe("yunobo");
    gameStore.close();
    const wing = tulin.root.getObjectByName("tulin-left-wing")!;
    let minWing = Infinity, maxWing = -Infinity;
    for (let i = 0; i < 360; i++) {
      position.z -= 2 / 60;
      const before = tulin.root.position.clone();
      update(1 / 60);
      minWing = Math.min(minWing, wing.rotation.z); maxWing = Math.max(maxWing, wing.rotation.z);
      if (i > 240) {
        expect(tulin.root.position.distanceTo(before) * 60).toBeGreaterThan(1.8);
        expect(tulin.root.position.distanceTo(yunobo.root.position)).toBeGreaterThan(0.9);
      }
    }
    expect(maxWing - minWing).toBeGreaterThan(0.8);
    gameStore.pause();
    const stopped = tulin.root.position.clone(), stoppedWing = wing.rotation.z;
    position.x += 1; update(1);
    expect(tulin.root.position).toEqual(stopped);
    expect(wing.rotation.z).toBe(stoppedWing);
    gameStore.close();
    tulin.update(0.1, position, area, true);
    expect(tulin.root.visible).toBe(false);
    tulin.reset(new Vector3(0, 0, 20), area);
    expect(tulin.root.visible).toBe(true);
    expect(tulin.root.position.distanceTo(new Vector3(0, 0, 20))).toBeLessThan(1.5);
    gameStore.reset(); update(0.1);
    expect(tulin.root.visible).toBe(false);
    expect(yunobo.root.visible).toBe(false);
  } finally { disposeTree(tulin.root); disposeTree(yunobo.root); area.dispose(); }
});
