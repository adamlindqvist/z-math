import { isItemId, type ItemId } from "./definitions";
export const SHOP = {
  "green-hat": 15,
  "blue-tunic": 20,
  "wooden-sword": 30,
  "wooden-shield": 25,
} as const satisfies Partial<Record<ItemId, number>>;
export type ShopItemId = keyof typeof SHOP;
export const SHOP_IDS = Object.keys(SHOP) as ShopItemId[];
export function isShopItem(id: unknown): id is ShopItemId {
  return isItemId(id) && Object.hasOwn(SHOP, id);
}
export function validPurchases(
  value: unknown,
  items: ItemId[],
): value is ShopItemId[] {
  return (
    Array.isArray(value) &&
    value.every((id) => isShopItem(id) && items.includes(id)) &&
    new Set(value).size === value.length
  );
}
export const purchaseTotal = (ids: ShopItemId[]) =>
  ids.reduce((sum, id) => sum + SHOP[id], 0);
