import { afterEach, expect, it } from "vitest";
import { createGameStore, gameStore, parseSave } from "../src/store/gameStore";
import { VolcanoArea } from "../src/game/VolcanoArea";
import { VolcanoInteriorArea } from "../src/game/VolcanoInteriorArea";
import { VOLCANO_INNER_ENTRANCE, portalSpawn } from "../src/game/volcanoPortal";
import { DUNGEONS, volcanoGateOpen } from "../src/game/dungeons/definitions";
import { defeatGiant } from "./helpers/volcano";
import { DungeonArea } from "../src/game/dungeons/DungeonArea";

afterEach(() => gameStore.reset());
it("requires the giant, opens the physical entrance, and saves the interior independently of temple rewards", () => {
  gameStore.travelTo({ world: "volcano" });
  const area = new VolcanoArea();
  area.update(0, 0);
  expect(area.passages().length).toBe(1);
  expect(area.collision.free(VOLCANO_INNER_ENTRANCE.x, VOLCANO_INNER_ENTRANCE.z)).toBe(false);
  gameStore.travelTo({ world: "volcano-interior" });
  expect(gameStore.getState().location).toEqual({ world: "volcano" });
  defeatGiant(gameStore);
  area.update(0, 0);
  expect(area.passages().length).toBe(2);
  expect(area.collision.free(VOLCANO_INNER_ENTRANCE.x, VOLCANO_INNER_ENTRANCE.z)).toBe(true);
  const spawn = portalSpawn(VOLCANO_INNER_ENTRANCE, 1);
  expect(area.collision.free(spawn.x, spawn.z)).toBe(true);
  expect(volcanoGateOpen(gameStore.getState().dungeons)).toBe(false);
  gameStore.travelTo({ world: "volcano-interior" });
  expect(gameStore.getState().location).toEqual({ world: "volcano-interior" });
  gameStore.travelTo(null);
  expect(gameStore.getState().location).toEqual({ world: "volcano-interior" });
  gameStore.travelTo({ world: "volcano" });
  expect(gameStore.getState().location).toEqual({ world: "volcano" });
  area.dispose();

  let raw = "";
  const s = createGameStore({ getItem: () => raw, setItem: (_k, v) => { raw = v; } });
  s.travelTo({ world: "volcano" }); defeatGiant(s);
  s.travelTo({ world: "volcano-interior" });
  expect(parseSave(raw).location).toEqual({ world: "volcano-interior" });
  const invalid = JSON.parse(raw); invalid.minibosses.stone_giant = 2;
  expect(parseSave(JSON.stringify(invalid)).location).toBeNull();
});
it("connects the hub paths and opens the great gate only after the temple reward", () => {
  gameStore.travelTo({ world: "volcano" }); defeatGiant(gameStore);
  gameStore.travelTo({ world: "volcano-interior" });
  const hub = new VolcanoInteriorArea();
  expect(hub.collision.free(0, -4.8)).toBe(false);
  // Walk the center aisle and the right turn with player-sized clearance.
  for (let z = 4; z >= -3.8; z -= 0.1) expect(hub.collision.free(0, z)).toBe(true);
  for (let x = 0; x <= 5.35; x += 0.1) expect(hub.collision.free(x, 0)).toBe(true);
  expect(hub.collision.free(3.95, 0)).toBe(true);
  const fire = DUNGEONS.find((d) => d.id === "fire")!;
  gameStore.travelTo({ dungeon: "fire", room: "light" });
  const room = new DungeonArea(fire, fire.rooms[0]);
  expect(room.passages(gameStore.getState())[0].destination).toEqual({ world: "volcano-interior" });
  gameStore.travelTo(null);
  expect(gameStore.getState().location?.dungeon).toBe("fire");
  gameStore.travelTo({ world: "volcano-interior" });
  expect(gameStore.getState().location?.world).toBe("volcano-interior");
  gameStore.travelTo({ dungeon: "fire", room: "light" });
  for (const definition of fire.rooms) {
    gameStore.travelTo({ dungeon: "fire", room: definition.id });
    if (definition.stones) definition.stones.forEach((stone, i) => {
      for (let n = stone.start; n < stone.goal; n++) { gameStore.pushStone(i, 1); gameStore.finishMotion(); }
    });
    if (definition.challenge) {
      gameStore.setTarget({ kind: "challenge", id: definition.challenge.id, label: "Öppna" });
      gameStore.interact();
      while (gameStore.getState().question) {
        gameStore.answer(gameStore.getState().question!.correctAnswer); gameStore.finishQuiz();
      }
    }
  }
  expect(gameStore.getState().items).toContain("fire-sword");
  expect(gameStore.getState().items).not.toContain("fire-shield");
  expect(volcanoGateOpen(gameStore.getState().dungeons)).toBe(true);
  gameStore.close(); gameStore.travelTo({ world: "volcano-interior" });
  hub.update(2, 2);
  expect(hub.collision.free(0, -4.8)).toBe(true);
  const gate = hub.root.getObjectByName("great-volcano-gate")!;
  expect(gate.visible).toBe(true);
  expect(gate.position.y).toBeCloseTo(2.6);
  hub.update(10, 12);
  expect(gate.visible).toBe(true);
  expect(gate.position.y).toBeCloseTo(2.6);
  const revisited = new VolcanoInteriorArea(); revisited.update(2, 2);
  expect(revisited.collision.free(0, -4.8)).toBe(true);
  expect(revisited.root.getObjectByName("great-volcano-gate")!.visible).toBe(true);
  expect(revisited.root.getObjectByName("great-volcano-gate")!.position.y).toBeCloseTo(2.6);
  expect(revisited.passages().length).toBe(2);
  revisited.dispose(); hub.dispose(); room.dispose();
});

it("keeps both door approaches and the full revealed corridor walkable", () => {
  const hub = new VolcanoInteriorArea();
  try {
    for (let z = 4; z <= 5.35; z += 0.05)
      expect(hub.collision.free(0, z), `return approach ${z}`).toBe(true);
    // The same floor remains traversable when the moving gate is gone.
    hub.collision.dynamic = [];
    for (let z = -3.5; z >= -8.1; z -= 0.1)
      expect(hub.collision.free(0, z), `forward corridor ${z}`).toBe(true);
    for (let x = 0; x <= 5.35; x += 0.1)
      expect(hub.collision.free(x, 0), `temple approach ${x}`).toBe(true);
    expect(hub.collision.free(0, -9)).toBe(false);
    expect(hub.root.getObjectByName("daylight-cave-exit")).toBeDefined();
  } finally { hub.dispose(); }
});
