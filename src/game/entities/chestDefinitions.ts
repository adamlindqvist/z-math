import type { ItemId } from "../../items/definitions";
import type { Location } from "../dungeons/definitions";
import type { PuzzleId } from "../puzzles/definitions";
export type ChestDefinition = { opening: "quiz" | "direct"; reward: number; location: Location; items?: readonly ItemId[]; pictureQuiz?: "counting" | "addition"; puzzle?: PuzzleId; barrier?: string };
export const CHESTS = {
  "water-01": { opening: "quiz", reward: 5, location: { world: "water" }, pictureQuiz: "addition" },
  "desert-01": { opening: "quiz", reward: 5, location: { world: "desert" }, pictureQuiz: "addition" },
  "stone-giant-treasure": { opening: "direct", reward: 0, location: { world: "volcano" }, items: ["lava_hat", "stone_armor"] },
  glade: { opening: "quiz", reward: 5, location: null },
  "volcano-01": { opening: "quiz", reward: 5, location: { world: "volcano" }, pictureQuiz: "addition" },
  "south-fire-shield": { opening: "quiz", reward: 5, location: null, pictureQuiz: "addition", items: ["fire-shield"] },
  south: { opening: "quiz", reward: 5, location: null },
  "butterfly-01": { opening: "direct", reward: 10, location: null },
  "butterfly-02": { opening: "direct", reward: 10, location: null },
  "royal-treasure": { opening: "quiz", reward: 20, location: { castle: "throne" }, items: ["royal-crown"], puzzle: "royal-symbols", barrier: "royal-throne" },
} as const satisfies Record<string, ChestDefinition>;
export type ChestId = keyof typeof CHESTS;
export const CHEST_IDS = Object.keys(CHESTS) as ChestId[];
