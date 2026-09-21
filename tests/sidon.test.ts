import { afterEach, expect, it } from "vitest";
import { Box3, Scene, Vector3 } from "three";
import { createGameStore, gameStore, parseSave, SAVE_VERSION } from "../src/store/gameStore";
import { DUNGEONS } from "../src/game/dungeons/definitions";
import { hasSidon } from "../src/game/companions/definitions";
import { SidonCompanion } from "../src/game/companions/SidonCompanion";
import { TulinCompanion } from "../src/game/companions/TulinCompanion";
import { YunoboCompanion } from "../src/game/companions/YunoboCompanion";
import { WaterArea } from "../src/game/WaterArea";
import { CollisionSystem } from "../src/game/CollisionSystem";
import { disposeTree } from "../src/game/Area";
import { InteractionSystem } from "../src/game/InteractionSystem";
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

afterEach(() => { gameStore.debugEndSession(); gameStore.reset(); });

it("waits beside the temple, keeps the head fin attached and starts following after the reward", () => {
  enterWater(gameStore);
  const area = new WaterArea(), sidon = new SidonCompanion();
  const position = new Vector3(0, 0, 14);
  try {
    sidon.reset(position, area);
    expect(sidon.root.visible).toBe(true);
    const waiting = sidon.root.position.clone();
    expect(waiting.x).toBeLessThan(5);
    expect(waiting.z).toBeGreaterThan(7.4);
    expect(area.collision.free(waiting.x, waiting.z)).toBe(true);
    position.z -= 3; sidon.update(2, position, area);
    expect(sidon.root.position).toEqual(waiting);
    expect(gameStore.getState().overlay).toBeNull();
    const fin = sidon.root.getObjectByName("sidon-head-fin")!;
    // Its world bounds stay close to the head rather than floating behind the body.
    sidon.root.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(fin);
    expect(bounds.max.z).toBeGreaterThan(waiting.z - 0.2);
    expect(bounds.min.z).toBeGreaterThan(waiting.z - 0.6);
    solveTemple(gameStore, "water"); sidon.update(1, position, area);
    expect(gameStore.getState().overlay).toBe("sidon");
    expect(sidon.root.position.distanceTo(position)).toBeLessThan(2.1);
  } finally { area.dispose(); disposeTree(sidon.root); }
});

it("requires Sidon's nearby gate interaction, pauses the opening, saves it once and restores it", () => {
  enterWater(gameStore);
  const area = new WaterArea(), sidon = new SidonCompanion();
  const interaction = new InteractionSystem(new Scene());
  const position = new Vector3(0, 0, 1.5);
  const open = () => { gameStore.setTarget({ kind: "sidonGate", label: "Öppna porten" }); gameStore.interact(); };
  try {
    open(); expect(gameStore.getState().sidon.gateOpened).toBe(false);
    solveTemple(gameStore, "water"); gameStore.greetSidon(); gameStore.close();
    area.update(5, 5);
    expect(area.collision.free(0, 0)).toBe(false);
    expect(area.passages(gameStore.getState()).some(p => p.destination?.world === "desert")).toBe(false);
    gameStore.travelTo({ world: "desert" }); expect(gameStore.getState().location?.world).toBe("water");
    interaction.update(new Vector3(0, 0, 5), area, 0);
    expect(gameStore.getState().target).toBeNull();
    sidon.reset(position, area);
    interaction.update(position, area, 0);
    expect(gameStore.getState().target).toMatchObject({ kind: "sidonGate" });
    gameStore.pause(); open(); expect(gameStore.getState().sidon.gateOpened).toBe(false);
    gameStore.close(); open();
    const rupees = gameStore.getState().rupees;
    expect(gameStore.getState().sidon.gateOpened).toBe(true);
    sidon.update(0.5, position, area); area.update(0.5, 5.5);
    const effect = sidon.root.getObjectByName("sidon-gate-water")!;
    expect(effect.visible).toBe(true);
    expect(area.collision.free(0, 0)).toBe(false);
    gameStore.pause();
    const pose = sidon.root.position.clone();
    sidon.update(4, position, area); area.update(4, 9.5);
    expect(sidon.root.position).toEqual(pose);
    expect(area.collision.free(0, 0)).toBe(false);
    gameStore.close(); sidon.update(2, position, area); area.update(2, 11.5);
    expect(effect.visible).toBe(false);
    expect(area.collision.free(0, 0)).toBe(true);
    open(); expect(gameStore.getState().rupees).toBe(rupees);
    expect(area.interactions(gameStore.getState()).some(i => typeof i.target === "object" && i.target?.kind === "sidonGate")).toBe(false);
    const returned = new WaterArea();
    expect(returned.collision.free(0, 0)).toBe(true); returned.dispose();
    gameStore.travelTo({ world: "desert" }); expect(gameStore.getState().location?.world).toBe("desert");
  } finally { area.dispose(); disposeTree(sidon.root); disposeTree(interaction.ring); disposeTree(interaction.arrow); }
});

it("persists the new closed gate until interaction, including when saving is unavailable", () => {
  let raw = "";
  const storage = { getItem: () => raw, setItem: (_key: string, value: string) => { raw = value; } };
  const s = createGameStore(storage);
  enterWater(s); solveTemple(s, "water");
  expect(createGameStore(storage).getState().sidon.gateOpened).toBe(false);
  s.setTarget({ kind: "sidonGate", label: "Öppna porten" }); s.interact();
  expect(createGameStore(storage).getState().sidon.gateOpened).toBe(true);
  const opened = raw;
  s.setTarget({ kind: "sidonGate", label: "Öppna porten" }); s.interact();
  expect(raw).toBe(opened);
  const unavailable = createGameStore({ getItem: () => opened, setItem: () => { throw Error(); } });
  unavailable.greetSidon(); unavailable.close();
  expect(unavailable.getState().sidon.gateOpened).toBe(true);
  expect(unavailable.getState().savingAvailable).toBe(false);
});

