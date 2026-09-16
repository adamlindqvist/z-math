import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PerspectiveCamera, Scene, Vector2, Vector3 } from "three";
import { gameStore, createGameStore } from "../src/store/gameStore";
import { World } from "../src/game/World";
import { Player } from "../src/game/Player";
import type { Input } from "../src/game/Input";
import {
  InteractionSystem,
  pickInteraction,
} from "../src/game/InteractionSystem";
import { disposeTree } from "../src/game/Area";
import { HORSE_HOME } from "../src/game/horse/Horse";

let world: World, player: Player, scene: Scene, interaction: InteractionSystem;
let direction = { x: 0, y: 0 };
const input = { direction: () => direction } as Input;
const unlock = () => {
  gameStore.grantItems(["temple-sword", "temple-shield"]);
  gameStore.setTarget("bokoblin");
  gameStore.interact();
};
const step = (dt = 0) => {
  world.update(dt, dt, player.position);
  world.riding.update(dt, player, input);
  interaction.update(player.position, world, dt);
};
const action = (action: "mount" | "dismount") => {
  gameStore.setTarget({
    kind: "horse",
    action,
    label: action === "mount" ? "Rid" : "Kliv av",
  });
  gameStore.interact();
  step();
};
const mount = () => {
  player.position
    .copy(world.riding.horse.root.position)
    .add(new Vector3(0, 0, 1));
  step();
  expect(gameStore.getState().target).toMatchObject({
    kind: "horse",
    action: "mount",
  });
  gameStore.interact();
  step();
  expect(gameStore.getState().riding).toBe(true);
};
// World-space direction using the existing glade control transform.
const steer = (x: number, z: number) => {
  direction = { x: x * 0.864 - z * 0.504, y: x * 0.504 + z * 0.864 };
};
beforeEach(() => {
  gameStore.reset();
  unlock();
  direction = { x: 0, y: 0 };
  world = new World();
  player = new Player();
  scene = new Scene();
  interaction = new InteractionSystem(scene);
});
afterEach(() => {
  world.dispose();
  disposeTree(player.root);
  disposeTree(scene);
  gameStore.reset();
});

