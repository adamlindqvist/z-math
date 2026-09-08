import { World } from "../src/game/World";
import { Player } from "../src/game/Player";
import type { Input } from "../src/game/Input";
import { beforeEach, describe, expect, it } from "vitest";
import { Box3, Mesh, Scene, Vector3 } from "three";
import { createGameStore, gameStore, parseSave } from "../src/store/gameStore";
import {
  DUNGEONS,
  freshDungeons,
  pushedPosition,
  TRACK_X,
} from "../src/game/dungeons/definitions";
import { DungeonArea } from "../src/game/dungeons/DungeonArea";
import { InteractionSystem } from "../src/game/InteractionSystem";
import { generateTempleQuestion } from "../src/math/questionGenerators";
import { GameCamera } from "../src/game/Camera";

type Store = ReturnType<typeof createGameStore>;
const memory = () => {
  let raw: string | null = null;
  return {
    getItem: () => raw,
    setItem: (_key: string, value: string) => {
      raw = value;
    },
  };
};
function travel(s: Store, room: string | null) {
  s.travelTo(room ? { dungeon: "moss", room } : null);
}
function quiz(s: Store, id: string) {
  s.setTarget({ kind: "challenge", id, label: "Räkna" });
  s.interact();
}
function solve(s: Store, id: string) {
  quiz(s, id);
  while (s.getState().question) {
    s.answer(s.getState().question!.correctAnswer);
    s.finishQuiz();
  }
}
function push(s: Store, index: number, direction: -1 | 1) {
  s.pushStone(index, direction);
}
function stones(s: Store) {
  for (const [index, direction] of [
    [0, -1],
    [0, -1],
    [1, 1],
    [1, 1],
    [2, -1],
  ] as const) {
    push(s, index, direction);
    s.finishMotion();
  }
}
function reachStones(s: Store) {
  travel(s, "light");
  solve(s, "light-lock");
  travel(s, "stones");
}

