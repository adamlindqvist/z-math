import { afterEach, describe, expect, it } from "vitest";
import { Group, Mesh, Scene, Vector3 } from "three";
import { createGameStore, gameStore, parseSave, SAVE_VERSION } from "../src/store/gameStore";
import { FARM_YARD, RABBITS, rabbitsHome } from "../src/game/rabbits/definitions";
import { RabbitFarm } from "../src/game/rabbits/RabbitFarm";
import { RabbitFollower, rabbitRoute } from "../src/game/rabbits/following";
import { CollisionSystem } from "../src/game/CollisionSystem";
import { PLAYER_WALK_SPEED } from "../src/game/Player";
import { World } from "../src/game/World";
import { InteractionSystem } from "../src/game/InteractionSystem";
import { VOLCANO_ENTRANCE } from "../src/game/volcanoPortal";
import { disposeTree } from "../src/game/Area";
import { completeRabbitQuest } from "./helpers/rabbits";
const unlock = (s = gameStore) => {
  s.grantItems(["temple-sword", "temple-shield"]); s.setTarget("bokoblin"); s.interact();
};
const fetchRabbit = (s: ReturnType<typeof createGameStore>, id = RABBITS[0].id as typeof RABBITS[number]["id"]) => {
  s.setTarget({ kind: "rabbit", id, label: "Följ med" }); s.interact();
};
function memory() {
  let raw = "";
  return { getItem: () => raw, setItem: (_k: string, v: string) => { raw = v; } };
}
afterEach(() => gameStore.reset());

describe("rabbit progress", () => {
  it("requires the bridge but no conversation, supports three followers and saves one reward", () => {
    const storage = memory(), s = createGameStore(storage);
    fetchRabbit(s); s.bringRabbitHome("cream");
    expect(s.getState().followingRabbits).toEqual([]);
    unlock(s);
    for (const { id } of RABBITS) { fetchRabbit(s, id); fetchRabbit(s, id); }
    expect(s.getState().followingRabbits).toEqual(RABBITS.map(r => r.id));
    for (const [i, { id }] of RABBITS.entries()) {
      s.bringRabbitHome(id); s.bringRabbitHome(id);
      const loaded = createGameStore(storage).getState();
      expect(Object.values(loaded.rabbits).filter(Boolean)).toHaveLength(i + 1);
      expect(loaded.followingRabbits).toEqual([]);
      expect(loaded.rupees).toBe(i === 2 ? 10 : 0);
    }
    expect(s.getState().overlay).toBe("rabbitReward");
    s.close(); s.bringRabbitHome("gray");
    expect(s.getState().rupees).toBe(10);
    s.travelTo({ world: "volcano" }); s.travelTo(null);
    expect(rabbitsHome(createGameStore(storage).getState().rabbits)).toBe(true);
  });
  it("keeps followers across pause, blocks paused delivery and drops followers on area changes", () => {
    const s = createGameStore(); unlock(s); fetchRabbit(s);
    s.pause(); s.bringRabbitHome("cream");
    expect(s.getState().rabbits.cream).toBe(false);
    expect(s.getState().followingRabbits).toEqual(["cream"]);
    s.close(); s.travelTo({ castle: "hall" });
    expect(s.getState().followingRabbits).toEqual([]);
    s.travelTo(null); fetchRabbit(s); s.bringRabbitHome("cream");
    fetchRabbit(s, "brown"); s.reset();
    expect(s.getState().followingRabbits).toEqual([]);
    expect(rabbitsHome(s.getState().rabbits)).toBe(false);
  });
  it("validates reward accounting, rabbit IDs and save versions, and works without storage", () => {
    const storage = memory(), s = createGameStore(storage); completeRabbitQuest(s);
    const saved = JSON.parse(storage.getItem());
    for (const change of [
      { version: SAVE_VERSION - 1 }, { rabbits: { cream: true } },
      { rabbits: { cream: true, brown: true, gray: "yes" } },
      { rabbits: { cream: true, brown: true, gray: false } }, { rupees: 20 }, { bridgeUnlocked: false },
    ]) expect(parseSave(JSON.stringify({ ...saved, ...change })).rupees).toBe(0);
    expect(parseSave("broken").rabbits).toEqual({ cream: false, brown: false, gray: false });
    const broken = createGameStore({ getItem() { throw Error(); }, setItem() { throw Error(); } });
    completeRabbitQuest(broken);
    expect(broken.getState()).toMatchObject({ rupees: 10, savingAvailable: false });
    broken.travelTo({ world: "volcano" }); expect(broken.getState().location?.world).toBe("volcano");
  });
  it("debug travel grants prerequisites once and restores the real partial quest", () => {
    const storage = memory(), s = createGameStore(storage); unlock(s); fetchRabbit(s); s.bringRabbitHome("cream");
    const saved = storage.getItem();
    s.openDebug(); s.debugTravelTo({ world: "volcano" });
    expect(s.getState().rupees).toBe(10);
    expect(rabbitsHome(s.getState().rabbits)).toBe(true);
    s.debugTravelTo({ world: "volcano-interior" }); expect(s.getState().rupees).toBe(10);
    expect(storage.getItem()).toBe(saved);
    s.debugEndSession();
    expect(s.getState().rabbits).toEqual({ cream: true, brown: false, gray: false });
    expect(s.getState().rupees).toBe(0);
  });
  it("alternates free care, rejects repeats during the animation and never grants more money", () => {
    const s = createGameStore(); completeRabbitQuest(s);
    fetchRabbit(s); const care = s.getState().rabbitCare!;
    expect(care.action).toBe("feed");
    fetchRabbit(s); expect(s.getState().rabbitCare).toEqual(care);
    s.finishRabbitCare(care.sequence - 1); expect(s.getState().rabbitCare).toEqual(care);
    s.finishRabbitCare(care.sequence); fetchRabbit(s);
    expect(s.getState().rabbitCare?.action).toBe("pet");
    expect(s.getState().rupees).toBe(10);
  });
});

