export type EquipmentSlot = "clothes" | "sword" | "shield";
export type ItemDefinition = {
  name: string;
  category: EquipmentSlot | "other";
  icon: "shirt" | "sword" | "shield" | "package";
};
export const ITEMS = {
  "green-clothes": { name: "Gröna kläder", category: "clothes", icon: "shirt" },
  "fire-sword": { name: "Eldsvärd", category: "sword", icon: "sword" },
  "fire-shield": { name: "Eldsköld", category: "shield", icon: "shield" },
  "temple-sword": { name: "Svärd", category: "sword", icon: "sword" },
  "temple-shield": { name: "Sköld", category: "shield", icon: "shield" },
} as const satisfies Record<string, ItemDefinition>;
export type ItemId = keyof typeof ITEMS;
export type Equipment = Record<EquipmentSlot, ItemId | null>;
export interface Inventory {
  items: ItemId[];
  equipment: Equipment;
}
export const freshInventory = (): Inventory => ({
  items: ["green-clothes"],
  equipment: { clothes: "green-clothes", sword: null, shield: null },
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
    if (equip && item.category !== "other") equipment[item.category] = id;
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
    Object.keys(p.equipment).length !== 3
  )
    return false;
  return (["clothes", "sword", "shield"] as const).every((slot) => {
    const id = p.equipment[slot];
    return id === null
      ? slot !== "clothes"
      : isItemId(id) && p.items.includes(id) && ITEMS[id].category === slot;
  });
}
