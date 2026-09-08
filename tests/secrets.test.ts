import { afterEach, describe, expect, it, vi } from "vitest";
import { Vector3, Scene, Mesh } from "three";
import { Butterfly } from "../src/game/entities/Butterfly";
import { WORLD_SECRETS } from "../src/game/secrets/definitions";
import { createGameStore, gameStore, parseSave } from "../src/store/gameStore";
import { World } from "../src/game/World";
import { disposeTree } from "../src/game/Area";
import { InteractionSystem } from "../src/game/InteractionSystem";

const secret = WORLD_SECRETS[0];
const target = { kind: "chest" as const, id: secret.chestId, label: "Öppna" };
const far = { x: 20, z: 20 };
const memory = () => {
  let raw: string | null = null;
  return {
    getItem: () => raw,
    setItem: (_key: string, value: string) => {
      raw = value;
    },
  };
};
afterEach(() => gameStore.reset());

describe("secret rewards and saves", () => {
  it("blocks a hidden chest, then opens without a quiz and commits ten rupees exactly once", () => {
    const storage = memory();
    const store = createGameStore(storage);
    store.setTarget(target);
    store.interact();
    expect(store.getState()).toMatchObject({ rupees: 0, overlay: null });
    store.revealSecret(secret.id);
    expect(store.getState().secrets[secret.id].revealed).toBe(false);
    store.discoverSecret(secret.id);
    store.revealSecret(secret.id);
    store.interact();
    expect(store.getState()).toMatchObject({
      rupees: 10,
      reward: 10,
      overlay: null,
      question: null,
      talkedToNpc: false,
      chests: { "butterfly-01": true, glade: false, south: false },
      secrets: {
        "butterfly-01": { discovered: true, revealed: true, completed: true },
      },
    });
    expect(createGameStore(storage).getState()).toMatchObject({
      rupees: 10,
      chests: { "butterfly-01": true },
      secrets: {
        "butterfly-01": { discovered: true, revealed: true, completed: true },
      },
    });
    store.interact();
    store.beginQuiz();
    store.answer(0);
    expect(store.getState().overlay).toBe("empty");
    expect(store.getState().rupees).toBe(10);
  });
  it("persists discovery only once and restores an incomplete secret", () => {
    const storage = memory();
    const write = vi.spyOn(storage, "setItem");
    const store = createGameStore(storage);
    store.discoverSecret(secret.id);
    store.discoverSecret(secret.id);
    expect(write).toHaveBeenCalledTimes(1);
    expect(createGameStore(storage).getState()).toMatchObject({
      rupees: 0,
      secrets: {
        "butterfly-01": { discovered: true, revealed: false, completed: false },
      },
    });
    const saved = JSON.parse(storage.getItem()!);
    expect(saved.version).toBe(7);
    for (const change of [
      { version: 6 },
      { secrets: {} },
      { secrets: { "butterfly-01": { discovered: "yes", completed: false } } },
      {
        secrets: {
          "butterfly-01": {
            discovered: false,
            revealed: true,
            completed: true,
          },
        },
      },
      {
        secrets: {
          "butterfly-01": { discovered: true, revealed: true, completed: true },
        },
      },
      { chests: { ...saved.chests, "butterfly-01": true } },
      { rupees: 10 },
    ])
      expect(
        parseSave(JSON.stringify({ ...saved, ...change })).secrets[secret.id]
          .discovered,
      ).toBe(false);
  });
  it("survives blocked writes, resets, and keeps debug rewards out of real progress", () => {
    const storage = memory();
    const store = createGameStore(storage);
    store.discoverSecret(secret.id);
    const baseline = storage.getItem();
    store.openDebug();
    store.debugSetNoclip(true);
    store.closeDebug();
    store.revealSecret(secret.id);
    store.setTarget(target);
    store.interact();
    expect(store.getState().rupees).toBe(10);
    expect(storage.getItem()).toBe(baseline);
    store.debugEndSession();
    expect(store.getState()).toMatchObject({
      rupees: 0,
      chests: { "butterfly-01": false },
      secrets: {
        "butterfly-01": { discovered: true, revealed: false, completed: false },
      },
    });
    store.reset();
    expect(createGameStore(storage).getState().secrets[secret.id]).toEqual({
      discovered: false,
      revealed: false,
      completed: false,
    });
    const blocked = createGameStore({
      getItem: () => null,
      setItem: () => {
        throw Error("blocked");
      },
    });
    blocked.discoverSecret(secret.id);
    blocked.revealSecret(secret.id);
    blocked.setTarget(target);
    blocked.interact();
    expect(blocked.getState()).toMatchObject({
      rupees: 10,
      savingAvailable: false,
    });
  });
});