beforeEach(() => gameStore.reset());
describe("Vattentemplet rules and persistence", () => {
  it("keeps the saved dungeon identity with its public water theme", () => {
    expect(DUNGEONS[0]).toMatchObject({
      id: "moss",
      name: "Vattentemplet",
      theme: "water",
    });
    expect(DUNGEONS[0].rooms.map((room) => room.name)).toEqual([
      "Ljusporten",
      "Stensalen",
      "Skattkammaren",
    ]);
  });
  it("generates visible counts, positive sums at most five, and three distinct answers", () => {
    for (const kind of ["counting", "addition"] as const)
      for (let i = 0; i < 500; i++) {
        const q = generateTempleQuestion(kind);
        expect(q.groups).toHaveLength(kind === "counting" ? 1 : 2);
        expect(q.groups!.every((n) => n >= 1)).toBe(true);
        expect(q.groups!.reduce((sum, n) => sum + n, 0)).toBe(q.correctAnswer);
        expect(q.correctAnswer).toBeLessThanOrEqual(5);
        expect(q.answers).toHaveLength(3);
        expect(new Set(q.answers).size).toBe(3);
        expect(q.answers).toContain(q.correctAnswer);
        expect(q.answers.every((n) => n >= 1 && n <= 5)).toBe(true);
      }
  });
  it("enters directly, prevents skipped rooms, persists individual answers and resumes after cancellation", () => {
    const storage = memory(),
      s = createGameStore(storage);
    travel(s, "treasure");
    expect(s.getState().location).toBeNull();
    travel(s, "light");
    travel(s, "stones");
    expect(s.getState().location?.room).toBe("light");
    quiz(s, "light-lock");
    const q = s.getState().question!;
    s.answer(99);
    expect(s.getState().question).toBe(q);
    s.answer(q.correctAnswer);
    s.answer(q.correctAnswer);
    expect(s.getState().quizCorrectAnswers).toBe(1);
    const restored = createGameStore(storage);
    expect(restored.getState().location?.room).toBe("light");
    quiz(restored, "light-lock");
    expect(restored.getState().quizCorrectAnswers).toBe(1);
    restored.close();
    quiz(restored, "light-lock");
    while (restored.getState().question) {
      restored.answer(restored.getState().question!.correctAnswer);
      restored.finishQuiz();
    }
    travel(restored, "stones");
    expect(restored.getState().location?.room).toBe("stones");
  });
  it("validates both directions and end stops", () => {
    expect(pushedPosition(2, -1, 5)).toBe(1);
    expect(pushedPosition(2, 1, 5)).toBe(3);
    expect(pushedPosition(0, -1, 5)).toBeNull();
    expect(pushedPosition(4, 1, 5)).toBeNull();
    expect(pushedPosition(4, -1, 5)).toBe(3);
    expect(pushedPosition(2, 0, 5)).toBeNull();
  });
  it("saves pushes atomically, blocks overlapping pushes and resets only the unsolved puzzle", () => {
    const storage = memory(),
      s = createGameStore(storage);
    reachStones(s);
    push(s, 0, 1);
    push(s, 0, 1);
    expect(s.getState().dungeons.moss.stones.stones).toEqual([3, 2, 2]);
    const restored = createGameStore(storage);
    expect(restored.getState().dungeons.moss.stones.stones).toEqual([3, 2, 2]);
    expect(restored.getState().motion).toBeNull();
    restored.resetPuzzle();
    expect(restored.getState().dungeons.moss.stones.stones).toEqual([2, 2, 2]);
    expect(restored.getState().dungeons.moss.answers["light-lock"]).toBe(5);
    stones(restored);
    restored.resetPuzzle();
    expect(restored.getState().dungeons.moss.stones.stones).toEqual([0, 4, 1]);
  });
  it("completes the adventure, saves the reward once, allows return visits and resets all progress", () => {
    const storage = memory(),
      s = createGameStore(storage);
    reachStones(s);
    travel(s, "treasure");
    expect(s.getState().location?.room).toBe("stones");
    stones(s);
    travel(s, "treasure");
    solve(s, "treasure-lock");
    expect(s.getState().rupees).toBe(5);
    expect(s.getState().reward).toBe(5);
    const restored = createGameStore(storage);
    quiz(restored, "treasure-lock");
    expect(restored.getState().question).toBeNull();
    travel(restored, "stones");
    travel(restored, "light");
    travel(restored, null);
    travel(restored, "light");
    travel(restored, "stones");
    travel(restored, "treasure");
    quiz(restored, "treasure-lock");
    expect(restored.getState().rupees).toBe(5);
    restored.reset();
    expect(createGameStore(storage).getState()).toMatchObject({
      location: null,
      rupees: 0,
      dungeons: freshDungeons(),
    });
  });
  it("rejects malformed, impossible and older saves", () => {
    const storage = memory(),
      s = createGameStore(storage);
    reachStones(s);
    const good = JSON.parse(storage.getItem()!);
    const mutations = [
      (p: typeof good) => {
        p.version = 2;
      },
      (p: typeof good) => {
        p.location.room = "missing";
      },
      (p: typeof good) => {
        p.location.room = "treasure";
      },
      (p: typeof good) => {
        p.dungeons.moss.stones.stones = [2, 2, 9];
      },
      (p: typeof good) => {
        p.dungeons.moss.answers["light-lock"] = 1;
      },
      (p: typeof good) => {
        p.dungeons.moss.rewards = ["treasure-lock"];
      },
      (p: typeof good) => {
        p.dungeons.moss.answers.extra = 0;
      },
      (p: typeof good) => {
        p.rupees = 99;
      },
    ];
    for (const mutate of mutations) {
      const bad = structuredClone(good);
      mutate(bad);
      expect(parseSave(JSON.stringify(bad)).location).toBeNull();
    }
    expect(parseSave(storage.getItem()).location?.room).toBe("stones");
  });
  it("remains playable when reads and writes fail", () => {
    const s = createGameStore({
      getItem: () => {
        throw Error("blocked");
      },
      setItem: () => {
        throw Error("blocked");
      },
    });
    reachStones(s);
    stones(s);
    travel(s, "treasure");
    solve(s, "treasure-lock");
    expect(s.getState()).toMatchObject({ rupees: 5, savingAvailable: false });
  });
});

