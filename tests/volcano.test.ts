import { VOLCANO_ROCK_SECRET } from "../src/game/secrets/definitions";
import { GameCamera } from "../src/game/Camera";
import { VOLCANO_RUPEES } from "../src/game/volcanoLayout";
import { disposeTree } from "../src/game/Area";
import { afterEach, describe, expect, it } from "vitest";
import { Box3, Mesh, Scene, Vector3 } from "three";
import { createGameStore, gameStore, parseSave } from "../src/store/gameStore";
import { DUNGEONS } from "../src/game/dungeons/definitions";
import { World } from "../src/game/World";
import {
  VolcanoArea,
  VOLCANO_CLEARINGS,
  VOLCANO_CHEST_POSITION,
  VOLCANO_LAVA,
} from "../src/game/VolcanoArea";
import {
  portalSpawn,
  VOLCANO_ENTRANCE,
  VOLCANO_RETURN,
} from "../src/game/volcanoPortal";
import { gladePosition } from "../src/game/gladeLayout";
import { InteractionSystem } from "../src/game/InteractionSystem";
import type { CollisionSystem } from "../src/game/CollisionSystem";

type Store = ReturnType<typeof createGameStore>;
function quiz(s: Store, id: string) {
  s.setTarget({ kind: "challenge", id, label: "Räkna" });
  s.interact();
  while (s.getState().question) {
    s.answer(s.getState().question!.correctAnswer);
    s.finishQuiz();
  }
}
function prepareVolcano(s: Store) {
  s.grantItems(["temple-sword", "temple-shield"]);
  s.setTarget("bokoblin"); s.interact();
}
function memory() {
  let raw = "";
  return {
    getItem: () => raw,
    setItem: (_k: string, v: string) => {
      raw = v;
    },
  };
}
function reachable(
  collision: CollisionSystem,
  start: { x: number; z: number },
  goals: { x: number; z: number }[],
) {
  const queue = [[Math.round(start.x * 5), Math.round(start.z * 5)]];
  const seen = new Set([queue[0].join(",")]);
  for (let i = 0; i < queue.length; i++) {
    const [x, z] = queue[i];
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx,
        nz = z + dz,
        key = `${nx},${nz}`;
      if (!seen.has(key) && collision.free(nx / 5, nz / 5, 0.4)) {
        seen.add(key);
        queue.push([nx, nz]);
      }
    }
  }
  for (const p of goals)
    expect(
      seen.has(`${Math.round(p.x * 5)},${Math.round(p.z * 5)}`),
      `reachable ${p.x},${p.z}`,
    ).toBe(true);
}
afterEach(() => gameStore.reset());
describe("Vulkanvärlden", () => {
  it("collects every trail rupee only in the volcano and keeps them collected after reload", () => {
    const storage = memory(), s = createGameStore(storage);
    for (const { id } of VOLCANO_RUPEES) s.collect(id);
    expect(s.getState().collected).toEqual([]);
    prepareVolcano(s);
    s.close();
    s.travelTo(null);
    s.travelTo({ world: "volcano" });
    const before = s.getState().rupees;
    for (const { id } of VOLCANO_RUPEES) { s.collect(id); s.collect(id); }
    expect(s.getState().rupees).toBe(before + VOLCANO_RUPEES.length);
    const restored = createGameStore(storage);
    for (const { id } of VOLCANO_RUPEES) restored.collect(id);
    expect(restored.getState().rupees).toBe(before + VOLCANO_RUPEES.length);
    expect(restored.getState().collected).toEqual(VOLCANO_RUPEES.map(r => r.id));
  });
  it("picks up trail rupees by walking over them and hides them on revisits", () => {
    prepareVolcano(gameStore);
    gameStore.close();
    gameStore.travelTo(null);
    gameStore.travelTo({ world: "volcano" });
    const area = new VolcanoArea(), interaction = new InteractionSystem(new Scene());
    try {
      const before = gameStore.getState().rupees;
      for (const rupee of area.rupees) {
        interaction.update(rupee.root.position.clone(), area, 0);
        area.update(0, 0);
        expect(rupee.root.visible).toBe(false);
      }
      expect(gameStore.getState().rupees).toBe(before + VOLCANO_RUPEES.length);
      const returned = new VolcanoArea();
      expect(returned.rupees.every(r => !r.root.visible)).toBe(true);
      returned.dispose();
    } finally {
      area.dispose();
      disposeTree(interaction.ring);
      disposeTree(interaction.arrow);
    }
  });
  it("opens the first treasure with three picture sums, allows retries and saves only one reward", () => {
    const storage = memory(), s = createGameStore(storage);
    const target = { kind: "chest" as const, id: "volcano-01" as const, label: "Öppna" };
    s.setTarget(target);
    s.interact();
    expect(s.getState().activeChest).toBeNull();
    prepareVolcano(s);
    s.close();
    s.travelTo(null);
    s.travelTo({ world: "volcano" });
    const before = s.getState().rupees;
    const begin = () => { s.setTarget(target); s.interact(); s.beginQuiz(); };
    begin();
    s.answer(s.getState().question!.correctAnswer);
    s.finishQuiz();
    s.close();
    expect(s.getState().chests["volcano-01"]).toBe(false);
    begin();
    expect(s.getState().quizCorrectAnswers).toBe(0);
    s.answer(-1);
    expect(s.getState().feedback).toBe("retry");
    s.replaceQuestion();
    const keys = new Set<string>();
    for (let i = 0; i < 3; i++) {
      const q = s.getState().question!;
      expect(q.groups).toHaveLength(2);
      expect(q.correctAnswer).toBeLessThanOrEqual(5);
      expect(q.answerDots).toBe(true);
      expect(q.answers).toHaveLength(3);
      expect(keys.has(q.key)).toBe(false);
      keys.add(q.key);
      s.answer(q.correctAnswer);
      s.answer(q.correctAnswer);
      s.finishQuiz();
    }
    expect(s.getState().chests["volcano-01"]).toBe(true);
    expect(s.getState().rupees).toBe(before + 5);
    const restored = createGameStore(storage);
    expect(restored.getState().chests["volcano-01"]).toBe(true);
    expect(restored.getState().rupees).toBe(before + 5);
    restored.setTarget(target);
    restored.interact();
    expect(restored.getState().overlay).toBe("empty");
    restored.beginQuiz();
    expect(restored.getState().question).toBeNull();
    expect(restored.getState().rupees).toBe(before + 5);
  });
  it("makes the treasure reachable and animates it after the quiz, including on return", () => {
    prepareVolcano(gameStore);
    gameStore.close();
    gameStore.travelTo(null);
    gameStore.travelTo({ world: "volcano" });
    const area = new VolcanoArea(), interaction = new InteractionSystem(new Scene());
    try {
      const approach = { x: VOLCANO_CHEST_POSITION.x, z: VOLCANO_CHEST_POSITION.z + 1.1 };
      reachable(area.collision, area.spawn, [approach]);
      interaction.update(new Vector3(approach.x, 0, approach.z), area, 0);
      expect(gameStore.getState().target).toMatchObject({ kind: "chest", id: "volcano-01" });
      gameStore.interact();
      gameStore.beginQuiz();
      for (let i = 0; i < 3; i++) {
        gameStore.answer(gameStore.getState().question!.correctAnswer);
        area.update(1, 0);
        expect(area.chest.openAmount).toBe(0);
        gameStore.finishQuiz();
      }
      area.update(1, 0);
      expect(area.chest.openAmount).toBe(1);
      const returned = new VolcanoArea();
      expect(returned.chest.lid.rotation.x).toBeCloseTo(-1.8);
      returned.dispose();
    } finally {
      area.dispose();
      disposeTree(interaction.ring);
      disposeTree(interaction.arrow);
    }
  });
  it("is available immediately and restricts adjacency", () => {
    const storage = memory(), s = createGameStore(storage);
    s.travelTo({ world: "volcano" });
    expect(s.getState().location).toEqual({ world: "volcano" });
    const restored = createGameStore(storage);
    expect(restored.getState().location).toEqual({ world: "volcano" });
    for (const destination of [{ castle: "hall" as const }, { dungeon: "fire", room: "light" }, { world: "volcano-interior" as const }]) {
      restored.travelTo(destination);
      expect(restored.getState().location).toEqual({ world: "volcano" });
    }
    restored.travelTo(null);
    expect(restored.getState().location).toBeNull();
  });
  it("rejects a locked or malformed saved world and remains playable without storage", () => {
    const storage = memory(),
      s = createGameStore(storage);
    s.pause();
    s.close();
    s.collect("path-1");
    const saved = JSON.parse(storage.getItem());
    saved.location = { world: "volcano-interior" };
    expect(parseSave(JSON.stringify(saved)).location).toBeNull();
    prepareVolcano(s);
    const unlocked = JSON.parse(storage.getItem());
    unlocked.location = { world: "volcano", castle: "hall" };
    expect(parseSave(JSON.stringify(unlocked)).location).toBeNull();
    const broken = createGameStore({
      getItem() {
        throw Error();
      },
      setItem() {
        throw Error();
      },
    });
    prepareVolcano(broken);
    broken.close();
    broken.travelTo(null);
    broken.travelTo({ world: "volcano" });
    expect(broken.getState().location).toEqual({ world: "volcano" });
  });
  it("activates the world portal and performs both automatic passages without spawn bounce", () => {
    const world = new World(),
      volcano = new VolcanoArea(),
      interaction = new InteractionSystem(new Scene());
    try {
      expect(world.passages().some((p) => p.destination?.world)).toBe(true);
      prepareVolcano(gameStore);
      gameStore.close();
      gameStore.travelTo(null);
      world.update(0, 0);
      expect(
        world.passages().some((p) => p.destination?.world === "volcano"),
      ).toBe(true);
      interaction.update(
        new Vector3(VOLCANO_ENTRANCE.x, 0, VOLCANO_ENTRANCE.z),
        world,
        0,
      );
      expect(gameStore.getState().location).toEqual({ world: "volcano" });
      const position = new Vector3(volcano.spawn.x, 0, volcano.spawn.z);
      expect(position.z).toBeLessThan(VOLCANO_RETURN.z);
      // Continue in the direction used to enter the fire portal.
      for (let step = 0; step < 40; step++) {
        volcano.collision.move(position, 0, -0.05);
        interaction.update(position, volcano, 0);
        expect(gameStore.getState().location).toEqual({ world: "volcano" });
      }
      expect(position.z).toBeCloseTo(volcano.spawn.z - 2);
      // Only intentionally turning around and walking back through should return.
      for (let step = 0; step < 80 && gameStore.getState().location; step++) {
        volcano.collision.move(position, 0, 0.05);
        interaction.update(position, volcano, 0);
      }
      expect(gameStore.getState().location).toBeNull();
      const spawn = portalSpawn(VOLCANO_ENTRANCE, 1);
      position.set(spawn.x, 0, spawn.z);
      expect(position.z).toBeGreaterThan(VOLCANO_ENTRANCE.z);
      for (let step = 0; step < 30; step++) {
        world.collision.move(position, 0, 0.05);
        interaction.update(position, world, 0);
        expect(gameStore.getState().location).toBeNull();
      }
      expect(position.z).toBeCloseTo(spawn.z + 1.5);
    } finally {
      world.dispose();
      volcano.dispose();
      disposeTree(interaction.ring);
      disposeTree(interaction.arrow);
    }
  });
  it("connects every clearing and both portal approaches while blocking lava and edges", () => {
    const area = new VolcanoArea(),
      world = new World();
    try {
      reachable(area.collision, area.spawn, [
        VOLCANO_RETURN,
        ...VOLCANO_RUPEES,
        ...VOLCANO_CLEARINGS.map(([x, z]) => gladePosition(x, z)),
        gladePosition(8, 5),
      ]);
      reachable(world.collision, gladePosition(0, 17), [
        VOLCANO_ENTRANCE,
        portalSpawn(VOLCANO_ENTRANCE, 1),
      ]);
      for (const [x, z] of VOLCANO_LAVA) {
        const p = gladePosition(x, z);
        expect(area.collision.free(p.x, p.z)).toBe(false);
      }
      expect(area.collision.free(0, -7.8)).toBe(false);
      expect(area.collision.free(15, 0)).toBe(false);
      expect(area.rupees).toHaveLength(VOLCANO_RUPEES.length + VOLCANO_ROCK_SECRET.pickupIds.length);
      expect(area.interactions(gameStore.getState())).toHaveLength(2);
      expect(area.collision.free(VOLCANO_CHEST_POSITION.x, VOLCANO_CHEST_POSITION.z)).toBe(false);
    } finally {
      area.dispose();
      world.dispose();
    }
  });

  it("scatters burnt ground detail that never blocks the player", () => {
    const area = new VolcanoArea(), twinArea = new VolcanoArea();
    try {
      const ground = area.root.getObjectByName("volcano-ground");
      expect(ground).toBeDefined();
      expect(ground!.children.length).toBeGreaterThan(20);
      for (const detail of ground!.children)
        expect(area.collision.free(detail.position.x, detail.position.z, 0.05)).toBe(true);
      const twin = twinArea.root.getObjectByName("volcano-ground")!;
      expect(twin.children).toHaveLength(ground!.children.length);
      expect(twin.children[0].position.toArray()).toEqual(ground!.children[0].position.toArray());

      const raisedDetails: Mesh[] = [];
      ground!.traverse((object) => {
        if (object instanceof Mesh && object.name !== "volcano-ground-crack")
          raisedDetails.push(object);
      });
      expect(raisedDetails.length).toBeGreaterThan(20);
      expect(raisedDetails.every((detail) => detail.castShadow)).toBe(true);

      const pebbles = area.root.children.filter((object) => object.name === "volcano-pebble");
      expect(pebbles.length).toBeGreaterThan(10);
      expect(pebbles.every((pebble) => pebble.castShadow)).toBe(true);
    } finally {
      area.dispose();
      twinArea.dispose();
    }
  });
});