describe("butterfly sequence", () => {
  it("idles, reacts to generous proximity, flies continuously, then waits at every stop", () => {
    const b = new Butterfly(secret, false);
    try {
      const initial = b.body.position.clone();
      expect(b.update(1, far, false, false)).toBe(false);
      expect(b.body.position.equals(initial)).toBe(false);
      expect(b.waypoint).toBe(0);
      const near = { x: secret.waypoints[0].x + 2.1, z: secret.waypoints[0].z };
      expect(b.update(0.01, near, false, false)).toBe(true);
      expect(b.phase).toBe("reacting");
      b.update(0.4, far, false, false);
      expect(b.phase).toBe("flying");
      const from = b.body.position.clone();
      b.update(1.25, far, false, false);
      expect(b.body.position.x).toBeCloseTo(
        (from.x + secret.waypoints[1].x) / 2,
      );
      expect(b.body.position.y).toBeGreaterThan(1.8);
      const paused = b.body.position.clone();
      b.update(10, secret.waypoints[1], false, true);
      expect(b.body.position.equals(paused)).toBe(true);
      b.update(1.25, secret.waypoints[1], false, false);
      expect(b.waypoint).toBe(1);
      expect(b.phase).toBe("waiting");
      expect(b.update(0.79, secret.waypoints[1], false, false)).toBe(false);
      b.update(60, far, false, false);
      expect(b.waypoint).toBe(1);
      expect(b.update(0.02, secret.waypoints[1], false, false)).toBe(true);
      b.update(0.4, far, false, false);
      b.update(2.5, secret.waypoints[2], false, false);
      expect(b.waypoint).toBe(2);
      for (let i = 2; i < secret.waypoints.length - 1; i++) {
        expect(b.update(1, secret.waypoints[i], false, false)).toBe(true);
        b.update(0.4, far, false, false);
        b.update(2.5, far, false, false);
        expect(b.waypoint).toBe(i + 1);
      }
      expect(b.update(60, secret.waypoints.at(-1)!, false, false)).toBe(false);
      expect(b.phase).toBe("waiting");
    } finally {
      disposeTree(b.root);
    }
  });
  it("finishes from the current flight position, pauses, disappears and can reset", () => {
    const b = new Butterfly(secret, false);
    try {
      b.update(1, secret.waypoints[0], false, false);
      b.update(0.4, far, false, false);
      b.update(0.8, far, false, false);
      const position = b.body.position.clone();
      b.update(0, far, true, false);
      expect(b.phase).toBe("finishing");
      expect(b.body.position.equals(position)).toBe(true);
      b.update(0.9, far, true, false);
      expect(b.body.position.equals(position)).toBe(true);
      b.update(20, far, true, true);
      expect(b.body.visible).toBe(true);
      b.update(1.1, far, true, false);
      expect(b.body.position.y).toBeGreaterThan(position.y);
      b.update(1, far, true, false);
      expect(b.body.visible).toBe(false);
      expect(b.phase).toBe("hidden");
      b.reset(false);
      expect(b.waypoint).toBe(0);
      expect(b.body.visible).toBe(true);
      b.reset(true);
      expect(b.body.visible).toBe(false);
    } finally {
      disposeTree(b.root);
    }
  });
  it("keeps all geometries and materials attached for deduplicated cleanup", () => {
    const b = new Butterfly(secret, false);
    const geometries = new Set(),
      materials = new Set();
    const spies: ReturnType<typeof vi.spyOn>[] = [];
    b.root.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      if (!geometries.has(o.geometry)) {
        geometries.add(o.geometry);
        spies.push(vi.spyOn(o.geometry, "dispose"));
      }
      for (const m of Array.isArray(o.material) ? o.material : [o.material])
        if (!materials.has(m)) {
          materials.add(m);
          spies.push(vi.spyOn(m, "dispose"));
        }
    });
    disposeTree(b.root);
    spies.forEach((spy) => expect(spy).toHaveBeenCalledTimes(1));
  });
});

