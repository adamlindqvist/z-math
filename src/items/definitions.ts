export type EquipmentSlot = "head" | "body" | "weapon" | "shield";
export type ItemCategory =
  "currency" | "cosmetic" | "equipment" | "quest" | "collectible";
export type ItemDefinition = {
  name: string;
  category: ItemCategory;
  equipSlot?: EquipmentSlot;
  description?: string;
  icon: "shirt" | "sword" | "shield" | "package" | "hat";
};
export const ITEMS = {
  "green-hat": {
    name: "Grön äventyrsmössa",
    description: "En fin mössa med fjäder!",
    category: "cosmetic",
    equipSlot: "head",
    icon: "hat",
  },
  "blue-tunic": {
    name: "Blå tunika",
    description: "Blå kläder för nya äventyr!",
    category: "cosmetic",
    equipSlot: "body",
    icon: "shirt",
  },
  "wooden-sword": {
    name: "Träsvärd",
    description: "Ett fint svärd av trä!",
    category: "cosmetic",
    equipSlot: "weapon",
    icon: "sword",
  },
  "wooden-shield": {
    name: "Träsköld",
    description: "En stadig sköld för små äventyrare!",
    category: "cosmetic",
    equipSlot: "shield",
    icon: "shield",
  },
  "green-clothes": {
    name: "Gröna kläder",
    category: "cosmetic",
    equipSlot: "body",
    icon: "shirt",
  },
  "fire-sword": {
    name: "Eldsvärd",
    category: "equipment",
    equipSlot: "weapon",
    icon: "sword",
  },
  "fire-shield": {
    name: "Eldsköld",
    category: "equipment",
    equipSlot: "shield",
    icon: "shield",
  },
  "temple-sword": {
    name: "Svärd",
    category: "equipment",
    equipSlot: "weapon",
    icon: "sword",
  },
  "temple-shield": {
    name: "Sköld",
    category: "equipment",
    equipSlot: "shield",
    icon: "shield",
  },
} as const satisfies Record<string, ItemDefinition>;
export type ItemId = keyof typeof ITEMS;
export type Equipment = Record<EquipmentSlot, ItemId | null>;
export interface Inventory {
  items: ItemId[];
  equipment: Equipment;
}
export const freshInventory = (): Inventory => ({
  items: ["green-clothes"],
  equipment: { head: null, body: "green-clothes", weapon: null, shield: null },
});
export function isItemId(id: unknown): id is ItemId {
  return typeof id === "string" && Object.hasOwn(ITEMS, id);
}
export function receiveItems(
  inventory: Inventory,
  ids: readonly ItemId[],
  equip = false,
): Inventory {
  const items = [...inventory.items];
  const equipment = { ...inventory.equipment };
  for (const id of ids) {
    if (!isItemId(id) || items.includes(id)) continue;
    items.push(id);
    const item: ItemDefinition = ITEMS[id];
    if (equip && item.equipSlot) equipment[item.equipSlot] = id;
  }
  return { items, equipment };
}
export function validInventory(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const p = value as Inventory;
  if (
    !Array.isArray(p.items) ||
    !p.items.every(isItemId) ||
    new Set(p.items).size !== p.items.length ||
    !p.items.includes("green-clothes") ||
    !p.equipment ||
    typeof p.equipment !== "object" ||
    Object.keys(p.equipment).length !== 4
  )
    return false;
  return (["head", "body", "weapon", "shield"] as const).every((slot) => {
    const id = p.equipment[slot];
    return id === null
      ? slot !== "body"
      : isItemId(id) && p.items.includes(id) && ITEMS[id].equipSlot === slot;
  });
}