it("makes the mountain taller than its cave entrance without obstructing the approach", () => {
  const area = new VolcanoArea();
  try {
    area.root.updateWorldMatrix(true, true);
    const mountain = new Box3().setFromObject(area.root.getObjectByName("volcano")!);
    const entrance = new Box3().setFromObject(area.root.getObjectByName("volcano-cave-mouth")!);
    expect(mountain.max.y - mountain.min.y).toBeGreaterThan(3.8);
    expect(mountain.max.y).toBeGreaterThan(entrance.max.y * 1.25);
    for (let z = -3.4; z >= -4.8; z -= 0.05)
      expect(area.collision.free(0, z), `mountain approach ${z}`).toBe(true);
  } finally { area.dispose(); }
});


it("keeps the crater inside the camera view when approaching the entrance", () => {
  const area = new VolcanoArea();
  try {
    area.root.updateWorldMatrix(true, true);
    const mountain = area.root.getObjectByName("volcano")!;
    const camera = new GameCamera();
    for (const [w, h] of [[1758, 1210], [1180, 820], [820, 1180]]) {
      camera.resize(w, h);
      for (const x of [-1, 0, 1]) for (const z of [-3.4, -4.8]) {
        camera.setMode("glade", new Vector3(x, 0, z));
        camera.camera.updateMatrixWorld();
        mountain.traverse((object) => {
          if (!(object instanceof Mesh)) return;
          const positions = object.geometry.attributes.position;
          for (let i = 0; i < positions.count; i++) {
            const vertex = new Vector3().fromBufferAttribute(positions, i);
            object.localToWorld(vertex);
            // Only the summit and lava need to fit; the broad base may extend beyond portrait view.
            if (vertex.y < 3.2) continue;
            vertex.project(camera.camera);
            expect(vertex.y, `top at ${w}x${h}, player ${x},${z}`).toBeLessThan(0.98);
            expect(Math.abs(vertex.x)).toBeLessThan(0.98);
          }
        });
      }
    }
  } finally { area.dispose(); }
});