describe("rabbit world", () => {
  it("blocks both portal entry mechanisms until all rabbits are home and keeps return travel", () => {
    const world = new World(), interactions = new InteractionSystem(new Scene());
    const opening = world.root.getObjectByName("volcano-portal")!.children.find(o => o instanceof Mesh && o.geometry.type === "PlaneGeometry")!;
    try {
      unlock();
      expect(opening.visible).toBe(false);
      interactions.update(new Vector3(VOLCANO_ENTRANCE.x, 0, VOLCANO_ENTRANCE.z), world, 0);
      gameStore.travelTo({ world: "volcano" }); expect(gameStore.getState().location).toBeNull();
      fetchRabbit(gameStore); gameStore.bringRabbitHome("cream");
      fetchRabbit(gameStore, "brown"); gameStore.bringRabbitHome("brown");
      expect(world.passages().some(p => p.destination?.world)).toBe(false);
      fetchRabbit(gameStore, "gray"); gameStore.bringRabbitHome("gray");
      gameStore.close(); world.update(0, 0);
      expect(opening.visible).toBe(true);
      interactions.update(new Vector3(VOLCANO_ENTRANCE.x, 0, VOLCANO_ENTRANCE.z), world, 0);
      expect(gameStore.getState().location?.world).toBe("volcano");
      gameStore.travelTo(null); expect(gameStore.getState().location).toBeNull();
    } finally { world.dispose(); disposeTree(interactions.ring); disposeTree(interactions.arrow); }
  });
  it("follows around a solid obstacle without crossing it and leaves a gap", () => {
    const collision = new CollisionSystem(10, 10); collision.add(0, 0, 0.7, 2);
    const follower = new RabbitFollower(), position = { x: -2, z: 0 }, player = { x: 2, z: 0 };
    const visited: number[] = [];
    for (let frame = 0; frame < 300; frame++) {
      follower.update(position, player, 1 / 60, collision, 0.65);
      expect(collision.free(position.x, position.z, 0.25)).toBe(true); visited.push(Math.abs(position.z));
    }
    expect(Math.max(...visited)).toBeGreaterThan(2.25);
    expect(Math.hypot(position.x - player.x, position.z - player.z)).toBeCloseTo(0.65, 1);
  });
  it("follows at 90 percent of the player's walking speed", () => {
    const collision = new CollisionSystem(20, 20);
    const follower = new RabbitFollower(), position = { x: 0, z: 0 };
    follower.update(position, { x: 0, z: 10 }, 1, collision, 0.65);
    expect(position.z).toBeCloseTo(PLAYER_WALK_SPEED * 0.9, 5);
  });
  it("faces the farmer away from the barn and places the sign along the right fence", () => {
    const root = new Group(), collision = new CollisionSystem(30, 40);
    const farm = new RabbitFarm(root, collision, createGameStore());
    try {
      const barn = root.getObjectByName("rabbit-barn")!;
      const sign = root.getObjectByName("rabbit-sign")!;
      const farmer = root.getObjectByName("farmer")!;
      expect(barn.scale.toArray()).toEqual([1.15, 1.15, 1.15]);
      const awayFromBarn = farmer.position.clone().sub(barn.position).setY(0).normalize();
      const front = new Vector3(0, 0, 1).applyQuaternion(farmer.quaternion);
      expect(front.dot(awayFromBarn)).toBeCloseTo(1, 5);
      expect(sign.position.x - FARM_YARD.x).toBeCloseTo(1.78);
      expect(sign.position.z - FARM_YARD.z).toBeCloseTo(0.875);
      expect(new Vector3(0, 0, 1).applyQuaternion(sign.quaternion).x).toBeCloseTo(1);
    } finally { disposeTree(root); void farm; }
  });
  it("keeps the pen entrance and rabbit homes accessible while blocking its fences", () => {
    const world = new World();
    try {
      const { x, z } = FARM_YARD;
      const player = { x, z: z - 0.55 };
      world.collision.move(player, 0, 1.7);
      expect(player.z).toBeCloseTo(z + 1.15);
      world.collision.move(player, 0, 2);
      expect(player.z).toBeLessThan(z + 1.9);
      for (const side of [-1, 1]) {
        const visitor = { x, z: z + 0.9 };
        world.collision.move(visitor, side * 3, 0);
        expect(Math.abs(visitor.x - x)).toBeLessThan(1.7);
      }
      for (const { home } of RABBITS) {
        for (const dx of [-0.16, 0.16]) for (const dz of [-0.16, 0.16]) {
          expect(world.collision.free(home.x + dx, home.z + dz)).toBe(true);
        }
      }
    } finally { world.dispose(); }
  });
  it("walks each rabbit home in the real glade and pauses followers during dialogue", () => {
    unlock(); const world = new World(); const player = new Vector3(); let time = 0;
    const advance = () => { time += 1 / 60; world.update(1 / 60, time, player); };
    try {
      for (const rabbit of world.farm.rabbits) {
        const { id, position } = rabbit.definition;
        expect(world.collision.free(position.x, position.z)).toBe(true);
        player.set(position.x, 0, position.z);
        fetchRabbit(gameStore, id); advance();
        expect(world.farm.interactions().some(i => typeof i.target === "object" && i.target?.kind === "rabbit" && i.target.id === id)).toBe(false);
        gameStore.pause(); const before = rabbit.root.position.clone(); player.x += 0.5; advance();
        expect(rabbit.root.position.equals(before)).toBe(true); gameStore.close();
        const route = rabbitRoute(world.collision, player, FARM_YARD);
        expect(route.length).toBeGreaterThan(0);
        for (const waypoint of route) {
          for (let i = 0; i < 1000 && Math.hypot(player.x - waypoint.x, player.z - waypoint.z) > 0.01; i++) {
            const d = Math.hypot(waypoint.x - player.x, waypoint.z - player.z), step = Math.min(d, 0.04);
            player.x += (waypoint.x - player.x) / d * step; player.z += (waypoint.z - player.z) / d * step; advance();
            expect(world.collision.free(rabbit.root.position.x, rabbit.root.position.z, 0.25)).toBe(true);
          }
        }
        for (let i = 0; i < 300; i++) advance();
        expect(gameStore.getState().rabbits[id], id).toBe(true);
      }
      expect(gameStore.getState()).toMatchObject({ rupees: 10, overlay: "rabbitReward" });
      gameStore.close(); advance();
      expect(world.root.getObjectByName("rabbit-garden-flowers")!.visible).toBe(true);
    } finally { world.dispose(); }
  });
  it("restores delivered models, resets unreturned models and completes bounded heart animations", () => {
    const root = new Group(), collision = new CollisionSystem(30, 40), s = createGameStore();
    unlock(s); const farm = new RabbitFarm(root, collision, s);
    try {
      fetchRabbit(s); farm.update(0.1, 0.1, new Vector3(-3, 0, 19));
      s.travelTo({ castle: "hall" }); s.travelTo(null); farm.update(0, 0);
      expect(farm.rabbits[0].root.position.x).toBe(RABBITS[0].position.x);
      completeRabbitQuest(s); farm.update(0.1, 0.2);
      fetchRabbit(s); farm.update(0.1, 0.3); s.pause();
      for (let i = 0; i < 20; i++) farm.update(0.1, 1);
      expect(s.getState().rabbitCare).not.toBeNull(); s.close();
      for (let i = 0; i < 20; i++) farm.update(0.1, 2);
      expect(s.getState().rabbitCare).toBeNull(); expect(s.getState().rupees).toBe(10);
      s.reset(); farm.update(0, 0); expect(root.getObjectByName("rabbit-garden-flowers")!.visible).toBe(false);
    } finally { disposeTree(root); }
  });
  it("shows brief glitter feedback when a rabbit starts following", () => {
    const root = new Group(), collision = new CollisionSystem(30, 40), s = createGameStore();
    unlock(s); const farm = new RabbitFarm(root, collision, s);
    const effect = root.getObjectByName("rabbit-follow-effect-cream")!;
    try {
      expect(effect.visible).toBe(false);
      fetchRabbit(s); farm.update(0.01, 0.01);
      expect(effect.visible).toBe(true);
      expect(effect.children.filter(child => child.visible)).toHaveLength(8);
      farm.update(1, 1.01);
      expect(effect.visible).toBe(false);
    } finally { disposeTree(root); }
  });
});
