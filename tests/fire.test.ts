import { defeatGiant } from "./helpers/volcano";
import { VolcanoInteriorArea } from "../src/game/VolcanoInteriorArea";
import { afterEach, describe, expect, it } from "vitest";
import { Box3, Mesh, Scene, Vector3 } from "three";
import { createGameStore, gameStore, parseSave } from "../src/store/gameStore";
import {
  DUNGEONS,
  pushedPosition,
  roomSolved,
} from "../src/game/dungeons/definitions";
import { DungeonArea } from "../src/game/dungeons/DungeonArea";
import { World } from "../src/game/World";
import { Player } from "../src/game/Player";
import { disposeTree } from "../src/game/Area";
import { InteractionSystem } from "../src/game/InteractionSystem";
import type { Input } from "../src/game/Input";
import type { CollisionSystem } from "../src/game/CollisionSystem";

const fire = DUNGEONS.find((d) => d.id === "fire")!;
type Store = ReturnType<typeof createGameStore>;
const travel = (s: Store, room: string | null) =>
  s.travelTo(room ? { dungeon: "fire", room } : { world: "volcano-interior" });
function unlock(s: Store) {
  s.grantItems(["temple-sword", "temple-shield"]);
  s.equipItem("temple-shield", "shield");
  s.setTarget("bokoblin");
  s.interact();
  s.travelTo({ world: "volcano" });
  defeatGiant(s);
  s.travelTo({ world: "volcano-interior" });
}
function quiz(s: Store, id: string) {
  s.setTarget({ kind: "challenge", id, label: "Räkna" });
  s.interact();
  while (s.getState().question) {
    s.answer(s.getState().question!.correctAnswer);
    s.finishQuiz();
  }
}
function enterStones(s: Store) {
  unlock(s);
  travel(s, "light");
  quiz(s, "fire-light-lock");
  travel(s, "stones");
}
function solveStones(s: Store) {
  fire.rooms[1].stones!.forEach((stone, index) => {
    while (s.getState().dungeons.fire.stones.stones[index] < stone.goal) {
      expect(s.pushStone(index, 1)).toBe(true);
      s.finishMotion();
    }
  });
}
function memory() {
  let raw = "";
  return {
    getItem: () => raw,
    setItem: (_key: string, value: string) => {
      raw = value;
    },
  };
}
// Plan walking routes with extra clearance, then traverse them with the actual player.
function walk(
  player: Player,
  collision: CollisionSystem,
  x: number,
  z: number,
) {
  const key = (x: number, z: number) => `${x},${z}`;
  const start = [
    Math.round(player.position.x * 5),
    Math.round(player.position.z * 5),
  ];
  const goal = [Math.round(x * 5), Math.round(z * 5)];
  const queue = [start],
    previous = new Map<string, number[] | null>([
      [key(...(start as [number, number])), null],
    ]);
  for (let i = 0; i < queue.length; i++) {
    const [cx, cz] = queue[i];
    if (cx === goal[0] && cz === goal[1]) break;
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = cx + dx,
        nz = cz + dz,
        id = key(nx, nz);
      if (previous.has(id) || !collision.free(nx / 5, nz / 5, 0.45)) continue;
      previous.set(id, [cx, cz]);
      queue.push([nx, nz]);
    }
  }
  expect(
    previous.has(key(goal[0], goal[1])),
    `walkable approach ${x},${z}`,
  ).toBe(true);
  const route = [goal];
  for (
    let p = previous.get(key(goal[0], goal[1]));
    p;
    p = previous.get(key(p[0], p[1]))
  )
    route.push(p);
  for (const [px, pz] of route.reverse()) {
    let steps = 0;
    while (
      Math.hypot(player.position.x - px / 5, player.position.z - pz / 5) >
        0.025 &&
      steps++ < 100
    ) {
      const dx = px / 5 - player.position.x,
        dz = pz / 5 - player.position.z;
      const length = Math.hypot(dx, dz);
      player.update(
        Math.min(1 / 60, length / 3.5),
        { direction: () => ({ x: dx / length, y: dz / length }) } as Input,
        collision,
        true,
      );
    }
    expect(steps).toBeLessThan(100);
  }
}
afterEach(() => gameStore.reset());

