import { afterEach, expect, it } from "vitest";
import { InstancedMesh, Scene, Vector3 } from "three";
import { createGameStore, gameStore, parseSave, SAVE_VERSION } from "../src/store/gameStore";
import { DUNGEONS } from "../src/game/dungeons/definitions";
import { hasYunobo, YUNOBO_ROCK } from "../src/game/companions/definitions";
import { YunoboCompanion } from "../src/game/companions/YunoboCompanion";
import { VolcanoInteriorArea } from "../src/game/VolcanoInteriorArea";
import { disposeTree } from "../src/game/Area";
import { InteractionSystem } from "../src/game/InteractionSystem";
import { CollisionSystem } from "../src/game/CollisionSystem";
import { completeRabbitQuest } from "./helpers/rabbits";
import { defeatGiant } from "./helpers/volcano";

function completeFire(s: ReturnType<typeof createGameStore>) {
  completeRabbitQuest(s);
  s.travelTo({ world: "volcano" }); defeatGiant(s);
  s.travelTo({ world: "volcano-interior" });
  for (const room of DUNGEONS.find(d => d.id === "fire")!.rooms) {
    s.travelTo({ dungeon: "fire", room: room.id });
    room.stones?.forEach((stone, index) => {
      for (let n = stone.start; n < stone.goal; n++) { s.pushStone(index, 1); s.finishMotion(); }
    });
    if (room.challenge) {
      s.setTarget({ kind: "challenge", id: room.challenge.id, label: "Öppna" }); s.interact();
      while (s.getState().question) { s.answer(s.getState().question!.correctAnswer); s.finishQuiz(); }
    }
  }
  s.close();
}
function greet(s: ReturnType<typeof createGameStore>) { s.greetYunobo(); s.close(); }
function help(s: ReturnType<typeof createGameStore>) {
  s.setTarget({ kind: "yunoboRock", label: "Hjälp, Yunobo!" }); s.interact();
}
afterEach(() => gameStore.reset());

it("waves beside the Fire Temple without blocking paths or joining before the reward", () => {
  gameStore.reset();
  completeRabbitQuest(gameStore);
  gameStore.travelTo({ world: "volcano" }); defeatGiant(gameStore);
  gameStore.travelTo({ world: "volcano-interior" });
  const area = new VolcanoInteriorArea(), companion = new YunoboCompanion();
  const position = new Vector3(0, 0, 3);
  const rotations = () => {
    const values: number[] = [];
    companion.root.traverse(object => values.push(object.rotation.x, object.rotation.y, object.rotation.z));
    return values;
  };
  try {
    companion.reset(position, area);
    expect(companion.root.visible).toBe(true);
    const waitingPosition = companion.root.position.clone();
    expect(waitingPosition.x).toBeGreaterThan(2);
    expect(waitingPosition.z).toBeGreaterThan(1.5);
    expect(area.collision.free(waitingPosition.x, waitingPosition.z, 0.7)).toBe(true);
    const initialPose = rotations();
    position.z -= 2;
    companion.update(0.2, position, area);
    expect(rotations()).not.toEqual(initialPose);
    expect(companion.root.position).toEqual(waitingPosition);
    expect(hasYunobo(gameStore.getState().dungeons)).toBe(false);
    expect(gameStore.getState().overlay).toBeNull();
    for (let x = 0; x <= 5.35; x += 0.1) expect(area.collision.free(x, 0)).toBe(true);
    for (let z = 4; z >= -3; z -= 0.1) expect(area.collision.free(0, z)).toBe(true);
    gameStore.pause();
    const pausedPose = rotations();
    companion.update(1, position, area);
    expect(rotations()).toEqual(pausedPose);
    gameStore.close();
    gameStore.travelTo({ dungeon: "fire", room: DUNGEONS.find(d => d.id === "fire")!.rooms[0].id });
    companion.update(0.1, position, area);
    expect(companion.root.visible).toBe(false);
    gameStore.travelTo({ world: "volcano-interior" });
    companion.reset(position, area);
    expect(companion.root.visible).toBe(true);
    expect(companion.root.position).toEqual(waitingPosition);
    gameStore.reset();
    completeFire(gameStore);
    gameStore.travelTo({ world: "volcano-interior" });
    companion.update(0.1, position, area);
    expect(companion.root.position.distanceTo(position)).toBeLessThan(1.5);
    companion.update(1, position, area);
    expect(gameStore.getState().overlay).toBe("yunobo");
  } finally { disposeTree(companion.root); area.dispose(); }
});

