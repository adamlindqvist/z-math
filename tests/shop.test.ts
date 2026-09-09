import {
  pickInteraction,
  InteractionSystem,
} from "../src/game/InteractionSystem";
import { GameCamera } from "../src/game/Camera";
import { describe, it, expect } from "vitest";
import { Vector2, Vector3, Scene, Raycaster } from "three";
import {
  createGameStore,
  gameStore,
  parseSave,
  RUPEE_IDS,
} from "../src/store/gameStore";
import { SHOP, SHOP_IDS } from "../src/items/shop";
import { Player } from "../src/game/Player";
import {
  CastleArea,
  ShopScene,
  CASTLE_ENTRANCE,
} from "../src/game/castle/CastleArea";
import { World } from "../src/game/World";
import { disposeTree } from "../src/game/Area";
import type { ItemId } from "../src/items/definitions";
function setup() {
  let saved = "";
  const storage = {
    getItem: () => saved,
    setItem: (_: string, v: string) => {
      saved = v;
    },
  };
  return {
    s: createGameStore(storage),
    storage,
    get raw() {
      return saved;
    },
  };
}
import { BUTTERFLY_SECRETS } from "../src/game/secrets/definitions";
function funded(pickups = 4) {
  const f = setup();
  const { s } = f;
  const secret = BUTTERFLY_SECRETS[0];
  s.discoverSecret(secret.id);
  s.revealSecret(secret.id);
  s.setTarget({ kind: "chest", id: secret.chestId, label: "Öppna" });
  s.interact();
  s.close();
  for (const id of RUPEE_IDS.filter((id) => id.startsWith("path-")).slice(
    0,
    pickups,
  ))
    s.collect(id);
  return f;
}
function enter(s: ReturnType<typeof createGameStore>) {
  s.travelTo({ castle: "hall" });
  s.travelTo({ castle: "shop" });
  s.setTarget({ kind: "shop", label: "Handla" });
  s.interact();
}
describe("castle shop", () => {
  it("rejects unavailable purchases and nonadjacent travel", () => {
    const s = createGameStore();
    s.travelTo({ castle: "shop" });
    expect(s.getState().location).toBeNull();
    expect(s.buyItem("green-hat")).toBe(false);
    enter(s);
    expect(s.buyItem("green-hat")).toBe(false);
    expect(s.buyItem("missing" as ItemId)).toBe(false);
    expect(s.getState().rupees).toBe(0);
    expect(s.getState().purchases).toEqual([]);
    s.travelTo(null);
    expect(s.getState().location).toEqual({ castle: "shop" });
    s.close();
    s.travelTo(null);
    expect(s.getState().location).toEqual({ castle: "shop" });
    s.travelTo({ castle: "hall" });
    s.travelTo(null);
    expect(s.getState().location).toBeNull();
  });
  it("saves purchases atomically and rejects duplicate spending or corrupt history", () => {
    const f = funded();
    const { s } = f;
    expect(s.getState().rupees).toBe(14);
    // Another real five-rupee chest gives enough to buy the hat.
    s.setTarget({ kind: "chest", id: "glade", label: "Öppna" });
    s.interact();
    s.beginQuiz();
    for (let i = 0; i < 3; i++) {
      s.answer(s.getState().question!.correctAnswer);
      s.finishQuiz();
    }
    s.close();
    enter(s);
    const before = s.getState().rupees;
    expect(before).toBeGreaterThanOrEqual(15);
    expect(s.buyItem("green-hat")).toBe(true);
    expect(s.buyItem("green-hat")).toBe(false);
    expect(s.getState().rupees).toBe(before - 15);
    s.equipItem("green-hat", "head");
    const restored = createGameStore(f.storage);
    expect(restored.getState().equipment.head).toBe("green-hat");
    expect(restored.getState().rupees).toBe(before - 15);
    for (const change of [
      { purchases: ["green-hat", "green-hat"] },
      { purchases: ["missing"] },
      { rupees: before },
      { version: 8 },
      { items: ["green-clothes"] },
    ])
      expect(
        parseSave(JSON.stringify({ ...JSON.parse(f.raw), ...change }))
          .purchases,
      ).toEqual([]);
  });
  it("accepts exact funds and keeps playing when saving fails", () => {
    const f = funded(0),
      s = f.s;
    s.setTarget({ kind: "chest", id: "glade", label: "Öppna" });
    s.interact();
    s.beginQuiz();
    for (let i = 0; i < 3; i++) {
      s.answer(s.getState().question!.correctAnswer);
      s.finishQuiz();
    }
    s.close();
    expect(s.getState().rupees).toBe(15);
    const offline = createGameStore({
      getItem: () => f.raw,
      setItem: () => {
        throw Error("storage blocked");
      },
    });
    enter(offline);
    expect(offline.buyItem("green-hat")).toBe(true);
    expect(offline.getState()).toMatchObject({
      rupees: 0,
      savingAvailable: false,
      purchases: ["green-hat"],
    });
    offline.equipItem("green-hat", "head");
    expect(offline.getState().equipment.head).toBe("green-hat");
  });
  it("shows cosmetic variants and restores the original outfit", () => {
    const s = createGameStore();
    s.grantItems(SHOP_IDS);
    const player = new Player();
    for (const id of SHOP_IDS) {
      const slot =
        id === "green-hat"
          ? "head"
          : id === "blue-tunic"
            ? "body"
            : id === "wooden-sword"
              ? "weapon"
              : "shield";
      s.equipItem(id, slot);
    }
    player.setEquipment(s.getState().equipment);
    expect(player.root.getObjectByName("base-hat")!.visible).toBe(false);
    expect(player.root.getObjectByName("wood-sword")!.visible).toBe(true);
    expect(player.model.coat.color.getHexString()).toBe("3489cb");
    for (const slot of ["head", "body", "weapon", "shield"] as const)
      s.unequipItem(slot);
    player.setEquipment(s.getState().equipment);
    expect(player.root.getObjectByName("base-hat")!.visible).toBe(true);
    expect(player.root.getObjectByName("wood-shield")!.visible).toBe(false);
    expect(player.model.coat.color.getHexString()).toBe("36964a");
    disposeTree(player.root);
  });
  it("selects nearby visible 3D goods and rejects distant or occluded taps", () => {
    const shop = new ShopScene();
    shop.root.updateMatrixWorld(true);
    const camera = new GameCamera();
    camera.resize(1024, 768);
    camera.setMode("room", new Vector3());
    camera.camera.updateMatrixWorld(true);
    const model = shop.root.getObjectByName("wooden-shield")!;
    const projected = model
      .getWorldPosition(new Vector3())
      .project(camera.camera);
    const point = new Vector2(projected.x, projected.y);
    const near = new Vector3(2.9, 0, 1.3);
    expect(pickInteraction(shop, near, camera.camera, point)).toMatchObject({
      kind: "shop",
      itemId: "wooden-shield",
    });
    expect(
      pickInteraction(shop, new Vector3(-3, 0, 3), camera.camera, point),
    ).toBeNull();
    shop.collision.add(2.9, 1.45, 0.8, 0.1);
    expect(
      pickInteraction(shop, new Vector3(2.9, 0, 1.9), camera.camera, point),
    ).toBeNull();
    shop.dispose();
  });
  it("aligns side doors with the walls and enters the shop horizontally", () => {
    const hall = new CastleArea();
    const shopDoor = hall.root.getObjectByName("castle-door-Butik")!;
    const library = hall.root.getObjectByName("castle-door-Bibliotek")!;
    expect(shopDoor.position.x).toBe(4.65);
    expect(shopDoor.rotation.y).toBe(-Math.PI / 2);
    expect(shopDoor.getObjectByName("closed-door")).toBeUndefined();
    expect(library.position.x).toBe(-4.65);
    expect(library.rotation.y).toBe(Math.PI / 2);
    expect(library.getObjectByName("closed-door")).toBeDefined();
    expect(hall.collision.free(-4.3, 0)).toBe(false);
    const player = new Vector3(3, 0, 0);
    const scene = new Scene(),
      interactions = new InteractionSystem(scene);
    gameStore.reset();
    gameStore.travelTo({ castle: "hall" });
    interactions.update(player, hall, 0);
    expect(gameStore.getState().location).toEqual({ castle: "hall" });
    hall.collision.move(player, 1.1, 0);
    expect(player.x).toBeCloseTo(4.1);
    interactions.update(player, hall, 0);
    expect(gameStore.getState().location).toEqual({ castle: "shop" });
    gameStore.reset();
    hall.dispose();
    disposeTree(scene);
  });
  it("puts the shop exit on the left wall, mirroring the way in", () => {
    const shop = new ShopScene();
    const exit = shop.root.getObjectByName("castle-door-Utgång")!;
    expect(exit.position.x).toBe(-4.2);
    expect(exit.rotation.y).toBe(Math.PI / 2);
    // The front wall is closed now, so no passage leads south.
    expect(shop.passages()).toEqual([
      {
        x: -3.65,
        z: 0,
        rotation: Math.PI / 2,
        destination: { castle: "hall" },
      },
    ]);
    expect(shop.collision.free(0, 3.9)).toBe(false);
    const scene = new Scene(),
      interactions = new InteractionSystem(scene);
    gameStore.reset();
    gameStore.travelTo({ castle: "hall" });
    gameStore.travelTo({ castle: "shop" });
    const player = new Vector3(shop.spawn.x, 0, shop.spawn.z);
    interactions.update(player, shop, 0);
    expect(gameStore.getState().location).toEqual({ castle: "shop" });
    shop.collision.move(player, -0.6, 0);
    interactions.update(player, shop, 0);
    expect(gameStore.getState().location).toEqual({ castle: "hall" });
    gameStore.reset();
    shop.dispose();
    disposeTree(scene);
  });
  it("leaves the exterior arch visibly hollow and the threshold walkable", () => {
    const world = new World(),
      castle = world.root.getObjectByName("castle")!;
    world.root.updateMatrixWorld(true);
    const ray = new Raycaster(
      new Vector3(castle.position.x, 0.8, castle.position.z + 2),
      new Vector3(0, 0, -1),
    );
    const hit = ray.intersectObject(castle, true)[0];
    expect(hit.point.z).toBeLessThan(castle.position.z + 0.5);
    expect(world.collision.free(CASTLE_ENTRANCE.x, CASTLE_ENTRANCE.z)).toBe(
      true,
    );
    world.dispose();
  });
  it("keeps entrances reachable and displays four distinct goods", () => {
    const world = new World();
    const position = { x: -6.2, z: 2.9 };
    for (const destination of [
      { x: CASTLE_ENTRANCE.x, z: 2.9 },
      CASTLE_ENTRANCE,
    ]) {
      world.collision.move(
        position,
        destination.x - position.x,
        destination.z - position.z,
      );
      expect(position.x).toBeCloseTo(destination.x);
      expect(position.z).toBeCloseTo(destination.z);
    }
    expect(world.collision.free(CASTLE_ENTRANCE.x, CASTLE_ENTRANCE.z)).toBe(
      true,
    );
    world.dispose();
    const hall = new CastleArea(),
      shop = new ShopScene();
    for (const area of [hall, shop]) {
      expect(area.collision.free(area.spawn.x, area.spawn.z)).toBe(true);
      for (const p of area.passages())
        expect(area.collision.free(p.x, p.z)).toBe(true);
    }
    expect(hall.collision.free(0, -3.8)).toBe(true);
    expect(
      shop.interactions(createGameStore().getState(), new Vector3()),
    ).toHaveLength(5);
    for (const id of SHOP_IDS)
      expect(shop.root.getObjectByName(id)).toBeDefined();
    hall.dispose();
    shop.dispose();
    expect(Object.values(SHOP)).toEqual([15, 20, 30, 25]);
  });
});