describe("Eldtemplet", () => {
  it("moves the entrance out of the glade and requires the giant on reload", () => {
    const storage = memory(), s = createGameStore(storage);
    travel(s, "light");
    expect(s.getState().location).toBeNull();
    const world = new World();
    expect(world.passages().some((p) => p.destination?.dungeon === "fire")).toBe(false);
    expect(world.root.getObjectByName("fire-entrance")).toBeUndefined();
    world.dispose();
    enterStones(s);
    expect(parseSave(storage.getItem()).location?.room).toBe("stones");
    const bad = JSON.parse(storage.getItem()); bad.minibosses.stone_giant = 2;
    expect(parseSave(JSON.stringify(bad)).location).toBeNull();
  });

  it("saves at a bend, resets only this puzzle, and grants distinct equipment once", () => {
    const storage = memory(),
      s = createGameStore(storage);
    enterStones(s);
    travel(s, "treasure");
    expect(s.getState().location?.room).toBe("stones");
    expect(s.pushStone(0, -1)).toBe(false);
    s.pushStone(0, 1);
    expect(s.pushStone(1, 1)).toBe(false);
    const restored = createGameStore(storage);
    expect(restored.getState().motion).toBeNull();
    expect(restored.getState().dungeons.fire.stones.stones).toEqual([1, 0, 0]);
    restored.resetPuzzle();
    expect(restored.getState().dungeons.fire.stones.stones).toEqual([0, 0, 0]);
    expect(restored.getState().dungeons.fire.answers["fire-light-lock"]).toBe(
      5,
    );
    expect(restored.getState().dungeons.moss.stones.stones).toEqual([2, 2, 2]);
    solveStones(restored);
    restored.resetPuzzle();
    expect(restored.getState().dungeons.fire.stones.stones).toEqual([2, 2, 3]);
    travel(restored, "treasure");
    quiz(restored, "fire-treasure-lock");
    expect(restored.getState().overlay).toBe("itemReward");
    expect(restored.getState().equipment).toMatchObject({
      weapon: "fire-sword",
      shield: "temple-shield",
    });
    const saved = createGameStore(storage);
    expect(saved.getState().items).toEqual(
      expect.arrayContaining([
        "green-clothes",
        "base-hat",
        "temple-sword",
        "temple-shield",
        "fire-sword",
      ]),
    );
    expect(new Set(saved.getState().items).size).toBe(5);
    expect(saved.getState().rupees).toBe(5);
    saved.equipItem("temple-sword", "weapon");
    saved.equipItem("temple-shield", "shield");
    expect(saved.getState().equipment).toMatchObject({
      weapon: "temple-sword",
      shield: "temple-shield",
    });
    saved.equipItem("fire-sword", "weapon");
    expect(saved.getState().items).not.toContain("fire-shield");
    travel(saved, null);
    travel(saved, "light");
    travel(saved, "stones");
    travel(saved, "treasure");
    quiz(saved, "fire-treasure-lock");
    expect(saved.getState().question).toBeNull();
    expect(saved.getState().rupees).toBe(5);
    expect(saved.getState().items).toEqual(
      expect.arrayContaining([
        "green-clothes",
        "base-hat",
        "temple-sword",
        "temple-shield",
        "fire-sword",
      ]),
    );
    expect(new Set(saved.getState().items).size).toBe(5);
    expect(saved.getState().bridgeUnlocked).toBe(true);
    expect(pushedPosition(2, 1, 3)).toBeNull();
    saved.reset();
    expect(createGameStore(storage).getState().items).toEqual([
      "green-clothes",
      "base-hat",
    ]);
  });

  it("walks to all seven pushes, turns corners, keeps vertical motion solid, and exits", () => {
    enterStones(gameStore);
    const room = new DungeonArea(fire, fire.rooms[1]);
    const player = new Player();
    player.position.set(0, 0, 4.7);
    const interactions = new InteractionSystem(new Scene());
    let pushes = 0;
    for (const [index, stone] of fire.rooms[1].stones!.entries()) {
      for (let slot = 0; slot < stone.goal; slot++) {
        const from = stone.points[slot],
          to = stone.points[slot + 1];
        const dx = Math.sign(to.x - from.x),
          dz = Math.sign(to.z - from.z);
        walk(player, room.collision, from.x - dx, from.z - dz);
        const hint = room.pushHint(gameStore.getState(), player.position);
        expect(hint).toMatchObject({ index, direction: 1, dx, dz });
        expect(room.tryPush(player.position, dx * 0.02, dz * 0.02)).toBe(false);
        expect(room.tryPush(player.position, -dx, -dz)).toBe(false);
        expect(room.tryPush(player.position, 0.25, 0.25)).toBe(false);
        let steps = 0;
        while (!gameStore.getState().motion && steps++ < 30) {
          player.update(
            1 / 60,
            { direction: () => ({ x: dx, y: dz }) } as Input,
            room.collision,
            true,
            (p, x, z) => room.tryPush(p, x, z),
          );
        }
        expect(gameStore.getState().motion).toMatchObject({
          index,
          from: slot,
          to: slot + 1,
        });
        room.update(0.1, 0);
        expect(
          room.collision.free((from.x + to.x) / 2, (from.z + to.z) / 2),
        ).toBe(false);
        expect(room.collision.free(to.x, to.z)).toBe(false);
        gameStore.pause();
        room.update(1, 0);
        expect(gameStore.getState().motion).not.toBeNull();
        gameStore.close();
        room.update(0.2, 0);
        room.update(0, 0);
        expect(gameStore.getState().motion).toBeNull();
        pushes++;
      }
    }
    expect(pushes).toBe(7);
    expect(roomSolved(fire.rooms[1], gameStore.getState().dungeons.fire)).toBe(
      true,
    );
    walk(player, room.collision, 0, -5.2);
    interactions.update(player.position, room, 0);
    expect(gameStore.getState().location?.room).toBe("treasure");
    room.dispose();
    const treasure = new DungeonArea(fire, fire.rooms[2]);
    player.position.set(0, 0, 4.7);
    walk(player, treasure.collision, 0, -1.2);
    interactions.update(player.position, treasure, 0);
    expect(gameStore.getState().target).toMatchObject({
      id: "fire-treasure-lock",
    });
    quiz(gameStore, "fire-treasure-lock");
    gameStore.close();
    treasure.update(0, 0);
    walk(player, treasure.collision, -5.2, 0);
    interactions.update(player.position, treasure, 0);
    expect(gameStore.getState().location).toEqual({ world: "volcano-interior" });
    treasure.dispose();
    disposeTree(player.root);
  });

  it("allows reversing at corners and rotates the direction arrow along z", () => {
    enterStones(gameStore);
    gameStore.pushStone(0, 1);
    gameStore.finishMotion();
    const room = new DungeonArea(fire, fire.rooms[1]);
    expect(
      room.pushHint(gameStore.getState(), new Vector3(-0.6, 0, -3.2)),
    ).toMatchObject({ direction: -1, dx: -1, dz: 0 });
    const interactions = new InteractionSystem(new Scene());
    interactions.update(new Vector3(-1.6, 0, -4.2), room, 0);
    expect(interactions.arrow.rotation.y).toBeCloseTo(-Math.PI / 2);
    gameStore.pushStone(0, 1);
    gameStore.finishMotion();
    room.update(0, 0);
    expect(
      room.pushHint(gameStore.getState(), new Vector3(-1.6, 0, -0.6)),
    ).toMatchObject({ direction: -1, dx: 0, dz: -1 });
    expect(gameStore.pushStone(0, -1)).toBe(true);
    room.dispose();
  });

  it("keeps lava and flames outside the playable center and switches equipment models", () => {
    for (const definition of fire.rooms) {
      const area = new DungeonArea(fire, definition);
      const decoration = area.root.getObjectByName("fire-decoration")!;
      expect(decoration).toBeDefined();
      decoration.updateWorldMatrix(true, true);
      decoration.traverse((object) => {
        if (!(object instanceof Mesh)) return;
        const b = new Box3().setFromObject(object);
        expect(
          b.max.x < -4.6 || b.min.x > 4.6 || b.max.z < -4.6 || b.min.z > 4.6,
        ).toBe(true);
        // Edge fissures and wider channels must leave the side doorway clear.
        if (definition.id !== "stones" && b.min.x < -4.6)
          expect(b.max.z < -1.25 || b.min.z > 1.25).toBe(true);
      });
      expect(area.collision.free(0, 4.7)).toBe(true);
      area.dispose();
    }
    const player = new Player();
    for (const theme of ["fire", "temple"] as const) {
      player.setEquipment({
        head: null,
        body: "green-clothes",
        weapon: `${theme}-sword`,
        shield: `${theme}-shield`,
      });
      expect(player.root.getObjectByName("fire-sword")!.visible).toBe(
        theme === "fire",
      );
      expect(player.root.getObjectByName("fire-shield")!.visible).toBe(
        theme === "fire",
      );
      expect(player.root.getObjectByName("sword")!.visible).toBe(
        theme === "temple",
      );
      expect(player.root.getObjectByName("shield")!.visible).toBe(
        theme === "temple",
      );
    }
    disposeTree(player.root);
  });
});