it("walks continuously across footsteps at different frame rates and alternates its legs", () => {
  completeFire(gameStore); greet(gameStore);
  const area = new VolcanoInteriorArea();
  area.collision = new CollisionSystem(100, 100);
  const endings: number[] = [];
  try {
    for (const fps of [30, 60, 120]) {
      const companion = new YunoboCompanion();
      const position = new Vector3(0, 0, 0);
      companion.reset(position, area);
      const left = companion.root.getObjectByName("yunobo-left-leg")!;
      const right = companion.root.getObjectByName("yunobo-right-leg")!;
      let minLeg = Infinity, maxLeg = -Infinity;
      try {
        for (let frame = 0; frame < fps * 6; frame++) {
          position.z -= 2 / fps;
          const before = companion.root.position.clone();
          companion.update(1 / fps, position, area);
          if (frame > fps * 3) {
            // Every frame advances: crossing a trail sample must not insert a stop.
            const speed = companion.root.position.distanceTo(before) * fps;
            expect(speed).toBeGreaterThan(1.8);
            expect(speed).toBeLessThan(2.2);
            minLeg = Math.min(minLeg, left.rotation.x);
            maxLeg = Math.max(maxLeg, left.rotation.x);
            expect(left.rotation.x + right.rotation.x).toBeCloseTo(0);
          }
        }
        expect(minLeg).toBeLessThan(-0.3);
        expect(maxLeg).toBeGreaterThan(0.3);
        endings.push(companion.root.position.z);
        for (let frame = 0; frame < fps * 5; frame++) companion.update(1 / fps, position, area);
        expect(Math.abs(left.rotation.x)).toBeLessThan(0.001);
        expect(Math.abs(right.rotation.x)).toBeLessThan(0.001);
        expect(companion.root.position.distanceTo(position)).toBeGreaterThan(1.2);
      } finally { disposeTree(companion.root); }
    }
    expect(Math.max(...endings) - Math.min(...endings)).toBeLessThan(0.06);
  } finally { area.dispose(); }
});

it("unlocks from the temple reward, greets once and preserves an existing version-20 adventure", () => {
  let raw = "";
  const storage = { getItem: () => raw, setItem: (_key: string, value: string) => { raw = value; } };
  const s = createGameStore(storage);
  s.greetYunobo();
  expect(s.getState().overlay).toBeNull();
  expect(hasYunobo(s.getState().dungeons)).toBe(false);
  completeFire(s);
  const before = parseSave(raw);
  const legacy = JSON.parse(raw);
  delete legacy.yunobo;
  expect(legacy.version).toBe(20);
  expect(SAVE_VERSION).toBe(20);
  raw = JSON.stringify(legacy);
  const restored = createGameStore(storage);
  expect(parseSave(raw)).toEqual(before);
  expect(hasYunobo(restored.getState().dungeons)).toBe(true);
  restored.greetYunobo();
  expect(restored.getState().overlay).toBe("yunobo");
  restored.close();
  expect(parseSave(raw).yunobo.greeted).toBe(true);
  const again = createGameStore(storage);
  again.greetYunobo();
  expect(again.getState().overlay).toBeNull();
  expect(again.getState().rupees).toBe(before.rupees);
  expect(again.getState().items).toEqual(before.items);
  expect(again.getState().dungeons).toEqual(before.dungeons);
  for (const invalid of [null, "broken", { greeted: "yes", rockBroken: 1 }]) {
    expect(parseSave(JSON.stringify({ ...legacy, yunobo: invalid }))).toEqual(before);
  }
});

