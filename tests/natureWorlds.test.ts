import { seabed } from "../src/game/water/scenery";
import {
  Mesh,
  MeshStandardMaterial,
  Box3,
  Group,
  Raycaster,
  Vector3,
  Vector2,
  Scene,
  PerspectiveCamera,
} from "three";
import {
  InteractionSystem,
  pickInteraction,
} from "../src/game/InteractionSystem";
import { afterEach, expect, it } from "vitest";
import { createGameStore, gameStore, parseSave } from "../src/store/gameStore";
import { DUNGEONS, natureRestored } from "../src/game/dungeons/definitions";
import { VolcanoArea } from "../src/game/VolcanoArea";
import { WaterArea } from "../src/game/WaterArea";
import { DesertArea } from "../src/game/DesertArea";
import { VolcanoInteriorArea } from "../src/game/VolcanoInteriorArea";
import { DungeonArea } from "../src/game/dungeons/DungeonArea";
import { NATURE_RUPEES, natureArrival } from "../src/game/nature/layout";
import { completeRabbitQuest } from "./helpers/rabbits";
import { defeatGiant } from "./helpers/volcano";
import { heroModel, applyEquipment } from "../src/game/heroModel";
import { disposeTree } from "../src/game/Area";

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
  s.travelTo({ world: temple.entranceWorld! });
}
function enterWater(s: Store) {
  completeRabbitQuest(s);
  s.travelTo({ world: "volcano" });
  defeatGiant(s);
  s.travelTo({ world: "volcano-interior" });
  solveTemple(s, "fire");
  s.travelTo({ world: "water" });
}
afterEach(() => gameStore.reset());

it("enforces the full world chain and both temple return routes without duplicate rewards", () => {
  const s = createGameStore({ getItem: () => null, setItem: () => {} });
  s.travelTo({ world: "water" });
  expect(s.getState().location).toBeNull();
  completeRabbitQuest(s);
  s.travelTo({ world: "volcano" });
  defeatGiant(s);
  s.travelTo({ world: "volcano-interior" });
  s.travelTo({ world: "water" });
  expect(s.getState().location?.world).toBe("volcano-interior");
  solveTemple(s, "fire");
  s.travelTo({ world: "water" });
  s.travelTo({ world: "desert" });
  expect(s.getState().location?.world).toBe("water");
  s.travelTo({ dungeon: "desert", room: "light" });
  expect(s.getState().location?.world).toBe("water");
  s.travelTo({ dungeon: "water", room: "treasure" });
  expect(s.getState().location?.world).toBe("water");
  s.travelTo({ dungeon: "water", room: "light" });
  s.travelTo({ world: "water" });
  expect(s.getState().location?.world).toBe("water");
  solveTemple(s, "water");
  expect(natureRestored(s.getState().dungeons, "water")).toBe(true);
  expect(s.getState().equipment.shield).toBe("water-shield");
  s.travelTo({ world: "desert" });
  expect(s.getState().location?.world).toBe("desert");
  solveTemple(s, "desert");
  expect(s.getState().equipment.head).toBe("sun-hat");
  const earned = s.getState().rupees;
  solveTemple(s, "desert");
  expect(s.getState().rupees).toBe(earned);
  s.travelTo({ world: "water" });
  s.travelTo({ world: "volcano-interior" });
  expect(s.getState().location?.world).toBe("volcano-interior");
});

