import { describe, expect, it } from "vitest";
import { createGameStore, parseSave } from "../src/store/gameStore";
import { freshInventory, type ItemId } from "../src/items/definitions";
import { Player } from "../src/game/Player";

describe("inventory", () => {
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
    s.equipItem("temple-sword", "sword");
    expect(s.getState().equipment.sword).toBeNull();
    s.grantItems(["temple-sword", "temple-shield", "temple-sword"]);
    s.equipItem("temple-shield", "sword");
    s.equipItem("missing" as ItemId, "sword");
    expect(s.getState().equipment.sword).toBeNull();
    s.equipItem("temple-sword", "sword");
    s.equipItem("temple-shield", "shield");
    s.unequipItem("clothes");
    expect(s.getState().equipment.clothes).toBe("green-clothes");
    s.unequipItem("sword");
    s.grantItems(["temple-sword"], true);
    expect(s.getState().equipment.sword).toBeNull();
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
        p.equipment.clothes = null;
      },
      (p: typeof good) => {
        p.equipment.sword = "temple-shield";
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
    s.unequipItem("sword");
    player.setEquipment(s.getState().equipment);
    expect(sword.visible).toBe(false);
    expect(shield.visible).toBe(true);
    s.reset();
    player.setEquipment(s.getState().equipment);
    expect(shield.visible).toBe(false);
    expect(s.getState().savingAvailable).toBe(false);
  });
});
