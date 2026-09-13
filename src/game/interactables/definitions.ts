import type { Location } from "../dungeons/definitions";
import type { PuzzleId } from "../puzzles/definitions";
import type { SoundEvent } from "../../audio/types";
export type ObjectBehavior =
  | { kind: "symbol"; puzzle: PuzzleId }
  | { kind: "pickup"; pickup: string; position: { x: number; z: number } }
  | { kind: "clue" }
  | { kind: "reaction" }
  | { kind: "animal"; animal: "elephant" | "giraffe" };
export type ObjectDefinition = {
  location: Location; x: number; z: number; label: string;
  behavior: ObjectBehavior; sound: SoundEvent;
};
const room = { castle: "throne" } as const;
export const WORLD_OBJECTS = {
  ella: { location: { world: "water" }, x: -3, z: 8, label: "Prata", behavior: { kind: "animal", animal: "elephant" }, sound: "interact" },
  gullan: { location: { world: "desert" }, x: -3, z: 8, label: "Prata", behavior: { kind: "animal", animal: "giraffe" }, sound: "interact" },
  "sea-anemone": { location: { world: "water" }, x: -4, z: 16, label: "Rör försiktigt", behavior: { kind: "reaction" }, sound: "plop" },
  "pearl-clam": { location: { world: "water" }, x: 4, z: 10, label: "Titta i musslan", behavior: { kind: "reaction" }, sound: "plop" },
  "desert-palm": { location: { world: "desert" }, x: -4, z: 16, label: "Prassla", behavior: { kind: "reaction" }, sound: "wind" },
  "sand-pot": { location: { world: "desert" }, x: 4, z: 10, label: "Puffa", behavior: { kind: "reaction" }, sound: "plop" },
  "royal-shield": { location: room, x: -2.05, z: -1.6, label: "Tryck", behavior: { kind: "symbol", puzzle: "royal-symbols" }, sound: "click" },
  "royal-armour": { location: room, x: 3.7, z: -2, label: "Tryck", behavior: { kind: "symbol", puzzle: "royal-symbols" }, sound: "click" },
  "royal-portrait": { location: room, x: -1.9, z: -3, label: "Tryck", behavior: { kind: "symbol", puzzle: "royal-symbols" }, sound: "click" },
  "royal-throne": { location: room, x: 0, z: -1.3, label: "Titta", behavior: { kind: "reaction" }, sound: "interact" },
  "loose-helmet": { location: room, x: 3.7, z: 0.7, label: "Tryck", behavior: { kind: "pickup", pickup: "royal-helmet-rupee", position: { x: 3.65, z: 1.1 } }, sound: "metal" },
  "royal-pot": { location: room, x: 2.1, z: 2.9, label: "Lyft locket", behavior: { kind: "pickup", pickup: "royal-pot-rupee", position: { x: 2.1, z: 2.65 } }, sound: "plop" },
  "royal-book": { location: room, x: -1.85, z: 2.8, label: "Titta i boken", behavior: { kind: "clue" }, sound: "interact" },
  "royal-map": { location: room, x: -3.4, z: 2.25, label: "Titta på kartan", behavior: { kind: "reaction" }, sound: "plop" },
  "royal-window": { location: room, x: -3.7, z: -0.65, label: "Titta ut", behavior: { kind: "reaction" }, sound: "wind" },
} as const satisfies Record<string, ObjectDefinition>;
export type WorldObjectId = keyof typeof WORLD_OBJECTS;
export const OBJECT_IDS = Object.keys(WORLD_OBJECTS) as WorldObjectId[];
export const PICKUP_OBJECTS = OBJECT_IDS.filter(id => WORLD_OBJECTS[id].behavior.kind === "pickup");
export function sameLocation(a: Location, b: Location) { return JSON.stringify(a) === JSON.stringify(b); }
export function validWorldObjects(value: unknown): value is WorldObjectId[] {
  return Array.isArray(value) && new Set(value).size === value.length && value.every(id => PICKUP_OBJECTS.includes(id));
}
