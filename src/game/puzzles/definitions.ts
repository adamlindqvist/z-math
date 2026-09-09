export const PUZZLES = {
  "royal-symbols": { symbols: ["royal-shield", "royal-armour", "royal-portrait"], barrier: "royal-throne" },
} as const;
export type PuzzleId = keyof typeof PUZZLES;
export type PuzzlesProgress = Record<PuzzleId, { activated: string[] }>;
export const freshPuzzles = (): PuzzlesProgress => ({ "royal-symbols": { activated: [] } });
export function puzzleSolved(progress: PuzzlesProgress, id: PuzzleId) {
  return PUZZLES[id].symbols.every(s => progress[id].activated.includes(s));
}
export function validPuzzles(value: unknown): value is PuzzlesProgress {
  if (!value || typeof value !== "object" || Object.keys(value).length !== Object.keys(PUZZLES).length) return false;
  return (Object.keys(PUZZLES) as PuzzleId[]).every(id => {
    const p = (value as PuzzlesProgress)[id];
    return p && Array.isArray(p.activated) && new Set(p.activated).size === p.activated.length &&
      p.activated.every(s => (PUZZLES[id].symbols as readonly string[]).includes(s));
  });
}
