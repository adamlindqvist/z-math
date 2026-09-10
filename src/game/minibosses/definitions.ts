import { gladePosition } from "../gladeLayout";

export const MINIBOSSES = {
  stone_giant: {
    name: "Stenjätten",
    phases: [5, 7, 9],
    puzzle: { kind: "pair-sum", values: [1, 2, 3, 4, 5, 6] },
    chest: "stone-giant-treasure",
  },
} as const;
export type MinibossId = keyof typeof MINIBOSSES;
/** Completed phases; the phase count also represents permanent defeat. */
export type MinibossProgress = Record<MinibossId, number>;
export const freshMinibosses = (): MinibossProgress => ({ stone_giant: 0 });
export function validMinibosses(value: unknown): value is MinibossProgress {
  if (!value || typeof value !== "object") return false;
  const p = value as MinibossProgress;
  return (
    Object.keys(p).length === 1 &&
    Number.isInteger(p.stone_giant) &&
    p.stone_giant >= 0 &&
    p.stone_giant <= MINIBOSSES.stone_giant.phases.length
  );
}
export const minibossDefeated = (progress: MinibossProgress, id: MinibossId) =>
  progress[id] === MINIBOSSES[id].phases.length;

export const STONE_GIANT_CENTER = gladePosition(4.8, 3.3);
export const STONE_GIANT_ARENA_RADIUS = 4.3;
export const STONE_GIANT_START_DISTANCE = 4;
export const STONE_GIANT_EXIT_DISTANCE = 5.6;
export const RUNE_STONES = MINIBOSSES.stone_giant.puzzle.values.map(
  (value, i) => {
    const angle = (i * Math.PI) / 3;
    return {
      value,
      x: STONE_GIANT_CENTER.x + Math.sin(angle) * 3.35,
      z: STONE_GIANT_CENTER.z + Math.cos(angle) * 3.35,
    };
  },
);
export function inStoneGiantArena(x: number, z: number, margin = 0) {
  return (
    Math.hypot(x - STONE_GIANT_CENTER.x, z - STONE_GIANT_CENTER.z) <
    STONE_GIANT_ARENA_RADIUS + margin
  );
}
