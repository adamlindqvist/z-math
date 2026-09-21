export const ARMY = [
  { id: "left", x: -3.5, z: -9.5 },
  { id: "center", x: 0, z: -11.5 },
  { id: "right", x: 3.5, z: -9.5 },
] as const;
export type ArmyId = (typeof ARMY)[number]["id"];
/** Additive save field: older saves and malformed army data keep all other progress. */
export function parseArmy(value: unknown): ArmyId[] {
  return ARMY.filter(b => Array.isArray(value) && value.includes(b.id)).map(b => b.id);
}
