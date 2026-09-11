import { afterEach, describe, expect, it, vi } from "vitest";
import { Mesh, Raycaster, Scene, Vector2, Vector3 } from "three";
import {
  createGameStore,
  gameStore,
  parseSave,
  SAVE_VERSION,
} from "../src/store/gameStore";
import { DUNGEONS } from "../src/game/dungeons/definitions";
import {
  MINIBOSSES,
  RUNE_STONES,
  STONE_GIANT_CENTER,
  minibossDefeated,
} from "../src/game/minibosses/definitions";
import { selectPair } from "../src/game/minibosses/state";
import { VolcanoArea } from "../src/game/VolcanoArea";
import {
  InteractionSystem,
  pickInteraction,
} from "../src/game/InteractionSystem";
import { GameCamera } from "../src/game/Camera";
import { disposeTree } from "../src/game/Area";
import { ITEMS } from "../src/items/definitions";
import { SHOP_IDS } from "../src/items/shop";
import { applyEquipment, heroModel } from "../src/game/heroModel";

type Store = ReturnType<typeof createGameStore>;
const id = "stone_giant";
const chest = {
  kind: "chest" as const,
  id: "stone-giant-treasure" as const,
  label: "Öppna",
};
function memory() {
  let raw = "";
  return {
    getItem: () => raw,
    setItem: (_: string, value: string) => {
      raw = value;
    },
  };
}
function enterVolcano(s: Store) {
  s.grantItems(["temple-sword", "temple-shield"]);
  s.setTarget("bokoblin");
  s.interact();
  s.travelTo({ world: "volcano" });
}

function choose(s: Store, value: number) {
  s.setTarget({ kind: "runeStone", boss: id, value, label: `Välj ${value}` });
  s.interact();
}
function advance(s: Store) {
  s.finishMinibossFeedback(s.getState().encounter!);
}
function start(s: Store) {
  s.updateMinibossPresence(id, 3);
  advance(s);
}
function win(s: Store) {
  start(s);
  for (const [a, b] of [
    [1, 4],
    [3, 4],
    [4, 5],
  ]) {
    choose(s, a);
    choose(s, b);
    advance(s);
  }
  advance(s);
}
afterEach(() => {
  gameStore.debugEndSession();
  gameStore.reset();
});

