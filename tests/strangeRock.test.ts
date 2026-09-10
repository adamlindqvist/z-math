import { afterEach, describe, expect, it, vi } from "vitest";
import { Scene, Vector3, Mesh } from "three";
import {
  ROCK_SECRETS,
  BUTTERFLY_SECRETS,
} from "../src/game/secrets/definitions";
import { StrangeRock } from "../src/game/entities/StrangeRock";
import { World } from "../src/game/World";
import { InteractionSystem } from "../src/game/InteractionSystem";
import { disposeTree } from "../src/game/Area";
import { createGameStore, gameStore, parseSave } from "../src/store/gameStore";

const definition = ROCK_SECRETS[0];
const target = { kind: "secret" as const, id: definition.id, label: "Flytta" };
const center = new Vector3(definition.position.x, 0, definition.position.z);
const near = center.clone().add(new Vector3(0, 0, -1.5));
const far = new Vector3(20, 0, 20);
function memory() {
  let raw: string | null = null;
  return {
    getItem: () => raw,
    setItem: (_key: string, value: string) => {
      raw = value;
    },
  };
}
function reveal(store: ReturnType<typeof createGameStore>) {
  store.setTarget(target);
  store.interact();
  store.revealSecret(definition.id);
}
afterEach(() => gameStore.reset());

describe("strange rock progression", () => {
  it("rejects hidden pickups and atomically persists five rewards, including partial reloads", () => {
    const storage = memory();
    let store = createGameStore(storage);
    definition.pickupIds.forEach((id) => store.collect(id));
    expect(store.getState().rupees).toBe(0);
    store.setTarget(target);
    store.interact();
    const write = vi.spyOn(storage, "setItem");
    store.setTarget(target);
    store.interact();
    expect(write).not.toHaveBeenCalled();
    expect(store.getState().secrets[definition.id]).toEqual({
      discovered: true,
      revealed: false,
      completed: false,
    });
    // An interrupted animation reloads without an active animation and can be retried.
    store = createGameStore(storage);
    expect(store.getState().activeSecret).toBeNull();
    reveal(store);
    definition.pickupIds.slice(0, 2).forEach((id) => store.collect(id));
    store = createGameStore(storage);
    expect(store.getState().rupees).toBe(2);
    expect(store.getState().secrets[definition.id]).toEqual({
      discovered: true,
      revealed: true,
      completed: false,
    });
    definition.pickupIds.forEach((id) => store.collect(id));
    const saved = JSON.parse(storage.getItem()!);
    expect(saved.version).toBe(12);
    expect(saved.rupees).toBe(5);
    expect(saved.secrets[definition.id].completed).toBe(true);
    store = createGameStore(storage);
    reveal(store);
    definition.pickupIds.forEach((id) => store.collect(id));
    expect(store.getState().rupees).toBe(5);
    expect(store.getState().activeSecret).toBeNull();
    const progress = { ...saved.secrets[definition.id] };
    for (const change of [
      { version: 7 },
      { rupees: 6 },
      { collected: [...saved.collected, saved.collected[0]], rupees: 6 },
      {
        secrets: {
          ...saved.secrets,
          [definition.id]: { ...progress, revealed: false },
        },
      },
      {
        secrets: {
          ...saved.secrets,
          [definition.id]: { ...progress, completed: false },
        },
      },
      { collected: saved.collected.slice(1), rupees: 4 },
    ])
      expect(parseSave(JSON.stringify({ ...saved, ...change })).rupees).toBe(0);
  });

  it("gates the southern rocks behind the bridge and saves every reward independently", () => {
    const storage = memory();
    const store = createGameStore(storage);
    const south = ROCK_SECRETS[1];
    const southTarget = {
      kind: "secret" as const,
      id: south.id,
      label: "Flytta",
    };
    store.setTarget(southTarget);
    store.interact();
    store.discoverSecret(south.id);
    store.revealSecret(south.id);
    south.pickupIds.forEach((id) => store.collect(id));
    expect(store.getState().secrets[south.id].discovered).toBe(false);
    expect(store.getState().rupees).toBe(0);
    reveal(store);
    definition.pickupIds.forEach((id) => store.collect(id));
    expect(store.getState().secrets[south.id].completed).toBe(false);
    store.grantItems(["temple-sword", "temple-shield"]);
    store.setTarget("bokoblin");
    store.interact();
    store.setTarget(southTarget);
    store.interact();
    store.revealSecret(south.id);
    south.pickupIds.slice(0, 2).forEach((id) => store.collect(id));
    const restored = createGameStore(storage);
    expect(restored.getState().rupees).toBe(7);
    expect(restored.getState().secrets[definition.id].completed).toBe(true);
    expect(restored.getState().secrets[south.id]).toEqual({
      discovered: true,
      revealed: true,
      completed: false,
    });
    south.pickupIds.forEach((id) => restored.collect(id));
    const completed = createGameStore(storage);
    for (const rock of ROCK_SECRETS.slice(2)) {
      completed.setTarget({ kind: "secret", id: rock.id, label: "Flytta" });
      completed.interact();
      completed.revealSecret(rock.id);
    }
    for (const rock of ROCK_SECRETS)
      rock.pickupIds.forEach((id) => completed.collect(id));
    expect(completed.getState().rupees).toBe(15);
    for (const rock of ROCK_SECRETS)
      expect(completed.getState().secrets[rock.id].completed).toBe(true);
    const saved = JSON.parse(storage.getItem()!);
    expect(
      parseSave(JSON.stringify({ ...saved, bridgeUnlocked: false })).rupees,
    ).toBe(0);
  });

  it("works without storage, respects overlays, and restores debug progress", () => {
    const store = createGameStore({
      getItem: () => null,
      setItem: () => {
        throw Error("blocked");
      },
    });
    store.setTarget(target);
    store.pause();
    store.interact();
    expect(store.getState().activeSecret).toBeNull();
    store.close();
    reveal(store);
    definition.pickupIds.forEach((id) => store.collect(id));
    definition.pickupIds.forEach((id) => store.collect(id));
    expect(store.getState()).toMatchObject({
      rupees: 5,
      savingAvailable: false,
    });
    const storage = memory();
    const debug = createGameStore(storage);
    debug.setTarget(target);
    debug.interact();
    const baseline = storage.getItem();
    debug.openDebug();
    debug.debugSetNoclip(true);
    debug.closeDebug();
    debug.revealSecret(definition.id);
    definition.pickupIds.forEach((id) => debug.collect(id));
    expect(storage.getItem()).toBe(baseline);
    debug.debugEndSession();
    expect(debug.getState()).toMatchObject({ rupees: 0, activeSecret: null });
    expect(debug.getState().secrets[definition.id].revealed).toBe(false);
  });
});

