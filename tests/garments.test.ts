import { describe, expect, it, vi } from "vitest";
import { Mesh } from "three";
import { forestGarment, garmentModel } from "../src/items/garments";
import { freshInventory } from "../src/items/definitions";
import { itemModel } from "../src/items/models";
import { heroModel, applyEquipment } from "../src/game/heroModel";
import { disposeTree } from "../src/game/Area";

describe("garment composition", () => {
  it("shares the full design between display and worn clothing, and releases replaced parts", () => {
    const hero = heroModel();
    const equipment = {
      ...freshInventory().equipment,
      body: "blue-tunic" as const,
    };
    applyEquipment(hero, equipment);
    const worn = hero.body.children[0];
    const display = itemModel("blue-tunic");
    expect(worn.children.map((p) => p.name)).toEqual(
      display.children[0].children.map((p) => p.name),
    );
    const shirt = worn.getObjectByName("undershirt") as Mesh;
    const disposed = vi.spyOn(shirt.geometry, "dispose");
    applyEquipment(hero, equipment);
    expect(hero.body.children[0]).toBe(worn);
    expect(disposed).not.toHaveBeenCalled();
    applyEquipment(hero, freshInventory().equipment);
    expect(disposed).toHaveBeenCalledOnce();
    expect(worn.parent).toBeNull();
    expect(hero.body.getObjectByName("undershirt")).toBeUndefined();
    disposeTree(hero.root);
    disposeTree(display);
  });
  it("accepts extra accessory geometry without changing the hero and owns independent resources", () => {
    const custom = garmentModel({
      ...forestGarment,
      parts: [
        ...forestGarment.parts,
        {
          name: "test-accessory",
          section: "accessories",
          material: "leather",
          position: [0.3, 0, 0],
          shape: { kind: "box", size: [0.1, 0.1, 0.1] },
        },
      ],
    });
    const other = garmentModel(forestGarment);
    expect(custom.getObjectByName("test-accessory")).toBeDefined();
    expect((custom.children[0] as Mesh).material).not.toBe(
      (other.children[0] as Mesh).material,
    );
    disposeTree(custom);
    disposeTree(other);
  });
});