describe("Stenjättens rules and persistence", () => {
  it("accepts exactly all different pairs for each target, in either order", () => {
    for (const target of MINIBOSSES[id].phases) {
      for (let a = 1; a <= 6; a++)
        for (let b = 1; b <= 6; b++) {
          const next = selectPair([1, 2, 3, 4, 5, 6], [a], b, target)!;
          expect(next.result).toBe(
            a === b ? null : a + b === target ? "success" : "failure",
          );
          if (a === b) expect(next.selected).toEqual([]);
        }
    }
    expect(selectPair([1, 2, 3, 4, 5, 6], [], 8, 5)).toBeNull();
  });
  it("locks intro and feedback, supports retries, and rejects stale completions", () => {
    const s = createGameStore();
    enterVolcano(s);
    choose(s, 1);
    expect(s.getState().encounter).toBeNull();
    s.updateMinibossPresence(id, 4.1);
    expect(s.getState().encounter).toBeNull();
    s.updateMinibossPresence(id, 4);
    const intro = s.getState().encounter!;
    choose(s, 1);
    expect(s.getState().encounter).toBe(intro);
    advance(s);
    choose(s, 3);
    choose(s, 3);
    expect(s.getState().encounter!.selected).toEqual([]);
    choose(s, 3);
    s.resetRuneSelection();
    expect(s.getState().encounter!.selected).toEqual([]);
    choose(s, 3);
    choose(s, 1);
    const failed = s.getState().encounter!;
    expect(failed.status).toBe("failure");
    choose(s, 2);
    s.resetRuneSelection();
    expect(s.getState().encounter).toBe(failed);
    s.finishMinibossFeedback(intro);
    expect(s.getState().encounter).toBe(failed);
    advance(s);
    expect(s.getState().encounter!.selected).toEqual([]);
    expect(s.getState().minibosses[id]).toBe(0);
    const rupees = s.getState().rupees;
    choose(s, 2);
    choose(s, 3);
    const success = s.getState().encounter!;
    choose(s, 2);
    choose(s, 3);
    expect(s.getState().encounter).toBe(success);
    expect(s.getState().minibosses[id]).toBe(1);
    expect(s.getState().rupees).toBe(rupees);
    expect(s.getState().overlay).toBeNull();
    expect(s.getState().question).toBeNull();
  });
  it("persists each solved phase immediately, including before feedback finishes", () => {
    const storage = memory();
    let s = createGameStore(storage);
    enterVolcano(s);
    for (const [index, [a, b]] of [
      [1, 4],
      [1, 6],
      [3, 6],
    ].entries()) {
      start(s);
      choose(s, a);
      choose(s, b);
      s = createGameStore(storage);
      expect(s.getState().encounter).toBeNull();
      expect(s.getState().minibosses[id]).toBe(index + 1);
    }
    s.updateMinibossPresence(id, 0);
    expect(s.getState().encounter).toBeNull();
    expect(minibossDefeated(s.getState().minibosses, id)).toBe(true);
    expect(s.getState().chests[chest.id]).toBe(false);
    s.setTarget(chest);
    s.interact();
    expect(s.getState().overlay).toBe("itemReward");
  });
  it("keeps progress on arena exit and travel, and freezes transitions during dialogs", () => {
    const s = createGameStore();
    enterVolcano(s);
    start(s);
    choose(s, 1);
    choose(s, 4);
    advance(s);
    choose(s, 3);
    s.pause();
    const paused = s.getState().encounter;
    s.updateMinibossPresence(id, 20);
    s.resetRuneSelection();
    choose(s, 4);
    advance(s);
    expect(s.getState().encounter).toBe(paused);
    s.close();
    s.updateMinibossPresence(id, 6);
    expect(s.getState().encounter).toBeNull();
    start(s);
    expect(s.getState().encounter).toMatchObject({ phase: 1, selected: [] });
    choose(s, 3);
    s.travelTo(null);
    expect(s.getState().encounter).toBeNull();
    s.travelTo({ world: "volcano" });
    start(s);
    expect(s.getState().encounter).toMatchObject({ phase: 1, selected: [] });
  });
  it("gates the chest through the collapse and awards both unique cosmetics exactly once", () => {
    const storage = memory(),
      s = createGameStore(storage);
    enterVolcano(s);
    s.setTarget(chest);
    s.interact();
    expect(s.getState().overlay).toBeNull();
    start(s);
    for (const pair of [
      [2, 3],
      [2, 5],
      [4, 5],
    ]) {
      pair.forEach((v) => choose(s, v));
      advance(s);
    }
    expect(s.getState().encounter!.status).toBe("collapsing");
    s.setTarget(chest);
    s.interact();
    expect(s.getState().chests[chest.id]).toBe(false);
    advance(s);
    const before = s.getState().rupees;
    s.setTarget(chest);
    s.interact();
    expect(s.getState().rewardItems).toEqual(["lava_hat", "stone_armor"]);
    expect(s.getState().equipment).toMatchObject({
      head: "lava_hat",
      body: "stone_armor",
    });
    s.close();
    s.setTarget(chest);
    s.interact();
    expect(s.getState().overlay).toBe("empty");
    expect(s.getState().rupees).toBe(before);
    const restored = createGameStore(storage);
    expect(restored.getState().chests[chest.id]).toBe(true);
    expect(
      restored.getState().items.filter((v) => v === "lava_hat"),
    ).toHaveLength(1);
    expect(
      restored.getState().items.filter((v) => v === "stone_armor"),
    ).toHaveLength(1);
    expect(restored.getState().equipment).toMatchObject({
      head: "lava_hat",
      body: "stone_armor",
    });
    for (const reward of ["lava_hat", "stone_armor"] as const) {
      expect(ITEMS[reward].source).toEqual({ kind: "miniboss", id });
      expect(SHOP_IDS as readonly string[]).not.toContain(reward);
    }
    const hero = heroModel();
    applyEquipment(hero, restored.getState().equipment);
    expect(hero.root.getObjectByName("lava_hat")!.visible).toBe(true);
    expect(hero.root.getObjectByName("stone-torso")).toBeDefined();
    restored.equipItem("base-hat", "head");
    restored.equipItem("green-clothes", "body");
    applyEquipment(hero, restored.getState().equipment);
    expect(hero.root.getObjectByName("lava_hat")!.visible).toBe(false);
    expect(hero.root.getObjectByName("stone-torso")).toBeUndefined();
    disposeTree(hero.root);
  });
  it("rejects invalid progress and inconsistent chest saves, and handles unavailable storage", () => {
    const storage = memory(),
      s = createGameStore(storage);
    enterVolcano(s);
    win(s);
    s.setTarget(chest);
    s.interact();
    const good = JSON.parse(storage.getItem());
    expect(good.version).toBe(SAVE_VERSION);
    for (const edit of [
      (p: typeof good) => {
        p.minibosses[id] = 4;
      },
      (p: typeof good) => {
        p.minibosses[id] = -1;
      },
      (p: typeof good) => {
        p.minibosses[id] = 1.5;
      },
      (p: typeof good) => {
        p.minibosses[id] = 2;
      },
      (p: typeof good) => {
        p.minibosses = {};
      },
      (p: typeof good) => {
        p.items = p.items.filter((v: string) => v !== "lava_hat");
        p.equipment.head = null;
      },
      (p: typeof good) => {
        p.version = 14;
      },
    ]) {
      const bad = structuredClone(good);
      edit(bad);
      expect(parseSave(JSON.stringify(bad)).minibosses[id]).toBe(0);
    }
    const unavailable = createGameStore({
      getItem() {
        throw Error();
      },
      setItem() {
        throw Error();
      },
    });
    enterVolcano(unavailable);
    win(unavailable);
    unavailable.setTarget(chest);
    unavailable.interact();
    expect(unavailable.getState().items).toContain("stone_armor");
    expect(unavailable.getState().savingAvailable).toBe(false);
  });
  it("restores debug snapshots and clears encounter state on reset", () => {
    const s = createGameStore();
    enterVolcano(s);
    start(s);
    choose(s, 1);
    choose(s, 4);
    advance(s);
    s.openDebug();
    s.debugTravelTo({ world: "volcano" });
    s.closeDebug();
    start(s);
    choose(s, 1);
    choose(s, 6);
    advance(s);
    expect(s.getState().minibosses[id]).toBe(2);
    s.debugEndSession();
    expect(s.getState().minibosses[id]).toBe(1);
    expect(s.getState().encounter).toBeNull();
    start(s);
    s.reset();
    expect(s.getState().encounter).toBeNull();
    expect(s.getState().minibosses[id]).toBe(0);
  });
});