describe("secret in the existing world", () => {
  it("has walkable legs and a reachable chest without passing through the temple", () => {
    gameStore.reset();
    const w = new World();
    const scene = new Scene();
    const interactions = new InteractionSystem(scene);
    try {
      for (let leg = 0; leg < secret.waypoints.length - 1; leg++) {
        const a = secret.waypoints[leg],
          b = secret.waypoints[leg + 1];
        const length = Math.hypot(b.x - a.x, b.z - a.z);
        expect(length).toBeGreaterThanOrEqual(5);
        expect(length).toBeLessThanOrEqual(12.5);
        for (let i = 0; i <= 100; i++) {
          const x = a.x + ((b.x - a.x) * i) / 100,
            z = a.z + ((b.z - a.z) * i) / 100;
          // The final hovering point may overlap its own chest, but the player
          // must be able to approach within the normal opening radius.
          if (
            Math.hypot(x - secret.chestPosition.x, z - secret.chestPosition.z) <
            1.1
          )
            continue;
          expect(w.collision.free(x, z), `blocked at ${x}, ${z}`).toBe(true);
          expect(Math.abs(x - 2.5) < 0.55 && Math.abs(z + 4.25) < 0.28).toBe(
            false,
          );
        }
      }
      const opening = new Vector3(-4.25, 0, -5.3);
      expect(w.secrets[0].chest.root.visible).toBe(false);
      expect(
        w.collision.free(secret.chestPosition.x, secret.chestPosition.z),
      ).toBe(true);
      interactions.update(opening, w, 0);
      expect(gameStore.getState().target).toBeNull();
      for (let leg = 0; leg < secret.waypoints.length - 1; leg++) {
        const a = secret.waypoints[leg];
        const player = new Vector3(a.x, 0, a.z);
        w.update(1, 0, player);
        w.update(0.4, 0, player);
        w.update(2.49, 0, player);
        expect(w.secrets[0].chest.root.visible).toBe(false);
        w.update(0.01, 0, player);
      }
      expect(w.secrets[0].chest.root.visible).toBe(true);
      expect(w.secrets[0].chest.revealAmount).toBeGreaterThan(0);
      expect(w.secrets[0].chest.revealAmount).toBeLessThan(0.1);
      interactions.update(opening, w, 0);
      expect(gameStore.getState().target).toBeNull();
      w.update(0.7, 0, opening);
      expect(w.secrets[0].chest.revealAmount).toBeGreaterThan(0.4);
      expect(w.secrets[0].chest.revealAmount).toBeLessThan(0.6);
      gameStore.pause();
      const opacity = w.secrets[0].chest.revealAmount;
      w.update(10, 0, opening);
      expect(w.secrets[0].chest.revealAmount).toBe(opacity);
      gameStore.close();
      w.update(0.8, 0, opening);
      expect(w.secrets[0].chest.revealAmount).toBe(1);
      expect(gameStore.getState().secrets[secret.id].revealed).toBe(true);
      const revealedReload = new World();
      expect(revealedReload.secrets[0].chest.root.visible).toBe(true);
      expect(revealedReload.secrets[0].butterfly.waypoint).toBe(
        secret.waypoints.length - 1,
      );
      expect(revealedReload.secrets[0].butterfly.phase).toBe("waiting");
      revealedReload.dispose();
      expect(w.collision.free(opening.x, opening.z)).toBe(true);
      interactions.update(opening, w, 0);
      expect(gameStore.getState().target).toMatchObject(target);
      gameStore.interact();
      w.update(0.04, 1, opening);
      expect(gameStore.getState().rupees).toBe(10);
      expect(w.secrets[0].butterfly.phase).toBe("finishing");
      const restored = new World();
      expect(restored.secrets[0].butterfly.body.visible).toBe(false);
      expect(restored.secrets[0].chest.openAmount).toBe(1);
      restored.dispose();
      gameStore.reset();
      w.update(0, 2, opening);
      expect(w.secrets[0].butterfly.phase).toBe("waiting");
      expect(w.secrets[0].butterfly.waypoint).toBe(0);
      expect(w.secrets[0].butterfly.body.visible).toBe(true);
      expect(w.secrets[0].chest.root.visible).toBe(false);
      // Butterfly proximity never creates an interaction target or an overlay.
      const start = new Vector3(
        secret.waypoints[0].x,
        0,
        secret.waypoints[0].z,
      );
      w.update(1, 3, start);
      expect(gameStore.getState().secrets[secret.id].discovered).toBe(true);
      expect(gameStore.getState().overlay).toBeNull();
      expect(
        w
          .interactions()
          .some(
            (i) =>
              typeof i.target === "object" &&
              i.target &&
              "kind" in i.target &&
              i.target.kind !== "chest",
          ),
      ).toBe(false);
    } finally {
      w.dispose();
      disposeTree(scene);
    }
  });
});