it("keeps the reef solid, paths accessible, and shell travel closed until its animation completes", () => {
  enterWater(gameStore);
  const area = new WaterArea();
  expect(area.collision.free(4, 14)).toBe(true);
  expect(area.collision.free(-6, 8)).toBe(false);
  expect(area.collision.free(0, 0)).toBe(false);
  expect(
    area
      .passages(gameStore.getState())
      .some((p) => p.destination?.world === "desert"),
  ).toBe(false);
  for (let z = 20.6; z >= 5.4; z -= 0.1)
    expect(area.collision.free(0, z), `path z=${z}`).toBe(true);
  for (let x = 0; x <= 5; x += 0.1)
    expect(area.collision.free(x, 7.4)).toBe(true);
  solveTemple(gameStore, "water");
  area.update(0.5, 0.5);
  expect(area.collision.free(0, 0)).toBe(false);
  area.update(2, 2);
  expect(area.collision.free(0, 0)).toBe(true);
  expect(area.root.getObjectByName("ellas-coral-garden")!.visible).toBe(true);
  expect(
    area
      .passages(gameStore.getState())
      .some((p) => p.destination?.world === "desert"),
  ).toBe(true);
  const reload = new WaterArea();
  expect(reload.collision.free(0, 0)).toBe(true);
  for (const previous of [
    { world: "desert" },
    { dungeon: "water", room: "treasure" },
    { world: "volcano-interior" },
  ] as const) {
    const spawn = natureArrival({ world: "water" }, previous)!;
    expect(reload.collision.free(spawn.x, spawn.z)).toBe(true);
    expect(
      reload
        .passages(gameStore.getState())
        .every((p) => Math.hypot(p.x - spawn.x, p.z - spawn.z) > 1),
    ).toBe(true);
  }
  const hub = new VolcanoInteriorArea();
  const back = natureArrival(
    { world: "volcano-interior" },
    { world: "water" },
  )!;
  expect(hub.collision.free(back.x, back.z)).toBe(true);
  expect(hub.passages().some((p) => p.destination?.world === "water")).toBe(
    true,
  );
  area.dispose();
  reload.dispose();
  hub.dispose();
});

it("saves new worlds, temple progress, equipment and pickups and rejects skipped prerequisites", () => {
  let raw = "";
  const s = createGameStore({
    getItem: () => raw,
    setItem: (_k, value) => {
      raw = value;
    },
  });
  enterWater(s);
  s.collect("water-path-1");
  s.collect("water-path-1");
  s.collect("desert-path-1");
  expect(
    s.getState().collected.filter((id) => id === "water-path-1"),
  ).toHaveLength(1);
  expect(s.getState().collected).not.toContain("desert-path-1");
  expect(parseSave(raw).location).toEqual({ world: "water" });
  s.travelTo({ dungeon: "water", room: "light" });
  s.setTarget({ kind: "challenge", id: "water-light-lock", label: "Öppna" });
  s.interact();
  s.answer(s.getState().question!.correctAnswer);
  s.finishQuiz();
  expect(parseSave(raw).dungeons.water.answers["water-light-lock"]).toBe(1);
  s.close();
  s.travelTo({ world: "water" });
  solveTemple(s, "water");
  s.travelTo({ world: "desert" });
  solveTemple(s, "desert");
  expect(parseSave(raw).location).toEqual({ world: "desert" });
  expect(parseSave(raw).equipment.head).toBe("sun-hat");
  const invalid = JSON.parse(raw);
  invalid.dungeons.water.rewards = [];
  invalid.dungeons.water.answers["water-treasure-lock"] = 0;
  expect(parseSave(JSON.stringify(invalid)).location).toBeNull();
  const old = JSON.parse(raw);
  old.version = 19;
  expect(parseSave(JSON.stringify(old)).location).toBeNull();
  const unavailable = createGameStore({
    getItem() {
      throw Error();
    },
    setItem() {
      throw Error();
    },
  });
  enterWater(unavailable);
  expect(unavailable.getState().location?.world).toBe("water");
});