describe("Stenjätten in the 3D world", () => {
  it("makes all stones reachable, nearby and directly tappable from the game camera", () => {
    enterVolcano(gameStore);
    start(gameStore);
    const area = new VolcanoArea(),
      interactions = new InteractionSystem(new Scene());
    const camera = new GameCamera();
    camera.resize(1180, 820);
    const seen = new Set<string>(),
      queue = [[Math.round(area.spawn.x * 5), Math.round(area.spawn.z * 5)]];
    seen.add(queue[0].join(","));
    for (let i = 0; i < queue.length; i++)
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = queue[i][0] + dx,
          nz = queue[i][1] + dz,
          key = `${nx},${nz}`;
        if (!seen.has(key) && area.collision.free(nx / 5, nz / 5, 0.4)) {
          seen.add(key);
          queue.push([nx, nz]);
        }
      }
    try {
      for (const stone of RUNE_STONES) {
        // Approach on the camera-facing side so the stone's large face is visible.
        const position = new Vector3(stone.x + 0.65, 0, stone.z + 1.15);
        expect(
          seen.has(
            `${Math.round(position.x * 5)},${Math.round(position.z * 5)}`,
          ),
          `stone ${stone.value}: ${position.x},${position.z}`,
        ).toBe(true);
        area.update(0, 0, position);
        interactions.update(position, area, 0);
        expect(gameStore.getState().target).toMatchObject({
          kind: "runeStone",
          value: stone.value,
        });
        camera.setMode("glade", position);
        camera.camera.updateMatrixWorld();
        area.root.updateMatrixWorld(true);
        const point = new Vector3(stone.x, 1.02, stone.z).project(
          camera.camera,
        );
        expect(
          pickInteraction(
            area,
            position,
            camera.camera,
            new Vector2(point.x, point.y),
          ),
        ).toMatchObject({ kind: "runeStone", value: stone.value });
        expect(
          pickInteraction(
            area,
            new Vector3(-10, 0, 0),
            camera.camera,
            new Vector2(point.x, point.y),
          ),
        ).toBeNull();
      }
    } finally {
      area.dispose();
      disposeTree(interactions.ring);
      disposeTree(interactions.arrow);
    }
  });
  it("keeps carved digits readable on the stones and the front of the giant", () => {
    enterVolcano(gameStore);
    start(gameStore);
    const area = new VolcanoArea(),
      camera = new GameCamera(),
      ray = new Raycaster();
    camera.resize(1180, 820);
    const assertVisible = (digit: Mesh) => {
      const positions = digit.geometry.getAttribute("position");
      const index = digit.geometry.index;
      const count = index ? index.count : positions.count;
      // Sample real filled triangles, including the lower portions of the digits.
      for (let i = 0; i < count; i += 21) {
        const point = new Vector3();
        for (let j = 0; j < 3; j++)
          point.add(
            new Vector3().fromBufferAttribute(
              positions,
              index ? index.getX(i + j) : i + j,
            ),
          );
        digit.localToWorld(point.multiplyScalar(1 / 3));
        ray.set(
          camera.camera.position,
          point.clone().sub(camera.camera.position).normalize(),
        );
        const hit = ray
          .intersectObject(area.miniboss.root, true)
          .find((hit) => {
            for (
              let object: typeof hit.object | null = hit.object;
              object;
              object = object.parent
            )
              if (!object.visible) return false;
            return true;
          });
        expect(
          hit?.object === digit,
          `${digit.name} triangle ${i} hidden by ${hit?.object.name || hit?.object.type}`,
        ).toBe(true);
      }
    };
    try {
      for (const pair of [
        [1, 4],
        [2, 5],
        [3, 6],
      ]) {
        for (const stone of RUNE_STONES) {
          const player = new Vector3(stone.x + 0.65, 0, stone.z + 1.15);
          area.update(1, 1, player);
          camera.setMode("glade", player);
          camera.camera.updateMatrixWorld();
          area.root.updateMatrixWorld(true);
          assertVisible(
            area.root
              .getObjectByName(`rune-stone-${stone.value}`)!
              .getObjectByName(`rune-number-${stone.value}`) as Mesh,
          );
          area.root
            .getObjectByName(`rune-stone-${stone.value}`)!
            .traverse((object) => {
              if (object.name === "rune-dot") assertVisible(object as Mesh);
            });
        }
        // The chest carving now turns with the giant, rather than facing the
        // camera from every angle. Inspect it while his front faces the camera.
        const front = new Vector3(
          STONE_GIANT_CENTER.x + 2,
          0,
          STONE_GIANT_CENTER.z + 3,
        );
        area.update(1, 1, front);
        camera.setMode("glade", front);
        camera.camera.updateMatrixWorld();
        area.root.updateMatrixWorld(true);
        const rune = area.root.getObjectByName("giant-rune")!;
        assertVisible(
          rune.children.find(
            (child) => child.visible && child.name.startsWith("rune-number"),
          ) as Mesh,
        );
        const behind = new Vector3(
          STONE_GIANT_CENTER.x - 2,
          0,
          STONE_GIANT_CENTER.z - 3,
        );
        area.update(1, 1, behind);
        camera.setMode("glade", behind);
        camera.camera.updateMatrixWorld();
        area.root.updateMatrixWorld(true);
        const backRune = area.root.getObjectByName("giant-back-rune")!;
        const backDigit = backRune.children.find(
          (child) => child.visible && child.name.startsWith("rune-number"),
        ) as Mesh;
        expect(backDigit.name).toBe(
          `rune-number-${MINIBOSSES.stone_giant.phases[gameStore.getState().encounter!.phase]}`,
        );
        expect(backDigit.castShadow).toBe(false);
        assertVisible(backDigit);
        pair.forEach((value) => choose(gameStore, value));
        advance(gameStore);
      }
    } finally {
      area.dispose();
    }
  });
  it("opens visible cracks after each phase and exposes more lava in phase two", () => {
    enterVolcano(gameStore);
    start(gameStore);
    const area = new VolcanoArea();
    const first: Mesh[] = [],
      second: Mesh[] = [];
    area.root.traverse((object) => {
      if (object.name === "armor-crack-phase-1") first.push(object as Mesh);
      if (object.name === "armor-crack-phase-2") second.push(object as Mesh);
    });
    const core = area.root.getObjectByName("exposed-lava")!;
    try {
      expect(first.length).toBeGreaterThan(0);
      expect(second.length).toBeGreaterThan(0);
      expect([...first, ...second].every((part) => !part.visible)).toBe(true);
      expect(core.visible).toBe(false);
      choose(gameStore, 1);
      choose(gameStore, 4);
      advance(gameStore);
      area.update(0, 0);
      expect(first.every((part) => part.visible)).toBe(true);
      expect(second.every((part) => !part.visible)).toBe(true);
      expect(core.visible).toBe(true);
      const width = first[0].scale.x,
        lavaSize = core.scale.z;
      choose(gameStore, 2);
      choose(gameStore, 5);
      advance(gameStore);
      area.update(0, 0);
      expect([...first, ...second].every((part) => part.visible)).toBe(true);
      expect(first[0].scale.x).toBeGreaterThan(width * 2);
      expect(core.scale.z).toBeGreaterThan(lavaSize);
      const returned = new VolcanoArea();
      try {
        expect(
          returned.root.getObjectByName("armor-crack-phase-2")!.visible,
        ).toBe(true);
      } finally {
        returned.dispose();
      }
    } finally {
      area.dispose();
    }
  });
  it("patrols a wider route before entry and hides rune faces after victory and return", () => {
    enterVolcano(gameStore);
    const area = new VolcanoArea();
    const outside = new Vector3(
      STONE_GIANT_CENTER.x + 4.3,
      0,
      STONE_GIANT_CENTER.z,
    );
    const boss = area.root.getObjectByName("stone-giant")!;
    const startPosition = boss.position.clone();
    try {
      area.update(6, 6, outside);
      expect(gameStore.getState().encounter).toBeNull();
      expect(boss.position.distanceTo(startPosition)).toBeGreaterThan(2);
      expect(Math.hypot(boss.position.x, boss.position.z)).toBeLessThan(1.5);
      area.root.traverse((object) => {
        if (object.name.startsWith("rune-number"))
          expect((object as Mesh).castShadow).toBe(false);
      });
      win(gameStore);
      area.update(0, 6);
      const assertHidden = (world: VolcanoArea) => {
        expect(world.root.getObjectByName("stone-giant")!.visible).toBe(false);
        for (const stone of RUNE_STONES) {
          const digit = world.root
            .getObjectByName(`rune-stone-${stone.value}`)!
            .getObjectByName(`rune-number-${stone.value}`)!;
          expect(digit.visible).toBe(false);
        }
      };
      assertHidden(area);
      const returned = new VolcanoArea();
      try {
        assertHidden(returned);
      } finally {
        returned.dispose();
      }
    } finally {
      area.dispose();
    }
  });
  it("walks back onto the patrol route instead of snapping when the player leaves", () => {
    enterVolcano(gameStore);
    const area = new VolcanoArea();
    const inside = new Vector3(
      STONE_GIANT_CENTER.x,
      0,
      STONE_GIANT_CENTER.z + 2,
    );
    const outside = new Vector3(
      STONE_GIANT_CENTER.x + 7,
      0,
      STONE_GIANT_CENTER.z,
    );
    const boss = area.root.getObjectByName("stone-giant")!;
    try {
      let time = 0;
      const step = (player: Vector3) => {
        const before = boss.position.clone();
        const facing = boss.children[0].rotation.y;
        time += 1 / 60;
        area.update(1 / 60, time, player);
        return {
          moved: boss.position.distanceTo(before),
          turned: Math.abs(
            Math.atan2(
              Math.sin(boss.children[0].rotation.y - facing),
              Math.cos(boss.children[0].rotation.y - facing),
            ),
          ),
        };
      };
      for (let i = 0; i < 90; i++) step(inside);
      expect(gameStore.getState().encounter).not.toBeNull();
      expect(Math.hypot(boss.position.x, boss.position.z)).toBeLessThan(0.1);
      for (let i = 0; i < 120; i++) {
        const { moved, turned } = step(outside);
        expect(moved).toBeLessThan(0.1);
        expect(turned).toBeLessThan(0.1);
      }
      expect(gameStore.getState().encounter).toBeNull();
      expect(Math.hypot(boss.position.x, boss.position.z)).toBeGreaterThan(1);
    } finally {
      area.dispose();
    }
  });
  it("pauses animation clocks, completes the collapse and reveals a persistent chest", () => {
    enterVolcano(gameStore);
    const area = new VolcanoArea(),
      player = new Vector3(STONE_GIANT_CENTER.x, 0, STONE_GIANT_CENTER.z + 2);
    try {
      area.update(0, 0, player);
      expect(gameStore.getState().encounter!.status).toBe("intro");
      gameStore.pause();
      area.update(10, 10, player);
      expect(gameStore.getState().encounter!.status).toBe("intro");
      gameStore.close();
      area.update(0.8, 11, player);
      expect(gameStore.getState().encounter!.status).toBe("choosing");
      for (const pair of [
        [1, 4],
        [2, 5],
        [3, 6],
      ]) {
        pair.forEach((v) => choose(gameStore, v));
        area.update(0, 11, player);
        area.update(1.5, 13, player);
      }
      expect(gameStore.getState().encounter!.status).toBe("collapsing");
      expect(area.miniboss.chest.root.visible).toBe(false);
      gameStore.openInventory();
      area.update(10, 23, player);
      expect(gameStore.getState().encounter!.status).toBe("collapsing");
      gameStore.close();
      player.set(STONE_GIANT_CENTER.x, 0, STONE_GIANT_CENTER.z);
      area.update(2, 25, player);
      expect(gameStore.getState().encounter).toBeNull();
      expect(area.miniboss.chest.root.visible).toBe(true);
      expect(area.interactions(gameStore.getState())).toContainEqual({
        ...STONE_GIANT_CENTER,
        target: chest,
      });
      for (let i = 0; i < 20; i++) {
        area.update(0.04, 25 + i * 0.04, player);
        area.collision.move(player, 0.1, 0);
      }
      expect(player.x).toBeGreaterThan(STONE_GIANT_CENTER.x + 1.8);
      expect(
        area.collision.free(STONE_GIANT_CENTER.x, STONE_GIANT_CENTER.z),
      ).toBe(false);
      const returned = new VolcanoArea();
      expect(returned.miniboss.chest.root.visible).toBe(true);
      returned.dispose();
      gameStore.reset();
      area.update(0, 26);
      expect(area.miniboss.chest.root.visible).toBe(false);
    } finally {
      area.dispose();
    }
  });
  it("disposes every arena geometry and material once", () => {
    const area = new VolcanoArea();
    const resources = new Set<{ dispose: () => void }>();
    area.miniboss.root.traverse((o) => {
      if (o instanceof Mesh) {
        resources.add(o.geometry);
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
          resources.add(m),
        );
      }
    });
    const spies = [...resources].map((r) => vi.spyOn(r, "dispose"));
    area.dispose();
    spies.forEach((spy) => expect(spy).toHaveBeenCalledOnce());
  });
});