describe("independent southern butterfly", () => {
  const south = WORLD_SECRETS[1];
  const unlock = (store: ReturnType<typeof createGameStore>) => {
    store.grantItems(["temple-sword", "temple-shield"]);
    store.setTarget("bokoblin");
    store.interact();
  };
  it("requires the bridge, saves each secret separately and awards each treasure once", () => {
    const storage = memory();
    const store = createGameStore(storage);
    store.discoverSecret(south.id);
    store.revealSecret(south.id);
    expect(store.getState().secrets[south.id].discovered).toBe(false);
    unlock(store);
    for (const definition of WORLD_SECRETS) {
      store.discoverSecret(definition.id);
      store.revealSecret(definition.id);
      store.setTarget({
        kind: "chest",
        id: definition.chestId,
        label: "Öppna",
      });
      store.interact();
      store.interact();
      store.close();
    }
    const restored = createGameStore(storage).getState();
    expect(restored.rupees).toBe(20);
    for (const definition of WORLD_SECRETS)
      expect(restored.secrets[definition.id]).toEqual({
        discovered: true,
        revealed: true,
        completed: true,
      });
    const saved = JSON.parse(storage.getItem()!);
    expect(
      parseSave(JSON.stringify({ ...saved, bridgeUnlocked: false })).rupees,
    ).toBe(0);
  });
  it("follows five walkable stops without entering the fire temple and reveals only its own chest", () => {
    gameStore.reset();
    const w = new World();
    try {
      const southern = w.secrets[1];
      const start = new Vector3(south.waypoints[0].x, 0, south.waypoints[0].z);
      w.update(1, 0, start);
      expect(southern.butterfly.phase).toBe("waiting");
      expect(gameStore.getState().secrets[south.id].discovered).toBe(false);
      unlock(gameStore);
      for (let i = 0; i < south.waypoints.length - 1; i++) {
        const a = south.waypoints[i],
          b = south.waypoints[i + 1];
        const length = Math.hypot(a.x - b.x, a.z - b.z);
        expect(length).toBeGreaterThanOrEqual(5);
        expect(length).toBeLessThanOrEqual(12.5);
        for (let step = 0; step <= 100; step++) {
          const x = a.x + ((b.x - a.x) * step) / 100,
            z = a.z + ((b.z - a.z) * step) / 100;
          expect(w.collision.free(x, z), `blocked at ${x},${z}`).toBe(true);
          expect(Math.abs(z - 22.5) < 0.55 && Math.abs(x + 6.25) < 0.28).toBe(
            false,
          );
        }
        const player = new Vector3(a.x, 0, a.z);
        w.update(1, 0, player);
        w.update(0.4, 0, player);
        w.update(2.5, 0, player);
      }
      expect(southern.butterfly.waypoint).toBe(4);
      expect(southern.chest.root.visible).toBe(true);
      expect(w.secrets[0].chest.root.visible).toBe(false);
      expect(gameStore.getState().secrets[secret.id]).toEqual({
        discovered: false,
        revealed: false,
        completed: false,
      });
      const position = new Vector3(-5.625, 0, 29.3);
      w.update(1.5, 0, position);
      expect(w.collision.free(position.x, position.z)).toBe(true);
      const scene = new Scene();
      const interactions = new InteractionSystem(scene);
      interactions.update(position, w, 0);
      expect(gameStore.getState().target).toMatchObject({
        kind: "chest",
        id: south.chestId,
      });
      disposeTree(scene);
    } finally {
      w.dispose();
    }
  });
});