it("offers animal dialogue, replayable reactions, separate chests and a restored oasis", () => {
  enterWater(gameStore);
  const water = new WaterArea();
  gameStore.setTarget({ kind: "worldObject", id: "ella", label: "Prata" });
  gameStore.interact();
  expect(gameStore.getState().overlay).toBe("elephant");
  gameStore.close();
  gameStore.setTarget({ kind: "chest", id: "water-01", label: "Öppna" });
  gameStore.interact();
  gameStore.beginQuiz();
  gameStore.answer(-1);
  expect(gameStore.getState().quizCorrectAnswers).toBe(0);
  gameStore.replaceQuestion();
  gameStore.close();
  gameStore.setTarget({ kind: "chest", id: "water-01", label: "Öppna" });
  gameStore.interact();
  gameStore.beginQuiz();
  expect(gameStore.getState().quizCorrectAnswers).toBe(0);
  for (let i = 0; i < 3; i++) {
    gameStore.answer(gameStore.getState().question!.correctAnswer);
    gameStore.finishQuiz();
  }
  gameStore.close();
  expect(gameStore.getState().chests["water-01"]).toBe(true);
  expect(gameStore.getState().chests["desert-01"]).toBe(false);
  solveTemple(gameStore, "water");
  gameStore.travelTo({ world: "desert" });
  const desert = new DesertArea();
  expect(desert.root.getObjectByName("restored-oasis")!.visible).toBe(false);
  gameStore.setTarget({ kind: "worldObject", id: "gullan", label: "Prata" });
  gameStore.interact();
  expect(gameStore.getState().overlay).toBe("giraffe");
  gameStore.close();
  solveTemple(gameStore, "desert");
  desert.update(0, 0);
  expect(desert.root.getObjectByName("restored-oasis")!.visible).toBe(true);
  expect(NATURE_RUPEES.filter((r) => r.world === "desert")).toHaveLength(7);
  const hero = heroModel();
  applyEquipment(hero, gameStore.getState().equipment);
  expect(hero.root.getObjectByName("sun-hat")!.visible).toBe(true);
  expect(hero.root.getObjectByName("water-shield")!.visible).toBe(true);
  disposeTree(hero.root);
  water.dispose();
  desert.dispose();
});

it("new temple room geometry supports its public stone routes and exits", () => {
  for (const id of ["water", "desert"] as const) {
    const d = DUNGEONS.find((d) => d.id === id)!;
    const room = new DungeonArea(d, d.rooms[0]);
    expect(room.collision.free(room.spawn.x, room.spawn.z)).toBe(true);
    expect(room.passages(gameStore.getState())[0].destination).toEqual({
      world: id,
    });
    room.dispose();
  }
});

it("prepares new debug destinations without losing room progress or changing the real save", () => {
  let raw = "";
  const s = createGameStore({
    getItem: () => raw,
    setItem: (_k, v) => {
      raw = v;
    },
  });
  s.collect("path-1");
  const baseline = raw;
  s.openDebug();
  s.debugTravelTo({ dungeon: "desert", room: "treasure" });
  expect(s.getState().dungeons.desert.answers["desert-light-lock"]).toBe(5);
  expect(natureRestored(s.getState().dungeons, "water")).toBe(true);
  expect(s.getState().items).toContain("water-shield");
  const currency = s.getState().rupees;
  s.debugTravelTo({ world: "desert" });
  expect(s.getState().rupees).toBe(currency);
  expect(raw).toBe(baseline);
  s.debugEndSession();
  expect(s.getState().location).toBeNull();
});

it.each(["water", "desert"] as const)(
  "connects every %s interaction, pickup and passage to a clear approach",
  (world) => {
    enterWater(gameStore);
    const area = world === "water" ? new WaterArea() : new DesertArea();
    try {
      const step = 0.25,
        seen = new Set<string>(),
        queue = [{ ...area.spawn }];
      const key = (x: number, z: number) => `${x},${z}`;
      seen.add(key(area.spawn.x, area.spawn.z));
      for (let i = 0; i < queue.length; i++) {
        const p = queue[i];
        for (const [dx, dz] of [
          [step, 0],
          [-step, 0],
          [0, step],
          [0, -step],
        ]) {
          const next = { x: p.x + dx, z: p.z + dz };
          if (
            !seen.has(key(next.x, next.z)) &&
            area.collision.free(next.x, next.z)
          ) {
            seen.add(key(next.x, next.z));
            queue.push(next);
          }
        }
      }
      if (world === "desert") {
        // Flood fill must remain inside the visible canyon, not reach the
        // rectangular safety bounds beyond the rocks (even through the gate).
        expect(
          queue.every((p) => Math.abs(p.x) < 20 && p.z > -3 && p.z < 24),
        ).toBe(true);
      }
      for (const interaction of area.interactions(gameStore.getState())) {
        expect(
          queue.some(
            (p) =>
              Math.hypot(p.x - interaction.x, p.z - interaction.z) < 1.7 &&
              area.collision.visible(p, interaction),
          ),
          JSON.stringify(interaction.target),
        ).toBe(true);
      }
      for (const rupee of area.rupees)
        expect(
          queue.some(
            (p) =>
              Math.hypot(
                p.x - rupee.root.position.x,
                p.z - rupee.root.position.z,
              ) < 0.5,
          ),
          rupee.id,
        ).toBe(true);
      for (const p of area.passages(gameStore.getState()))
        expect(queue.some((q) => Math.hypot(q.x - p.x, q.z - p.z) < 0.25)).toBe(
          true,
        );
    } finally {
      area.dispose();
    }
  },
);