describe("temple world integration", () => {
  it("keeps water decorations outside the playable center in every room", () => {
    for (const definition of DUNGEONS[0].rooms) {
      const area = new DungeonArea(DUNGEONS[0], definition);
      const decoration = area.root.getObjectByName("water-decoration")!;
      expect(decoration).toBeDefined();
      decoration.updateWorldMatrix(true, true);
      decoration.traverse((object) => {
        if (!(object instanceof Mesh)) return;
        const bounds = new Box3().setFromObject(object);
        expect(
          bounds.max.x < -5.3 ||
            bounds.min.x > 5.3 ||
            bounds.max.z < -5.3 ||
            bounds.min.z > 5.3,
        ).toBe(true);
      });
      expect(area.collision.free(5.3, 0)).toBe(true);
      expect(area.collision.free(-5.3, 0)).toBe(true);
      expect(area.collision.free(0, 4.7)).toBe(true);
      area.dispose();
    }
  });

  it("only targets a stone from its sides and keeps moving stones solid", () => {
    reachStones(gameStore);
    const room = new DungeonArea(DUNGEONS[0], DUNGEONS[0].rooms[1]);
    const interactions = new InteractionSystem(new Scene());
    interactions.update(new Vector3(0, 0, -1.5), room, 0);
    expect(gameStore.getState().target).toBeNull();
    interactions.update(new Vector3(1.15, 0, -2.6), room, 0);
    expect(gameStore.getState().target).toBeNull();
    expect(
      room.pushHint(gameStore.getState(), new Vector3(1.15, 0, -2.6)),
    ).toMatchObject({ index: 0, direction: -1 });
    expect(room.tryPush(new Vector3(0.82, 0, -2.6), -0.05, 0)).toBe(true);
    room.update(0.1, 0);
    expect(room.collision.free(-0.8, -2.6)).toBe(false);
    expect(room.collision.free(-1.6, -2.6)).toBe(false);
    gameStore.pause();
    room.update(1, 0);
    expect(gameStore.getState().motion).not.toBeNull();
    gameStore.close();
    room.update(0.3, 0);
    expect(gameStore.getState().motion).toBeNull();
    room.dispose();
  });
  it("provides walkable paths around all stones and keeps the exit closed until solved", () => {
    reachStones(gameStore);
    const room = new DungeonArea(DUNGEONS[0], DUNGEONS[0].rooms[1]);
    expect(room.collision.free(0, -5.35)).toBe(false);
    const p = { ...room.spawn };
    const walk = (x: number, z: number) => {
      let count = 0;
      while (Math.hypot(x - p.x, z - p.z) > 0.08 && count++ < 500) {
        const length = Math.hypot(x - p.x, z - p.z);
        room.collision.move(
          p,
          ((x - p.x) / length) * 0.04,
          ((z - p.z) / length) * 0.04,
        );
      }
      expect(count).toBeLessThan(500);
    };
    walk(4.4, 4.7);
    walk(4.4, -3.9);
    walk(1.2, -3.9);
    walk(1.2, -2.6);
    const interactions = new InteractionSystem(new Scene());
    interactions.update(new Vector3(p.x, 0, p.z), room, 0);
    expect(
      room.pushHint(gameStore.getState(), new Vector3(p.x, 0, p.z)),
    ).toMatchObject({ index: 0 });
    stones(gameStore);
    room.update(0, 0);
    expect(room.collision.free(0, -5.35)).toBe(true);
    room.dispose();
  });
  it("blocks sight lines through walls and keeps every spawn and puzzle in view in both orientations", () => {
    reachStones(gameStore);
    const room = new DungeonArea(DUNGEONS[0], DUNGEONS[0].rooms[1]);
    expect(room.collision.free(room.spawn.x, room.spawn.z)).toBe(true);
    expect(room.collision.visible({ x: 0, z: -4.5 }, { x: 0, z: -7 })).toBe(
      false,
    );
    for (const [w, h] of [
      [820, 1180],
      [1180, 820],
    ]) {
      const camera = new GameCamera();
      camera.resize(w, h);
      camera.setMode("room", new Vector3());
      camera.camera.updateMatrixWorld();
      for (const x of [TRACK_X[0], TRACK_X[4]])
        for (const z of [-2.6, 2.6]) {
          const projected = new Vector3(x, 0.9, z).project(camera.camera);
          expect(Math.abs(projected.x)).toBeLessThan(0.9);
          expect(Math.abs(projected.y)).toBeLessThan(0.75);
        }
    }
    room.dispose();
  });
});

