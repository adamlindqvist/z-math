import type { BossProgress } from "./state";
import { BOSS_CENTER } from "./state";
export type AttackKind = "shockwave" | "projectile" | "sword";
export interface Point { x: number; z: number }
export const WARNING_SECONDS = 2.8;
export const ATTACK_SECONDS = 7;
export interface BossAttack {
  kind: AttackKind;
  target: Point;
  age: number;
  hit: boolean;
}
export function attackSequence(b: BossProgress): AttackKind[] {
  if (b.stage === "team_attacks") return ["shockwave", b.teamHits < 2 ? "shockwave" : "projectile"];
  if (b.stage !== "demon_attacks") return [];
  return b.demonHits === 0 ? ["shockwave", "shockwave"] : b.demonHits === 1 ? ["shockwave", "projectile"] : ["shockwave", "projectile", "sword"];
}
export function projectilePosition(a: BossAttack): Point {
  const dx = a.target.x - BOSS_CENTER.x, dz = a.target.z - BOSS_CENTER.z;
  const d = Math.hypot(dx, dz) || 1;
  const travel = Math.max(0, a.age - WARNING_SECONDS) * 3;
  return { x: BOSS_CENTER.x + dx / d * travel, z: BOSS_CENTER.z + dz / d * travel };
}
export function attackHits(a: BossAttack, p: Point): boolean {
  if (a.hit || a.age < WARNING_SECONDS) return false;
  if (a.kind === "projectile") {
    if (a.age > 6.4) return false;
    const pos = projectilePosition(a);
    return Math.hypot(p.x - pos.x, p.z - pos.z) < 0.85;
  }
  if (a.age > WARNING_SECONDS + 0.6) return false;
  if (a.kind === "shockwave") return Math.hypot(p.x - a.target.x, p.z - a.target.z) < 2.4;
  const dx = p.x - BOSS_CENTER.x, dz = p.z - BOSS_CENTER.z;
  const yaw = Math.atan2(a.target.x - BOSS_CENTER.x, a.target.z - BOSS_CENTER.z);
  const delta = Math.atan2(Math.sin(Math.atan2(dx, dz) - yaw), Math.cos(Math.atan2(dx, dz) - yaw));
  return Math.hypot(dx, dz) < 6 && Math.abs(delta) < Math.PI / 5;
}