it("replays the anemone and clam animations without rewards and pauses restoration during dialogs", () => {
  enterWater(gameStore);
  const area = new WaterArea();
  try {
    const before = gameStore.getState().rupees;
    for (const [id, name] of [
      ["sea-anemone", "sea-anemone"],
      ["pearl-clam", "pearl-clam"],
    ] as const) {
      const object = area.root.getObjectByName(name)!;
      area.root.updateMatrixWorld(true);
      const initial = object.children.map((c) => c.matrixWorld.toArray());
      for (let round = 0; round < 2; round++) {
        gameStore.setTarget({ kind: "worldObject", id, label: "Titta" });
        gameStore.interact();
        area.update(0.7, 0.7);
        area.root.updateMatrixWorld(true);
        expect(object.children.map((c) => c.matrixWorld.toArray())).not.toEqual(
          initial,
        );
        area.update(2, 2);
      }
    }
    expect(gameStore.getState().rupees).toBe(before);
    solveTemple(gameStore, "water");
    const arriving = new WaterArea(true);
    gameStore.pause();
    arriving.update(10, 10);
    expect(arriving.collision.free(0, 0)).toBe(false);
    gameStore.close();
    arriving.update(3, 3);
    expect(arriving.collision.free(0, 0)).toBe(true);
    arriving.dispose();
  } finally {
    area.dispose();
  }
});

it("keeps the relocated volcano passage and arrival clear and the open shell leaves outside the rocks", () => {
  enterWater(gameStore);
  const area = new WaterArea();
  try {
    const entry = area
      .passages(gameStore.getState())
      .find((p) => p.destination?.world === "volcano-interior")!;
    expect(entry.rotation).toBe(Math.PI / 2);
    expect(area.collision.free(area.spawn.x, area.spawn.z)).toBe(true);
    for (let x = entry.x; x <= area.spawn.x; x += 0.1)
      expect(area.collision.free(x, entry.z)).toBe(true);
    solveTemple(gameStore, "water");
    area.update(3, 3);
    for (let z = -0.6; z <= 1.4; z += 0.1)
      expect(area.collision.free(0, z)).toBe(true);
    const gate = area.root.getObjectByName("great-shell-gate")!;
    gate.updateMatrixWorld(true);
    for (const door of gate.children.filter((c) => c.userData.side)) {
      const box = new Box3().setFromObject(door);
      for (const rock of area.collision.ellipses) {
        const nearestX = Math.max(box.min.x, Math.min(rock.x, box.max.x));
        const nearestZ = Math.max(box.min.z, Math.min(rock.z, box.max.z));
        expect(
          ((nearestX - rock.x) / rock.radiusX) ** 2 +
            ((nearestZ - rock.z) / rock.radiusZ) ** 2,
        ).toBeGreaterThan(1);
      }
    }
  } finally {
    area.dispose();
  }
});

