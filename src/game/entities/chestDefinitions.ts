export const CHESTS = {
  glade: { opening: "quiz", reward: 5 },
  south: { opening: "quiz", reward: 5 },
  "butterfly-01": { opening: "direct", reward: 10 },
  "butterfly-02": { opening: "direct", reward: 10 },
} as const;
export type ChestId = keyof typeof CHESTS;
export const CHEST_IDS = Object.keys(CHESTS) as ChestId[];