describe("walking into portals and pushing stones", () => {
  it("teleports on entry without interaction, never at spawn, and respects locked gates and pauses", () => {
    const world = new World(),
      interactions = new InteractionSystem(new Scene());
    interactions.update(new Vector3(2.5, 0, -3.8), world, 0);
    expect(gameStore.getState().location).toBeNull();
    gameStore.pause();
    interactions.update(new Vector3(2.5, 0, -4), world, 0);
    expect(gameStore.getState().location).toBeNull();
    gameStore.close();
    interactions.update(new Vector3(2.5, 0, -4), world, 0);
    expect(gameStore.getState().location?.room).toBe("light");
    const first = new DungeonArea(DUNGEONS[0], DUNGEONS[0].rooms[0]);
    interactions.update(new Vector3(first.spawn.x, 0, first.spawn.z), first, 0);
    expect(gameStore.getState().location?.room).toBe("light");
    interactions.update(new Vector3(0, 0, -5.15), first, 0);
    expect(gameStore.getState().location?.room).toBe("light");
    solve(gameStore, "light-lock");
    first.update(0, 0);
    interactions.update(new Vector3(0, 0, -5.15), first, 0);
    expect(gameStore.getState().location?.room).toBe("stones");
    const second = new DungeonArea(DUNGEONS[0], DUNGEONS[0].rooms[1]);
    interactions.update(
      new Vector3(second.spawn.x, 0, second.spawn.z),
      second,
      0,
    );
    expect(gameStore.getState().location?.room).toBe("stones");
    interactions.update(new Vector3(0, 0, 5.15), second, 0);
    expect(gameStore.getState().location?.room).toBe("light");
    interactions.update(new Vector3(0, 0, 5.15), first, 0);
    expect(gameStore.getState().location).toBeNull();
    world.dispose();
    first.dispose();
    second.dispose();
  });
  it("moves a matched stone again until the whole puzzle is solved", () => {
    reachStones(gameStore);
    push(gameStore, 0, -1);
    gameStore.finishMotion();
    push(gameStore, 0, -1);
    gameStore.finishMotion();
    expect(gameStore.getState().dungeons.moss.stones.stones).toEqual([0, 2, 2]);
    push(gameStore, 0, 1);
    gameStore.finishMotion();
    expect(gameStore.getState().dungeons.moss.stones.stones).toEqual([1, 2, 2]);
    gameStore.resetPuzzle();
    stones(gameStore);
    for (const [i, dir] of [
      [0, 1],
      [1, -1],
      [2, 1],
    ] as const)
      expect(gameStore.pushStone(i, dir)).toBe(false);
    expect(gameStore.getState().dungeons.moss.stones.stones).toEqual([0, 4, 1]);
  });
  it("pushes on walking contact but not proximity, sideways movement or a blocked destination", () => {
    reachStones(gameStore);
    const area = new DungeonArea(DUNGEONS[0], DUNGEONS[0].rooms[1]);
    expect(area.tryPush(new Vector3(1.2, 0, -2.6), -0.05, 0)).toBe(false);
    expect(area.tryPush(new Vector3(0.82, 0, -2.6), 0, -0.05)).toBe(false);
    area.collision.add(-1.6, -2.6, 0.4);
    expect(area.tryPush(new Vector3(0.82, 0, -2.6), -0.05, 0)).toBe(false);
    area.collision.obstacles.pop();
    const player = new Player();
    player.position.set(0.85, 0, -2.6);
    const input = { direction: () => ({ x: -1, y: 0 }) } as Input;
    for (let i = 0; i < 3 && !gameStore.getState().motion; i++)
      player.update(
        1 / 60,
        input,
        area.collision,
        true,
        area.tryPush.bind(area),
      );
    expect(gameStore.getState().motion).toMatchObject({ index: 0, to: 1 });
    expect(gameStore.getState().dungeons.moss.stones.stones).toEqual([1, 2, 2]);
    expect(player.position.x).toBeGreaterThan(0.79);
    area.dispose();
  });
});

describe("temple equipment reward", () => {
  it("saves items and auto-equips atomically before the reward dialog", () => {
    const storage = memory(),
      s = createGameStore(storage);
    reachStones(s);
    stones(s);
    travel(s, "treasure");
    quiz(s, "treasure-lock");
    for (let i = 0; i < 5; i++) {
      s.answer(s.getState().question!.correctAnswer);
      if (i < 4) s.finishQuiz();
    }
    const restored = createGameStore(storage);
    expect(restored.getState().items).toEqual([
      "green-clothes",
      "temple-sword",
      "temple-shield",
    ]);
    expect(restored.getState().equipment).toEqual({
      clothes: "green-clothes",
      sword: "temple-sword",
      shield: "temple-shield",
    });
    s.answer(s.getState().question!.correctAnswer);
    s.finishQuiz();
    expect(s.getState().overlay).toBe("itemReward");
    s.finishQuiz();
    expect(s.getState().overlay).toBe("itemReward");
    s.openInventory();
    expect(s.getState().overlay).toBe("inventory");
    quiz(restored, "treasure-lock");
    expect(restored.getState().question).toBeNull();
    expect(restored.getState().items).toHaveLength(3);
    restored.reset();
    expect(createGameStore(storage).getState().items).toEqual([
      "green-clothes",
    ]);
  });
  it("does not open the bag during a quiz or a moving stone", () => {
    const s = createGameStore();
    travel(s, "light");
    quiz(s, "light-lock");
    s.openInventory();
    expect(s.getState().overlay).toBe("quiz");
    s.close();
    solve(s, "light-lock");
    travel(s, "stones");
    push(s, 0, -1);
    s.openInventory();
    expect(s.getState().overlay).toBeNull();
  });
});