it("renders each seabed junction as one surface without competing path layers", () => {
  const root = new Group();
  seabed(root);
  try {
    const terrain = root.getObjectByName("continuous-seabed")!;
    // Slightly off the grid diagonals, a vertical ray must hit exactly one
    // triangle even where three branches meet near the chest and temple.
    for (const [x, z] of [
      [-0.87, 18.53],
      [0.13, 6.07],
      [-0.77, 9.33],
      [0.53, 12.07],
    ]) {
      const ray = new Raycaster(new Vector3(x, 3, z), new Vector3(0, -1, 0));
      const hits = ray.intersectObjects(
        root.children.filter((c) => c.name !== "seabed-light"),
        true,
      );
      expect(hits).toHaveLength(1);
      expect(hits[0].object).toBe(terrain);
      expect(hits[0].point.y).toBeCloseTo(0.015, 3);
    }
  } finally {
    disposeTree(root);
  }
});

it("lets Ella be talked to and tapped from around her body, but not far away or through rocks", () => {
  enterWater(gameStore);
  const water = new WaterArea();
  const scene = new Scene();
  const interactions = new InteractionSystem(scene);
  const camera = new PerspectiveCamera(45, 1, 0.1, 30);
  camera.position.set(-3, 8, 8);
  camera.lookAt(-3, 0, 8);
  camera.updateMatrixWorld(true);
  water.root.updateMatrixWorld(true);
  try {
    for (const [x, z] of [
      [-3, 10.4],
      [-3, 5.6],
      [-0.8, 8],
      [-4, 8],
    ]) {
      const position = new Vector3(x, 0, z);
      expect(water.collision.free(x, z), `approach ${x}, ${z}`).toBe(true);
      interactions.update(position, water, 0);
      expect(gameStore.getState().target).toMatchObject({ id: "ella" });
      expect(
        pickInteraction(water, position, camera, new Vector2()),
      ).toMatchObject({ id: "ella" });
      gameStore.interact();
      expect(gameStore.getState().overlay).toBe("elephant");
      gameStore.close();
    }
    for (const [x, z] of [
      [0, 8],
      [-3, 11],
      [-8, 8],
    ]) {
      const position = new Vector3(x, 0, z);
      interactions.update(position, water, 0);
      expect(gameStore.getState().target).not.toMatchObject({ id: "ella" });
      expect(
        pickInteraction(water, position, camera, new Vector2()),
      ).toBeNull();
    }
    // An intervening obstacle must still prevent both ways of interacting.
    water.collision.add(-1.35, 8, 0.1, 0.5);
    const blocked = new Vector3(-0.8, 0, 8);
    interactions.update(blocked, water, 0);
    expect(gameStore.getState().target).toBeNull();
    expect(pickInteraction(water, blocked, camera, new Vector2())).toBeNull();
  } finally {
    water.dispose();
    disposeTree(scene);
  }
});

it("arrives inside the open desert shell and returns through its centre", () => {
  const area = new DesertArea();
  try {
    const state = gameStore.getState();
    const entry = area
      .passages(state)
      .find((p) => p.destination?.world === "water")!;
    const spawn = natureArrival({ world: "desert" }, { world: "water" })!;
    expect(area.spawn).toEqual(spawn);
    expect(area.root.getObjectByName("great-shell-gate")).toBeDefined();
    expect(entry.rotation).toBe(Math.PI);
    expect(Math.hypot(entry.x - spawn.x, entry.z - spawn.z)).toBeGreaterThan(1);
    const position = { ...spawn };
    area.collision.move(position, entry.x - spawn.x, entry.z - spawn.z);
    expect(position.x).toBeCloseTo(entry.x);
    expect(position.z).toBeCloseTo(entry.z);
    gameStore.openDebug();
    gameStore.debugTravelTo({ world: "desert" });
    gameStore.closeDebug();
    const interactions = new InteractionSystem(new Scene());
    interactions.update(new Vector3(spawn.x, 0, spawn.z), area, 0);
    expect(gameStore.getState().location).toEqual({ world: "desert" });
    interactions.update(new Vector3(position.x, 0, position.z), area, 0);
    expect(gameStore.getState().location).toEqual({ world: "water" });

    const temple = area
      .passages(state)
      .find((p) => p.destination?.dungeon === "desert")!;
    expect(DUNGEONS.find((d) => d.id === "desert")!.entrance).toEqual({
      x: temple.x,
      z: temple.z,
    });
    const returnPoint = natureArrival(
      { world: "desert" },
      { dungeon: "desert", room: "light" },
    )!;
    expect(area.collision.free(returnPoint.x, returnPoint.z)).toBe(true);
    area.collision.move(
      returnPoint,
      temple.x - returnPoint.x,
      temple.z - returnPoint.z,
    );
    expect(returnPoint.x).toBeCloseTo(temple.x);
    expect(returnPoint.z).toBeCloseTo(temple.z);
  } finally {
    area.dispose();
  }
});