it("only breaks the hub stone once, saves immediately, and survives leaving or reloading", () => {
  let raw = "";
  const storage = { getItem: () => raw, setItem: (_key: string, value: string) => { raw = value; } };
  const s = createGameStore(storage);
  help(s); expect(s.getState().yunobo.rockBroken).toBe(false);
  completeFire(s); greet(s);
  help(s); expect(s.getState().yunobo.rockBroken).toBe(false);
  s.travelTo({ world: "volcano-interior" });
  const rupees = s.getState().rupees;
  s.pause(); help(s);
  expect(s.getState().yunobo.rockBroken).toBe(false);
  s.close(); help(s);
  expect(s.getState().yunoboHelping).toBe(true);
  s.travelTo({ world: "water" });
  expect(s.getState().location?.world).toBe("volcano-interior");
  expect(parseSave(raw).yunobo.rockBroken).toBe(true);
  s.pause(); s.finishYunoboHelp();
  expect(s.getState().yunoboHelping).toBe(true);
  s.close(); s.finishYunoboHelp(); help(s);
  expect(s.getState().yunoboHelping).toBe(false);
  expect(s.getState().rupees).toBe(rupees);
  const restored = createGameStore(storage);
  expect(restored.getState().yunobo).toEqual({ greeted: true, rockBroken: true });
  expect(restored.getState().yunoboHelping).toBe(false);
  restored.travelTo({ world: "water" });
  expect(hasYunobo(restored.getState().dungeons)).toBe(true);
  restored.travelTo({ world: "volcano-interior" }); help(restored);
  expect(restored.getState().yunoboHelping).toBe(false);
});

it("keeps Yunobo playable when saving fails and isolates debug progress", () => {
  const s = createGameStore({ getItem: () => null, setItem: () => { throw Error("blocked"); } });
  completeFire(s); greet(s); s.travelTo({ world: "volcano-interior" }); help(s);
  expect(s.getState().savingAvailable).toBe(false);
  expect(s.getState().yunobo.rockBroken).toBe(true);
  s.finishYunoboHelp();
  expect(s.getState().yunoboHelping).toBe(false);
  const debug = createGameStore();
  debug.openDebug(); debug.debugTravelTo({ world: "water" }); debug.closeDebug();
  greet(debug); debug.travelTo({ world: "volcano-interior" }); help(debug);
  debug.openDebug(); debug.debugEndSession();
  expect(hasYunobo(debug.getState().dungeons)).toBe(false);
  expect(debug.getState().yunobo).toEqual({ greeted: false, rockBroken: false });
  expect(debug.getState().yunoboHelping).toBe(false);
});

it("offers a reachable stone, pauses the roll, opens the water passage and keeps the temple path clear", () => {
  completeFire(gameStore); greet(gameStore); gameStore.travelTo({ world: "volcano-interior" });
  const area = new VolcanoInteriorArea();
  const companion = new YunoboCompanion();
  const position = new Vector3(YUNOBO_ROCK.x, 0, YUNOBO_ROCK.z + 1.4);
  const interactions = new InteractionSystem(new Scene());
  try {
    companion.reset(position, area);
    for (let x = 0; x < 5; x += 0.1) expect(area.collision.free(x, 0)).toBe(true);
    for (let z = 4; z > -3.7; z -= 0.1) expect(area.collision.free(0, z)).toBe(true);
    expect(area.passages().some(p => p.destination?.world === "water")).toBe(false);
    expect(area.collision.free(YUNOBO_ROCK.x, YUNOBO_ROCK.z)).toBe(false);
    interactions.update(position, area, 0);
    expect(gameStore.getState().target).toMatchObject({ kind: "yunoboRock" });
    // The large boulder can be activated from farther back and from either side.
    const broadPositions = [new Vector3(-2.2, 0, -2.6), new Vector3(2.2, 0, -2.6)];
    for (const broad of broadPositions) {
      interactions.update(broad, area, 0);
      expect(gameStore.getState().target).toMatchObject({ kind: "yunoboRock" });
    }
    interactions.update(position, area, 0);
    gameStore.interact();
    companion.update(0.4, position, area); area.update(0.4, 0.4);
    gameStore.pause();
    const pausedPosition = companion.root.position.clone();
    companion.update(5, position, area);
    expect(companion.root.position).toEqual(pausedPosition);
    expect(gameStore.getState().yunoboHelping).toBe(true);
    gameStore.close(); companion.update(1, position, area); area.update(1, 1.4);
    expect(gameStore.getState().yunoboHelping).toBe(false);
    expect(area.collision.free(YUNOBO_ROCK.x, YUNOBO_ROCK.z)).toBe(true);
    expect(area.interactions(gameStore.getState())).toEqual([]);
    expect(area.passages().some(p => p.destination?.world === "water")).toBe(true);
    for (let z = 4; z > -8; z -= 0.1) expect(area.collision.free(0, z)).toBe(true);
    const returned = new VolcanoInteriorArea();
    expect(returned.collision.free(YUNOBO_ROCK.x, YUNOBO_ROCK.z)).toBe(true);
    returned.dispose();
  } finally { area.dispose(); disposeTree(companion.root); disposeTree(interactions.ring); disposeTree(interactions.arrow); }
});