it("puts only the fire temple's hub exits on the left and keeps the final exit locked", () => {
  unlock(gameStore);
  travel(gameStore, "light");
  const first = new DungeonArea(fire, fire.rooms[0]);
  const interaction = new InteractionSystem(new Scene());
  try {
    expect(first.spawn).toEqual({ x: -3.95, z: 0 });
    expect(first.collision.free(first.spawn.x, first.spawn.z)).toBe(true);
    expect(first.passages(gameStore.getState())[0]).toMatchObject({
      x: -5.35, z: 0, rotation: Math.PI / 2, destination: { world: "volcano-interior" },
    });
    expect(first.collision.free(0, 5.65)).toBe(false);
    interaction.update(new Vector3(first.spawn.x, 0, first.spawn.z), first, 0);
    expect(gameStore.getState().location?.room).toBe("light");
    for (let x = -3.95; x >= -5.35; x -= 0.05) expect(first.collision.free(x, 0)).toBe(true);
    interaction.update(new Vector3(-5.35, 0, 0), first, 0);
    expect(gameStore.getState().location).toEqual({ world: "volcano-interior" });
  } finally {
    first.dispose(); disposeTree(interaction.ring); disposeTree(interaction.arrow);
  }
  const last = new DungeonArea(fire, fire.rooms[2]);
  try {
    expect(last.spawn).toEqual({ x: 0, z: 4.7 });
    expect(last.collision.free(-5.35, 0)).toBe(false);
    expect(last.collision.free(0, -5.65)).toBe(false);
    expect(last.passages(gameStore.getState())).toEqual([
      expect.objectContaining({ x: 0, z: 5.35, destination: { dungeon: "fire", room: "stones" } }),
    ]);
    expect(last.root.getObjectByName("room-forward-door")!.rotation.y).toBeCloseTo(Math.PI / 2);
  } finally { last.dispose(); }
});