describe("strange rock in the world", () => {
  it("uses normal interaction reach, pauses movement, reveals only at the end and restores the world", () => {
    gameStore.reset();
    const world = new World(),
      scene = new Scene(),
      interactions = new InteractionSystem(scene);
    const rock = world.rocks[0];
    try {
      for (let i = 0; i <= 20; i++) {
        const p = new Vector3(world.spawn.x, 0, world.spawn.z).lerp(
          near,
          i / 20,
        );
        expect(world.collision.free(p.x, p.z)).toBe(true);
      }
      expect(world.collision.free(center.x, center.z)).toBe(false);
      interactions.update(center, world, 0);
      expect(gameStore.getState().rupees).toBe(0);
      interactions.update(
        center.clone().add(new Vector3(0, 0, -1.9)),
        world,
        0,
      );
      expect(gameStore.getState().target).not.toEqual(target);
      interactions.update(near, world, 0);
      expect(gameStore.getState().target).toEqual(target);
      expect(interactions.arrow.visible).toBe(false);
      gameStore.interact();
      world.update(0.6, 0, near);
      expect(rock.stone.position.x).toBeGreaterThan(0);
      expect(rock.stone.position.x).toBeLessThan(1.6);
      expect(gameStore.getState().secrets[definition.id].revealed).toBe(false);
      interactions.update(center, world, 0);
      expect(gameStore.getState().rupees).toBe(0);
      expect(gameStore.getState().target).toBeNull();
      gameStore.pause();
      const before = rock.stone.position.clone();
      world.update(10, 0, center);
      expect(rock.stone.position.equals(before)).toBe(true);
      gameStore.close();
      world.update(0.6, 0, center);
      expect(rock.stone.position.x).toBe(1.6);
      expect(rock.pit.visible).toBe(true);
      expect(world.collision.free(center.x, center.z)).toBe(true);
      expect(gameStore.getState().secrets[definition.id].revealed).toBe(true);
      const partial = new World();
      expect(partial.rocks[0].stone.position.x).toBe(1.6);
      expect(
        partial.rupees.filter(
          (p) =>
            definition.pickupIds.some((id) => id === p.id) && p.root.visible,
        ),
      ).toHaveLength(5);
      partial.dispose();
      interactions.update(center, world, 0);
      expect(gameStore.getState().rupees).toBe(5);
      expect(gameStore.getState().overlay).toBeNull();
      const restored = new World();
      restored.update(0, 0, far);
      expect(restored.rocks[0].stone.position.x).toBe(1.6);
      expect(restored.rocks[0].pit.visible).toBe(true);
      expect(
        restored.rupees.filter(
          (p) =>
            definition.pickupIds.some((id) => id === p.id) && p.root.visible,
        ),
      ).toHaveLength(0);
      // Both butterfly routes remain walkable with the stone at its final position.
      for (const secret of BUTTERFLY_SECRETS) {
        for (let leg = 0; leg < secret.waypoints.length - 1; leg++) {
          const a = secret.waypoints[leg],
            b = secret.waypoints[leg + 1];
          for (let i = 0; i <= 100; i++) {
            const x = a.x + ((b.x - a.x) * i) / 100,
              z = a.z + ((b.z - a.z) * i) / 100;
            expect(restored.collision.free(x, z), `${x}, ${z}`).toBe(true);
          }
        }
      }
      restored.dispose();
      gameStore.reset();
      world.update(0, 0, near);
      expect(rock.phase).toBe("waiting");
      expect(rock.pit.visible).toBe(false);
      expect(rock.stone.position.x).toBe(0);
    } finally {
      world.dispose();
      disposeTree(scene);
    }
  });

  it("keeps the pond shore, southern approach and both butterfly routes accessible", () => {
    gameStore.reset();
    const world = new World();
    try {
      expect(
        world
          .interactions()
          .some(
            (i) =>
              typeof i.target === "object" &&
              i.target?.id === ROCK_SECRETS[1].id,
          ),
      ).toBe(false);
      gameStore.grantItems(["temple-sword", "temple-shield"]);
      gameStore.setTarget("bokoblin");
      gameStore.interact();
      for (const rock of world.rocks) {
        const { position, offset, id } = rock.definition;
        const approach = new Vector3(position.x - 1.5, 0, position.z);
        expect(world.collision.free(approach.x, approach.z)).toBe(true);
        expect(world.collision.visible(approach, position)).toBe(true);
        expect(
          world.collision.free(
            position.x + offset.x,
            position.z + offset.z,
            0.72,
          ),
        ).toBe(true);
        gameStore.setTarget({ kind: "secret", id, label: "Flytta" });
        gameStore.interact();
        world.update(1.2, 0, far);
        expect(gameStore.getState().secrets[id].revealed).toBe(true);
        expect(world.collision.free(position.x, position.z)).toBe(true);
        expect(
          world.collision.free(position.x + offset.x, position.z + offset.z),
        ).toBe(false);
      }
      for (const secret of BUTTERFLY_SECRETS) {
        for (let leg = 0; leg < secret.waypoints.length - 1; leg++) {
          const a = secret.waypoints[leg],
            b = secret.waypoints[leg + 1];
          for (let i = 0; i <= 100; i++) {
            const x = a.x + ((b.x - a.x) * i) / 100,
              z = a.z + ((b.z - a.z) * i) / 100;
            expect(world.collision.free(x, z), `${x}, ${z}`).toBe(true);
          }
        }
      }
    } finally {
      world.dispose();
    }
  });

  it("waits for the player to leave the landing spot and disposes its resources", () => {
    const rock = new StrangeRock(definition, false);
    const landing = { x: center.x + 1.6, z: center.z };
    rock.start();
    rock.update(0.5, false);
    rock.start();
    expect(rock.update(0.7, false)).toBe(true);
    expect(rock.obstacle(landing)).toEqual([]);
    expect(rock.obstacle(far)).toHaveLength(1);
    rock.reset(true);
    expect(rock.obstacle(landing)).toEqual([]);
    const geometries = new Set(),
      materials = new Set();
    const spies: ReturnType<typeof vi.spyOn>[] = [];
    rock.root.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      if (!geometries.has(o.geometry)) {
        geometries.add(o.geometry);
        spies.push(vi.spyOn(o.geometry, "dispose"));
      }
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (!materials.has(m)) {
          materials.add(m);
          spies.push(vi.spyOn(m, "dispose"));
        }
      }
    });
    disposeTree(rock.root);
    spies.forEach((spy) => expect(spy).toHaveBeenCalledTimes(1));
  });
});