it("unlocks Sidon only from the water treasure, greets once, and preserves older saves", () => {
  let raw = "";
  const storage = { getItem: () => raw, setItem: (_key: string, value: string) => { raw = value; } };
  const s = createGameStore(storage);
  s.greetSidon(); expect(s.getState().overlay).toBeNull();
  solveTemple(s, "moss"); s.greetTulin(); s.close();
  enterWater(s); s.greetYunobo(); s.close();
  expect(hasSidon(s.getState().dungeons)).toBe(false);
  s.greetSidon(); expect(s.getState().overlay).toBeNull();
  solveTemple(s, "water");
  expect(hasSidon(s.getState().dungeons)).toBe(true);
  const before = parseSave(raw), legacy = JSON.parse(raw);
  delete legacy.sidon;
  expect(SAVE_VERSION).toBe(20);
  expect(parseSave(JSON.stringify(legacy))).toEqual({ ...before, sidon: { greeted: false, gateOpened: true } });
  expect(parseSave(JSON.stringify({ ...legacy, sidon: { greeted: true } }))).toEqual({ ...before, sidon: { greeted: true, gateOpened: true } });
  for (const sidon of [null, "yes", { greeted: 1 }])
    expect(parseSave(JSON.stringify({ ...legacy, sidon }))).toEqual({ ...before, sidon: { greeted: false, gateOpened: true } });
  raw = JSON.stringify(legacy);
  const restored = createGameStore(storage);
  restored.pause(); restored.greetSidon();
  expect(restored.getState().overlay).toBe("pause");
  restored.close(); restored.greetSidon();
  expect(restored.getState().overlay).toBe("sidon");
  restored.close(); restored.greetSidon();
  expect(restored.getState().overlay).toBeNull();
  expect(createGameStore(storage).getState().sidon.greeted).toBe(true);
  expect(parseSave(raw)).toEqual({ ...before, sidon: { greeted: true, gateOpened: true } });
  restored.travelTo({ world: "desert" });
  expect(hasSidon(restored.getState().dungeons)).toBe(true);
});

it("keeps the greeting playable without storage and restores Sidon on exiting debug", () => {
  const s = createGameStore({ getItem: () => null, setItem: () => { throw Error("blocked"); } });
  enterWater(s); solveTemple(s, "water"); s.greetSidon(); s.close();
  expect(s.getState().sidon.greeted).toBe(true);
  expect(s.getState().savingAvailable).toBe(false);
  s.reset(); expect(hasSidon(s.getState().dungeons)).toBe(false);
  const debug = createGameStore();
  debug.openDebug(); debug.debugTravelTo({ world: "desert" }); debug.closeDebug();
  debug.greetSidon(); debug.close();
  expect(debug.getState().sidon.greeted).toBe(true);
  debug.debugEndSession();
  expect(debug.getState().sidon.greeted).toBe(false);
  expect(hasSidon(debug.getState().dungeons)).toBe(false);
});

it("walks smoothly with moving legs behind both friends, freezes on pause, and rejoins on travel", () => {
  solveTemple(gameStore, "moss"); enterWater(gameStore); solveTemple(gameStore, "water");
  const area = new WaterArea();
  area.collision = new CollisionSystem(100, 100);
  const sidon = new SidonCompanion(), tulin = new TulinCompanion(), yunobo = new YunoboCompanion();
  const position = new Vector3();
  const update = (dt: number) => {
    tulin.update(dt, position, area); yunobo.update(dt, position, area); sidon.update(dt, position, area);
  };
  try {
    for (const friend of [tulin, yunobo, sidon]) friend.reset(position, area);
    update(1); expect(gameStore.getState().overlay).toBe("tulin"); gameStore.close();
    update(1); expect(gameStore.getState().overlay).toBe("yunobo"); gameStore.close();
    update(1); expect(gameStore.getState().overlay).toBe("sidon"); gameStore.close();
    const leg = sidon.root.getObjectByName("sidon-left-leg")!;
    let minLeg = Infinity, maxLeg = -Infinity;
    for (let i = 0; i < 420; i++) {
      position.z -= 2 / 60;
      const before = sidon.root.position.clone(); update(1 / 60);
      if (i > 300) {
        const speed = sidon.root.position.distanceTo(before) * 60;
        expect(speed).toBeGreaterThan(1.8); expect(speed).toBeLessThan(2.2);
        expect(sidon.root.position.distanceTo(tulin.root.position)).toBeGreaterThan(0.9);
        expect(sidon.root.position.distanceTo(yunobo.root.position)).toBeGreaterThan(1.9);
        minLeg = Math.min(minLeg, leg.rotation.x); maxLeg = Math.max(maxLeg, leg.rotation.x);
      }
    }
    expect(minLeg).toBeLessThan(-0.3); expect(maxLeg).toBeGreaterThan(0.3);
    gameStore.pause();
    const stopped = sidon.root.position.clone(), angle = leg.rotation.x;
    update(3); expect(sidon.root.position).toEqual(stopped); expect(leg.rotation.x).toBe(angle);
    gameStore.close(); sidon.update(0.1, position, area, true);
    expect(sidon.root.visible).toBe(false);
    sidon.reset(new Vector3(0, 0, 20), area);
    expect(sidon.root.visible).toBe(true);
    expect(sidon.root.position.distanceTo(new Vector3(0, 0, 20))).toBeLessThan(2.1);
    gameStore.reset(); update(0.1); expect(sidon.root.visible).toBe(false);
  } finally {
    [sidon, tulin, yunobo].forEach(friend => disposeTree(friend.root)); area.dispose();
  }
});
