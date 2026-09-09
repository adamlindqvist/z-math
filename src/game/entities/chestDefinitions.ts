import type { ItemId } from "../../items/definitions";
import type { Location } from "../dungeons/definitions";
import type { PuzzleId } from "../puzzles/definitions";
export type ChestDefinition = { opening: "quiz" | "direct"; reward: number; location: Location; items?: readonly ItemId[]; puzzle?: PuzzleId; barrier?: string };
export const CHESTS = {
  glade: { opening: "quiz", reward: 5, location: null },
  south: { opening: "quiz", reward: 5, location: null },
  "butterfly-01": { opening: "direct", reward: 10, location: null },
  "butterfly-02": { opening: "direct", reward: 10, location: null },
  "royal-treasure": { opening: "direct", reward: 20, location: { castle: "throne" }, items: ["royal-crown"], puzzle: "royal-symbols", barrier: "royal-throne" },
} as const satisfies Record<string, ChestDefinition>;
export type ChestId = keyof typeof CHESTS;
export const CHEST_IDS = Object.keys(CHESTS) as ChestId[];