it("follows through a bend without blocking the hero, stops for dialogs, and rejoins after travel", () => {
  completeFire(gameStore); greet(gameStore); gameStore.travelTo({ world: "volcano-interior" });
  const area = new VolcanoInteriorArea(), companion = new YunoboCompanion();
  const position = new Vector3(0, 0, 3);
  try {
    companion.reset(position, area);
    const start = companion.root.position.clone();
    for (let i = 0; i < 100; i++) {
      if (i < 60) position.z -= 0.05; else position.x += 0.05;
      companion.update(0.025, position, area);
      expect(area.collision.free(companion.root.position.x, companion.root.position.z, 0.22)).toBe(true);
    }
    expect(companion.root.position.distanceTo(start)).toBeGreaterThan(1);
    expect(companion.root.position.distanceTo(position)).toBeLessThan(2);
    gameStore.pause();
    const stopped = companion.root.position.clone(); position.x += 0.5;
    companion.update(3, position, area);
    expect(companion.root.position).toEqual(stopped);
    gameStore.close();
    companion.reset(new Vector3(0, 0, -7), area);
    expect(companion.root.position.distanceTo(new Vector3(0, 0, -7))).toBeLessThan(1.5);
    companion.update(0.1, position, area, true);
    expect(companion.root.visible).toBe(false);
    gameStore.reset(); companion.update(0.1, position, area);
    expect(companion.root.visible).toBe(false);
  } finally { area.dispose(); disposeTree(companion.root); }
});

it("preserves access for an older save already in the water world", () => {
  let raw = "";
  const storage = { getItem: () => raw, setItem: (_key: string, value: string) => { raw = value; } };
  const s = createGameStore(storage);
  completeFire(s); greet(s); s.travelTo({ world: "volcano-interior" }); help(s); s.finishYunoboHelp();
  s.travelTo({ world: "water" });
  const legacy = JSON.parse(raw);
  legacy.yunobo.rockBroken = false;
  raw = JSON.stringify(legacy);
  const restored = createGameStore(storage);
  expect(restored.getState().location).toEqual({ world: "water" });
  expect(restored.getState().yunobo.rockBroken).toBe(true);
  expect(restored.getState().items).toEqual(s.getState().items);
  expect(restored.getState().rupees).toBe(s.getState().rupees);
  restored.travelTo({ world: "volcano-interior" }); restored.travelTo({ world: "water" });
  expect(restored.getState().location).toEqual({ world: "water" });
});

it("bursts into moving debris and dust at impact, pauses, then clears without replaying", () => {
  completeFire(gameStore); greet(gameStore); gameStore.travelTo({ world: "volcano-interior" });
  const area = new VolcanoInteriorArea();
  try {
    const burst = area.root.getObjectByName("yunobo-rock-burst")!;
    const pieces = burst.children[0] as InstancedMesh;
    const positions = () => Array.from(pieces.instanceMatrix.array);
    expect(burst.visible).toBe(false);
    help(gameStore); area.update(0.4, 0.4);
    expect(burst.visible).toBe(false);
    gameStore.finishYunoboHelp(); area.update(0.016, 0.416);
    expect(burst.visible).toBe(true);
    expect(area.collision.free(YUNOBO_ROCK.x, YUNOBO_ROCK.z)).toBe(true);
    const impact = positions();
    area.update(0.3, 0.716);
    expect(positions()).not.toEqual(impact);
    gameStore.pause();
    const paused = positions();
    area.update(5, 5.716);
    expect(positions()).toEqual(paused);
    expect(burst.visible).toBe(true);
    gameStore.close(); area.update(2, 7.716);
    expect(burst.visible).toBe(false);
    const returned = new VolcanoInteriorArea();
    try {
      returned.update(0.1, 8);
      expect(returned.root.getObjectByName("yunobo-rock-burst")!.visible).toBe(false);
      expect(returned.collision.free(YUNOBO_ROCK.x, YUNOBO_ROCK.z)).toBe(true);
    } finally { returned.dispose(); }
  } finally { area.dispose(); }
});