it("moves the lava rock, pauses, restores rewards, and keeps its approach accessible", () => {
  prepareVolcano(gameStore);
  gameStore.close();
  gameStore.travelTo({ world: "volcano" });
  const area = new VolcanoArea(), scene = new Scene(), interactions = new InteractionSystem(scene);
  const definition = VOLCANO_ROCK_SECRET;
  const center = new Vector3(definition.position.x, 0, definition.position.z);
  const near = center.clone().add(new Vector3(0, 0, -1.4));
  const landing = center.clone().add(new Vector3(definition.offset.x, 0, definition.offset.z));
  const pickups = () => area.rupees.filter((p) => definition.pickupIds.some((id) => id === p.id));
  const before = gameStore.getState().rupees;
  try {
    reachable(area.collision, area.spawn, [near, landing]);
    expect(area.collision.free(center.x, center.z)).toBe(false);
    expect(pickups().every((p) => !p.root.visible)).toBe(true);
    interactions.update(near, area, 0);
    expect(gameStore.getState().target).toEqual({ kind: "secret", id: definition.id, label: "Flytta" });
    gameStore.interact();
    area.update(0.6, 0, near);
    gameStore.pause();
    const paused = area.rock.stone.position.clone();
    area.update(10, 0, near);
    expect(area.rock.stone.position.equals(paused)).toBe(true);
    gameStore.close();
    area.update(0.6, 0, landing);
    expect(gameStore.getState().secrets[definition.id].revealed).toBe(true);
    expect(area.collision.free(landing.x, landing.z)).toBe(true);
    interactions.update(center, area, 0);
    expect(gameStore.getState().rupees).toBe(before + 5);
    area.update(0, 0, center);
    expect(area.collision.free(landing.x, landing.z)).toBe(false);
    expect(pickups().every((p) => !p.root.visible)).toBe(true);
    const restored = new VolcanoArea();
    expect(restored.rock.phase).toBe("revealed");
    expect(restored.rock.stone.position.x).toBe(definition.offset.x);
    expect(restored.rock.stone.position.z).toBe(definition.offset.z);
    restored.dispose();
    definition.pickupIds.forEach((id) => gameStore.collect(id));
    expect(gameStore.getState().rupees).toBe(before + 5);
    gameStore.reset();
    area.update(0, 0, near);
    expect(area.rock.phase).toBe("waiting");
    expect(pickups().every((p) => !p.root.visible)).toBe(true);
  } finally {
    area.dispose();
    disposeTree(scene);
  }
});

it("persists partial lava-rock treasure and rejects interaction in another world", () => {
  const storage = memory(), s = createGameStore(storage);
  const definition = VOLCANO_ROCK_SECRET;
  const target = { kind: "secret" as const, id: definition.id, label: "Flytta" };
  prepareVolcano(s);
  s.close();
  s.setTarget(target);
  s.interact();
  expect(s.getState().activeSecret).toBeNull();
  s.travelTo({ world: "volcano" });
  definition.pickupIds.forEach((id) => s.collect(id));
  const before = s.getState().rupees;
  s.setTarget(target);
  s.interact();
  s.revealSecret(definition.id);
  s.collect(definition.pickupIds[0]);
  const restored = createGameStore(storage);
  expect(restored.getState().secrets[definition.id]).toEqual({ discovered: true, revealed: true, completed: false });
  restored.travelTo(null);
  definition.pickupIds.forEach((id) => restored.collect(id));
  expect(restored.getState().rupees).toBe(before + 1);
  restored.travelTo({ world: "volcano" });
  definition.pickupIds.forEach((id) => { restored.collect(id); restored.collect(id); });
  expect(restored.getState().rupees).toBe(before + 5);
  expect(createGameStore(storage).getState().secrets[definition.id].completed).toBe(true);
});
