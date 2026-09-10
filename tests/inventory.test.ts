import { describe, expect, it } from "vitest";
import { createGameStore, parseSave } from "../src/store/gameStore";
import { freshInventory, type ItemId } from "../src/items/definitions";
import { Player } from "../src/game/Player";

describe("inventory", () => {
  it("removes and restores the starter hat and persists bareheaded play", () => {
    let raw = "";
    const storage = { getItem: () => raw, setItem: (_: string, value: string) => { raw = value; } };
    const s = createGameStore(storage);
    const player = new Player();
    const hat = player.root.getObjectByName("base-hat")!;
    expect(hat.visible).toBe(true);
    s.unequipItem("head");
    const restored = createGameStore(storage);
    expect(restored.getState().items).toContain("base-hat");
    expect(restored.getState().equipment.head).toBeNull();
    player.setEquipment(restored.getState().equipment);
    expect(hat.visible).toBe(false);
    restored.equipItem("base-hat", "head");
    player.setEquipment(restored.getState().equipment);
    expect(hat.visible).toBe(true);
    expect(createGameStore(storage).getState().equipment.head).toBe("base-hat");
  });
  it("grants once, validates equipment, keeps clothes on and persists changes", () => {
    let raw = "";
    const storage = {
      getItem: () => raw,
      setItem: (_: string, value: string) => {
        raw = value;
      },
    };
    const s = createGameStore(storage);
    expect(s.getState()).toMatchObject(freshInventory());
    s.equipItem("temple-sword", "weapon");
    expect(s.getState().equipment.weapon).toBeNull();
    s.grantItems(["temple-sword", "temple-shield", "temple-sword"]);
    s.equipItem("temple-shield", "weapon");
    s.equipItem("missing" as ItemId, "weapon");
    expect(s.getState().equipment.weapon).toBeNull();
    s.equipItem("temple-sword", "weapon");
    s.equipItem("temple-shield", "shield");
    s.unequipItem("body");
    expect(s.getState().equipment.body).toBe("green-clothes");
    s.unequipItem("weapon");
    s.grantItems(["temple-sword"], true);
    expect(s.getState().equipment.weapon).toBeNull();
    expect(createGameStore(storage).getState()).toMatchObject({
      items: s.getState().items,
      equipment: s.getState().equipment,
    });
    const good = JSON.parse(raw);
    for (const edit of [
      (p: typeof good) => {
        p.items.push("missing");
      },
      (p: typeof good) => {
        p.items.push("green-clothes");
      },
      (p: typeof good) => {
        p.equipment.body = null;
      },
      (p: typeof good) => {
        p.equipment.weapon = "temple-shield";
      },
      (p: typeof good) => {
        p.items = ["green-clothes"];
      },
      (p: typeof good) => {
        p.version = 3;
      },
    ]) {
      const bad = structuredClone(good);
      edit(bad);
      expect(parseSave(JSON.stringify(bad))).toMatchObject(freshInventory());
    }
  });
  it("works without storage and updates the existing player meshes", () => {
    const s = createGameStore({
      getItem: () => {
        throw Error();
      },
      setItem: () => {
        throw Error();
      },
    });
    const player = new Player();
    const sword = player.root.getObjectByName("sword")!,
      shield = player.root.getObjectByName("shield")!;
    expect(sword.visible).toBe(false);
    expect(shield.visible).toBe(false);
    s.grantItems(["temple-sword", "temple-shield"], true);
    player.setEquipment(s.getState().equipment);
    expect(sword.visible).toBe(true);
    expect(shield.visible).toBe(true);
    s.unequipItem("weapon");
    player.setEquipment(s.getState().equipment);
    expect(sword.visible).toBe(false);
    expect(shield.visible).toBe(true);
    s.reset();
    player.setEquipment(s.getState().equipment);
    expect(shield.visible).toBe(false);
    expect(s.getState().savingAvailable).toBe(false);
  });
});
