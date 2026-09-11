import { gladePosition } from "../gladeLayout";

// Keep the barn, yard, home positions and approach together when moving the farm.
export const farmPosition = (x: number, z: number) => gladePosition(x - 1.8, z);
export const FOLLOW_GAP = 1.05;

export const RABBITS = [
  { id: "cream", color: "#fff1d2", position: gladePosition(-3, 15), home: farmPosition(-2.3, 22.4) },
  { id: "brown", color: "#b67a4b", position: gladePosition(3, 19), home: farmPosition(-1.6, 22.6) },
  { id: "gray", color: "#a4b4c5", position: gladePosition(2, 25.5), home: farmPosition(-0.9, 22.7) },
] as const;
export type RabbitId = (typeof RABBITS)[number]["id"];
export type RabbitProgress = Record<RabbitId, boolean>;
export const freshRabbits = (): RabbitProgress => ({ cream: false, brown: false, gray: false });
export const rabbitsHome = (rabbits: RabbitProgress) => RABBITS.every(({ id }) => rabbits[id]);
export const FARMER_POSITION = farmPosition(-1.7, 21);
export const FARM_YARD = farmPosition(-1.6, 22);
export const HOME_RADIUS = 2.35;
export const validRabbits = (value: unknown): value is RabbitProgress =>
  !!value && typeof value === "object" && Object.keys(value).length === 3 &&
  RABBITS.every(({ id }) => typeof (value as RabbitProgress)[id] === "boolean");