it("lets Gullan be talked to and tapped around her body without reaching through rocks", () => {
  gameStore.openDebug();
  gameStore.debugTravelTo({ world: "desert" });
  gameStore.closeDebug();
  const desert = new DesertArea();
  const scene = new Scene();
  const interactions = new InteractionSystem(scene);
  const camera = new PerspectiveCamera(45, 1, 0.1, 30);
  camera.position.set(-4, 8, 9);
  camera.lookAt(-4, 0, 9);
  camera.updateMatrixWorld(true);
  desert.root.updateMatrixWorld(true);
  try {
    for (const [x, z] of [
      [-4, 11.4],
      [-4, 6.6],
      [-6.2, 9],
      [-3, 9],
    ]) {
      const position = new Vector3(x, 0, z);
      expect(desert.collision.free(x, z), `approach ${x}, ${z}`).toBe(true);
      interactions.update(position, desert, 0);
      expect(gameStore.getState().target).toMatchObject({ id: "gullan" });
      expect(
        pickInteraction(desert, position, camera, new Vector2()),
      ).toMatchObject({ id: "gullan" });
      gameStore.interact();
      expect(gameStore.getState().overlay).toBe("giraffe");
      gameStore.close();
    }
    for (const [x, z] of [
      [-7, 9],
      [-4, 12],
      [-4, 6],
    ]) {
      const position = new Vector3(x, 0, z);
      interactions.update(position, desert, 0);
      expect(gameStore.getState().target).not.toMatchObject({ id: "gullan" });
      expect(
        pickInteraction(desert, position, camera, new Vector2()),
      ).toBeNull();
    }
    desert.collision.add(-5.65, 9, 0.1, 0.5);
    const blocked = new Vector3(-6.2, 0, 9);
    interactions.update(blocked, desert, 0);
    expect(gameStore.getState().target).not.toMatchObject({ id: "gullan" });
    expect(pickInteraction(desert, blocked, camera, new Vector2())).toBeNull();
  } finally {
    desert.dispose();
    disposeTree(scene);
  }
});


it("changes each robot's eyes only after its own temple is completed, including on re-entry and reset", () => {
  gameStore.reset();
  const areas = [new VolcanoArea(), new WaterArea(), new DesertArea()];
  const eyeColors = (root: Group) => {
    const colors = new Set<string>();
    root.traverse((object) => {
      if (object instanceof Mesh && object.material instanceof MeshStandardMaterial &&
          object.material.name === "robot-eyes") {
        colors.add(object.material.color.getHexString());
      }
    });
    return [...colors];
  };
  const check = (colors: string[]) => {
    areas.forEach((area, i) => {
      area.update(0, 0);
      expect(eyeColors(area.root)).toEqual([colors[i]]);
    });
  };
  try {
    check(["ff3030", "ff3030", "ff3030"]);
    enterWater(gameStore);
    check(["308cff", "ff3030", "ff3030"]);
    solveTemple(gameStore, "water");
    check(["308cff", "308cff", "ff3030"]);
    gameStore.travelTo({ world: "desert" });
    solveTemple(gameStore, "desert");
    check(["308cff", "308cff", "308cff"]);
    for (const Area of [VolcanoArea, WaterArea, DesertArea]) {
      const revisited = new Area();
      try {
        expect(eyeColors(revisited.root)).toEqual(["308cff"]);
      } finally {
        revisited.dispose();
      }
    }
    gameStore.reset();
    check(["ff3030", "ff3030", "ff3030"]);
  } finally {
    areas.forEach((area) => area.dispose());
  }
});