describe("horse riding", () => {
  it("starts in the paddock and mounts only nearby with the bridge unlocked", () => {
    expect(world.riding.horse.root.position.toArray()).toEqual([
      HORSE_HOME.x,
      0,
      HORSE_HOME.z,
    ]);
    action("mount");
    expect(gameStore.getState().riding).toBe(false);
    mount();
    expect(player.position.y).toBe(0);
    expect(player.model.root.position.y).toBeGreaterThan(1);
    expect(player.model.left.position.x).toBeLessThan(-0.4);
    expect(player.model.right.position.x).toBeGreaterThan(0.4);
    gameStore.reset();
    player.reset();
    step();
    player.position.set(HORSE_HOME.x, 0, HORSE_HOME.z + 1);
    action("mount");
    expect(gameStore.getState().riding).toBe(false);
  });
  it("rejects a stale mount action through a fence even when close enough", () => {
    // Park by the north fence and approach from its other side.
    world.riding.horse.root.position.z = HORSE_HOME.z - 0.55;
    player.position.set(HORSE_HOME.x, 0, HORSE_HOME.z - 1.95);
    step();
    expect(gameStore.getState().target).not.toMatchObject({ kind: "horse" });
    action("mount");
    expect(gameStore.getState().riding).toBe(false);
    expect(world.collision.free(HORSE_HOME.x, HORSE_HOME.z - 0.55)).toBe(false);
  });
  it("rides through the opening at a calm trot and respects fences and world edges", () => {
    mount();
    const start = player.position.clone();
    steer(-1, 0);
    step(0.6);
    expect(start.x - player.position.x).toBeCloseTo(3, 2);
    expect(player.position.x).toBeLessThan(HORSE_HOME.x - 2);
    expect(world.riding.horse.root.position.toArray()).toEqual(
      player.position.toArray(),
    );
    // Return through the opening, then ride toward the solid east fence.
    steer(1, 0);
    step(2);
    expect(player.position.x).toBeLessThan(HORSE_HOME.x + 2 - 0.85);
    expect(
      world.collision.free(player.position.x, player.position.z, 0.85),
    ).toBe(true);
    player.position.set(9, 0, 23);
    steer(1, 0);
    step(10);
    expect(
      world.collision.free(player.position.x, player.position.z, 0.85),
    ).toBe(true);
  });
  it("can ride over the bridge in both directions", () => {
    mount();
    player.position.set(-0.75, 0, 18);
    steer(0, -1);
    step(2.5);
    expect(player.position.z).toBeCloseTo(5.5, 1);
    steer(0, 1);
    step(2.5);
    expect(player.position.z).toBeCloseTo(18, 1);
  });
  it("dismounts on free ground, leaves a solid horse, and restores walking", () => {
    mount();
    action("dismount");
    expect(gameStore.getState().riding).toBe(false);
    expect(world.collision.free(player.position.x, player.position.z)).toBe(
      true,
    );
    expect(world.collision.free(HORSE_HOME.x, HORSE_HOME.z)).toBe(false);
    expect(player.model.root.position.y).toBe(0);
    expect(player.model.left.position.x).toBe(-0.17);
    const parked = world.riding.horse.root.position.clone();
    player.position.set(0, 0, 22);
    step(1);
    expect(world.riding.horse.root.position.toArray()).toEqual(
      parked.toArray(),
    );
  });
  it.each([Math.PI / 4, -Math.PI / 4, (3 * Math.PI) / 4, (-3 * Math.PI) / 4])(
    "leaves room to walk and remount after dismounting at angle %s in the paddock",
    (angle) => {
      mount();
      player.root.rotation.y = angle;
      step();
      action("dismount");
      expect(gameStore.getState().riding).toBe(false);
      expect(world.collision.free(player.position.x, player.position.z)).toBe(
        true,
      );
      const start = player.position.clone();
      const exits = Array.from({ length: 8 }, (_, i) => {
        const position = start.clone();
        const direction = (i * Math.PI) / 4;
        world.collision.move(
          position,
          Math.sin(direction) * 0.6,
          Math.cos(direction) * 0.6,
        );
        return position.distanceTo(start);
      });
      expect(Math.max(...exits)).toBeGreaterThan(0.5);
      step();
      expect(gameStore.getState().target).toMatchObject({
        kind: "horse",
        action: "mount",
      });
      gameStore.interact();
      step();
      expect(gameStore.getState().riding).toBe(true);
    },
  );
  it("chooses a safe alternative when a fence blocks the preferred dismount", () => {
    mount();
    const h = player.position.clone();
    world.collision.add(h.x, h.z + 1.05, 2, 0.08);
    action("dismount");
    expect(gameStore.getState().riding).toBe(false);
    expect(player.position.z).toBeLessThan(h.z + 0.65);
    expect(world.collision.free(player.position.x, player.position.z)).toBe(
      true,
    );
  });
  it("does not notify React on each riding frame", () => {
    mount();
    let notifications = 0;
    const unsubscribe = gameStore.subscribe(() => notifications++);
    steer(-1, 0);
    for (let i = 0; i < 10; i++) step(1 / 60);
    unsubscribe();
    expect(notifications).toBe(0);
  });
  it("keeps the rider seated if no safe exit exists, then allows retry", () => {
    mount();
    const h = player.position.clone();
    // A narrow box can fit the horse, but leaves no place to stand beside it.
    for (const x of [-1.05, 1.05]) world.collision.add(h.x + x, h.z, 0.08, 2);
    for (const z of [-1.05, 1.05]) world.collision.add(h.x, h.z + z, 2, 0.08);
    action("dismount");
    expect(gameStore.getState()).toMatchObject({
      riding: true,
      ridingMessage: "Rid lite åt sidan",
    });
    expect(player.position.toArray()).toEqual(h.toArray());
    world.collision.obstacles.splice(-4);
    action("dismount");
    expect(gameStore.getState()).toMatchObject({
      riding: false,
      ridingMessage: "",
    });
  });
  it("prioritizes nearby interactions while staying mounted, with dismount as fallback", () => {
    mount();
    player.position.copy(world.chest.root.position).add(new Vector3(0, 0, 1.5));
    step();
    expect(gameStore.getState().target).toMatchObject({
      kind: "chest",
      id: "glade",
    });
    expect(interaction.ring.visible).toBe(true);
    gameStore.interact();
    expect(gameStore.getState()).toMatchObject({
      riding: true,
      overlay: "locked",
    });
    step();
    expect(gameStore.getState().target).toBeNull();
    gameStore.close();
    player.position.copy(world.npc.root.position).add(new Vector3(0, 0, 1.3));
    step();
    expect(gameStore.getState().target).toBe("npc");
    gameStore.interact();
    expect(gameStore.getState()).toMatchObject({
      riding: true,
      overlay: "npc",
    });
    gameStore.close();
    player.position.set(HORSE_HOME.x, 0, HORSE_HOME.z);
    step();
    expect(gameStore.getState().target).toMatchObject({
      kind: "horse",
      action: "dismount",
    });
    expect(interaction.ring.visible).toBe(false);
    gameStore.interact();
    step();
    expect(gameStore.getState().riding).toBe(false);
  });
  it("allows tapping a nearby rabbit while mounted", () => {
    mount();
    const rabbit = world.farm.rabbits[0];
    player.position.copy(rabbit.root.position).add(new Vector3(0, 0, 1.2));
    step();
    const camera = new PerspectiveCamera(40, 1, 0.1, 20);
    camera.position.copy(rabbit.root.position).add(new Vector3(0, 5, 0.01));
    camera.lookAt(rabbit.root.position);
    camera.updateMatrixWorld();
    world.root.updateMatrixWorld(true);
    const target = pickInteraction(
      world,
      player.position,
      camera,
      new Vector2(),
    );
    expect(target).toMatchObject({ kind: "rabbit", id: "cream" });
    gameStore.setTarget(target);
    gameStore.interact();
    expect(gameStore.getState().followingRabbits).toContain("cream");
    expect(gameStore.getState().riding).toBe(true);
  });
  it("offers dismount instead of an interaction behind an obstacle", () => {
    mount();
    const chest = world.chest.root.position;
    player.position.copy(chest).add(new Vector3(0, 0, 1.7));
    world.collision.add(chest.x, chest.z + 0.85, 1, 0.1);
    step();
    expect(gameStore.getState().target).toMatchObject({
      kind: "horse",
      action: "dismount",
    });
  });
  it("still blocks mounted passage travel and collects coins only once", () => {
    mount();
    const passage = world.passages()[0];
    player.position.set(passage.x, 0, passage.z);
    step();
    expect(gameStore.getState().location).toBeNull();
    gameStore.travelTo(passage.destination);
    expect(gameStore.getState().location).toBeNull();
    const coin = world.rupees.find((r) => r.id === "south-path-1")!;
    player.position.copy(coin.root.position);
    player.position.y = 0;
    step();
    step();
    expect(gameStore.getState().rupees).toBe(1);
    expect(
      gameStore.getState().collected.filter((id) => id === coin.id),
    ).toHaveLength(1);
  });
  it("pauses mounted movement and returns the horse home on reset or a new world", () => {
    mount();
    steer(-1, 0);
    step(0.5);
    gameStore.pause();
    const before = player.position.clone();
    step(1);
    expect(player.position.toArray()).toEqual(before.toArray());
    gameStore.close();
    direction = { x: 0, y: 0 };
    gameStore.reset();
    player.reset();
    step();
    expect(gameStore.getState().riding).toBe(false);
    expect(world.riding.horse.root.position.toArray()).toEqual([
      HORSE_HOME.x,
      0,
      HORSE_HOME.z,
    ]);
    expect(player.model.root.position.y).toBe(0);
    const next = new World();
    expect(next.riding.horse.root.position.toArray()).toEqual([
      HORSE_HOME.x,
      0,
      HORSE_HOME.z,
    ]);
    next.dispose();
  });
  it("never persists riding state or pending actions", () => {
    let raw = "";
    const storage = {
      getItem: () => raw,
      setItem: (_key: string, value: string) => {
        raw = value;
      },
    };
    const store = createGameStore(storage);
    store.setRiding(true);
    store.collect("path-1");
    expect(JSON.parse(raw)).not.toHaveProperty("riding");
    expect(JSON.parse(raw)).not.toHaveProperty("horseAction");
    expect(createGameStore(storage).getState()).toMatchObject({
      riding: false,
      horseAction: null,
    });
  });
});
