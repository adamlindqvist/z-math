import type { MathLevel } from "../../math/progression";

export const COMPANIONS = ["yunobo", "sidon", "tulin", "riju"] as const;
export type CompanionId = typeof COMPANIONS[number];
export const BOSS_CENTER = { x: 0, z: -25 };
export const ELEMENT_COLORS = ["#ffb35a", "#65dcff", "#adffe0", "#ffe16b"] as const;
export type BossStage = "unstarted" | "intro" | "team_attacks" | "obstacle" | "team_math" | "companion_ready" | "ability" | "team_opening" | "transformation" | "demon_attacks" | "demon_math" | "demon_opening" | "final_rise" | "companions_return" | "final_ready" | "final_attack" | "victory" | "completed";
export interface BossProgress {
  stage: BossStage;
  teamHits: number;
  demonHits: number;
  mathLevel: MathLevel;
}
export type BossEvent = "elapsed" | "solved" | "activate" | "swordHit" | "finish";
export const freshBoss = (): BossProgress => ({ stage: "unstarted", teamHits: 0, demonHits: 0, mathLevel: 1 });
const stages: readonly BossStage[] = ["unstarted", "intro", "team_attacks", "obstacle", "team_math", "companion_ready", "ability", "team_opening", "transformation", "demon_attacks", "demon_math", "demon_opening", "final_rise", "companions_return", "final_ready", "final_attack", "victory", "completed"];
export function bossDefeated(b: BossProgress) { return b.stage === "victory" || b.stage === "completed"; }
export function parseBoss(value: unknown): BossProgress {
  if (!value || typeof value !== "object") return freshBoss();
  const b = value as Partial<BossProgress>;
  if (!stages.includes(b.stage!) || !Number.isInteger(b.teamHits) || b.teamHits! < 0 || b.teamHits! > 4 || !Number.isInteger(b.demonHits) || b.demonHits! < 0 || b.demonHits! > 3 || ![1, 2, 3, 4].includes(b.mathLevel!)) return freshBoss();
  const team = stages.indexOf(b.stage!) < stages.indexOf("transformation");
  const finale = stages.indexOf(b.stage!) >= stages.indexOf("final_rise");
  if (team ? b.teamHits! > 3 || b.demonHits !== 0 : b.teamHits !== 4 || (finale ? b.demonHits !== 3 : b.demonHits! > 2)) return freshBoss();
  if ((b.stage === "unstarted" || b.stage === "intro") && b.teamHits !== 0) return freshBoss();
  return { stage: b.stage!, teamHits: b.teamHits!, demonHits: b.demonHits!, mathLevel: b.mathLevel! };
}
/** Replay only unearned motion, never an earned answer, opening, or hit. */
export function resumeBoss(b: BossProgress): BossProgress {
  const stage = b.stage === "ability" || b.stage === "team_math" ? "companion_ready"
    : b.stage === "demon_math" ? "demon_opening"
    : b.stage === "final_attack" ? "final_ready"
    : b.stage;
  return stage === b.stage ? b : { ...b, stage };
}
export function transitionBoss(b: BossProgress, event: BossEvent): BossProgress {
  let stage = b.stage;
  let teamHits = b.teamHits, demonHits = b.demonHits;
  if (event === "elapsed") {
    const next: Partial<Record<BossStage, BossStage>> = {
      intro: "team_attacks", team_attacks: "obstacle", obstacle: "companion_ready",
      ability: "team_opening", transformation: "demon_attacks", demon_attacks: "demon_opening",
      final_rise: "companions_return", companions_return: "final_ready", final_attack: "victory",
    };
    stage = next[stage] ?? stage;
  } else if (event === "solved") {
    if (stage === "team_math") stage = "companion_ready";
    if (stage === "demon_math") stage = "demon_opening";
  } else if (event === "activate") {
    if (stage === "companion_ready") stage = "ability";
    if (stage === "final_ready") stage = "final_attack";
  } else if (event === "swordHit") {
    if (stage === "team_opening") { teamHits++; stage = teamHits === 4 ? "transformation" : "team_attacks"; }
    if (stage === "demon_opening") { demonHits++; stage = demonHits === 3 ? "final_rise" : "demon_attacks"; }
  } else if (event === "finish" && stage === "victory") stage = "completed";
  return stage === b.stage ? b : { ...b, stage, teamHits, demonHits };
}
export function bossCinematic(stage: BossStage) {
  return ["intro", "ability", "transformation", "final_rise", "companions_return", "final_attack", "victory"].includes(stage);
}
export function bossMath(stage: BossStage) { return stage === "team_math" || stage === "demon_math"; }
export function bossOpening(stage: BossStage) { return stage === "team_opening" || stage === "demon_opening"; }
export function litCompanions(b: BossProgress): number {
  if (b.teamHits < 4 || b.stage === "transformation") return 0;
  const solved = b.demonHits + (b.stage === "demon_opening" ? 1 : 0);
  return solved >= 3 ? 4 : solved;
}
export function bossHint(b: BossProgress): string {
  if (b.stage.endsWith("attacks")) return "Undvik ljuset. Vänta med svärdet!";
  if (bossOpening(b.stage)) return "Gå nära. En träff nu!";
  if (bossMath(b.stage)) return "Räkna tillsammans!";
  if (b.stage === "companion_ready") return `${["Yunobo", "Sidon", "Tulin", "Riju"][b.teamHits]} hjälper dig!`;
  if (b.stage === "obstacle") return ["Tung stenrustning!", "Eld på marken!", "Var är Ganondorf?", "En magisk sköld!"][b.teamHits];
  if (b.stage === "transformation") return "Vännernas kraft finns kvar!";
  if (b.stage === "final_rise") return "Vännerna är på väg!";
  if (b.stage === "companions_return") return "Tillsammans igen!";
  if (b.stage === "final_ready") return "Ditt svärd är redo!";
  if (bossDefeated(b)) return "Du och dina vänner vann!";
  return "Vi klarar det tillsammans!";
}
