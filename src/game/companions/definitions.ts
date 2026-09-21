import { natureRestored, volcanoGateOpen, type DungeonProgress } from "../dungeons/definitions";

export interface SidonProgress { greeted: boolean; gateOpened: boolean }
export const freshSidon = (): SidonProgress => ({ greeted: false, gateOpened: false });
export const hasSidon = (dungeons: Record<string, DungeonProgress>) => natureRestored(dungeons, "water");
export function parseSidon(value: unknown, unlocked: boolean): SidonProgress {
  const p = value && typeof value === "object" ? value as Partial<SidonProgress> : undefined;
  // Before this field existed, completing the temple opened the shell automatically.
  return { greeted: unlocked && p?.greeted === true,
    gateOpened: unlocked && (p?.gateOpened === true || p?.gateOpened === undefined) };
}

export interface TulinProgress { greeted: boolean }
export const freshTulin = (): TulinProgress => ({ greeted: false });
export const hasTulin = (dungeons: Record<string, DungeonProgress>) =>
  dungeons.moss?.rewards.includes("treasure-lock") ?? false;
export function parseTulin(value: unknown, unlocked: boolean): TulinProgress {
  return { greeted: unlocked && !!value && typeof value === "object" && (value as Partial<TulinProgress>).greeted === true };
}

export interface YunoboProgress {
  greeted: boolean;
  rockBroken: boolean;
}
export const freshYunobo = (): YunoboProgress => ({ greeted: false, rockBroken: false });
export const hasYunobo = (dungeons: Record<string, DungeonProgress>) => volcanoGateOpen(dungeons);
// Fills the northern passage to the water world.
export const YUNOBO_ROCK = { x: 0, z: -4.8 };

/** This optional addition to version 20 never invalidates an existing adventure. */
export function parseYunobo(value: unknown, unlocked: boolean): YunoboProgress {
  if (!unlocked || !value || typeof value !== "object") return freshYunobo();
  const p = value as Partial<YunoboProgress>;
  return { greeted: p.greeted === true, rockBroken: p.rockBroken === true };
}

export interface RijuProgress { greeted: boolean }
export const freshRiju = (): RijuProgress => ({ greeted: false });
export const hasRiju = (dungeons: Record<string, DungeonProgress>) => natureRestored(dungeons, "desert");
export function parseRiju(value: unknown, unlocked: boolean): RijuProgress {
  const p = value && typeof value === "object" ? value as Partial<RijuProgress> : undefined;
  return { greeted: unlocked && p?.greeted === true };
}
