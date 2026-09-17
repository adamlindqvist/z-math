import { volcanoGateOpen, type DungeonProgress } from "../dungeons/definitions";

export interface YunoboProgress {
  greeted: boolean;
  rockBroken: boolean;
}
export const freshYunobo = (): YunoboProgress => ({ greeted: false, rockBroken: false });
export const hasYunobo = (dungeons: Record<string, DungeonProgress>) => volcanoGateOpen(dungeons);
// Off the main paths, reachable immediately after returning from the temple.
export const YUNOBO_ROCK = { x: 2.1, z: -2.1 };

/** This optional addition to version 20 never invalidates an existing adventure. */
export function parseYunobo(value: unknown, unlocked: boolean): YunoboProgress {
  if (!unlocked || !value || typeof value !== "object") return freshYunobo();
  const p = value as Partial<YunoboProgress>;
  return { greeted: p.greeted === true, rockBroken: p.rockBroken === true };
}
