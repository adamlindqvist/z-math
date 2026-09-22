import * as THREE from "three";
import { gameStore, type Target } from "../../store/gameStore";
import { Ganondorf } from "../entities/Ganondorf";
import { BossPresentation } from "./Presentation";
import { ATTACK_SECONDS, WARNING_SECONDS, attackSequence, attackHits, type BossAttack } from "./attacks";
import { BOSS_CENTER, bossCinematic, bossOpening, bossDefeated, type BossProgress } from "./state";
import type { Player } from "../Player";
import type { Area } from "../Area";
import type { GameCamera } from "../Camera";
import type { YunoboCompanion } from "../companions/YunoboCompanion";
import type { SidonCompanion } from "../companions/SidonCompanion";
import type { TulinCompanion } from "../companions/TulinCompanion";
import type { RijuCompanion } from "../companions/RijuCompanion";

type Team = [YunoboCompanion, SidonCompanion, TulinCompanion, RijuCompanion];
const durations: Partial<Record<BossProgress["stage"], number>> = { intro: 2.5, obstacle: 2, ability: 2.6, transformation: 7, final_rise: 3, companions_return: 9, final_attack: 2.8 };
export function bossAction(): Target {
  const s = gameStore.getState(), b = s.boss;
  if (!s.bossActive || s.overlay) return null;
  if (b.stage === "companion_ready") return { kind: "bossAction", action: "companion", label: ["Yunobo!", "Sidon!", "Tulin!", "Riju!"][b.teamHits] };
  if (bossOpening(b.stage) || b.stage === "final_ready") return { kind: "bossAction", action: "sword", label: "Slå!" };
  if (b.stage === "victory" && s.bossVictoryReady) return { kind: "bossAction", action: "finish", label: "Fortsätt äventyret" };
  return null;
}

/** Underworld-owned clock and presentation; rules/checkpoints live in state.ts and the store. */
export class GanondorfEncounter {
  readonly effects = new BossPresentation();
  private current: BossProgress | null = null;
  private elapsed = 0;
  private time = 0;
  private attack: BossAttack | null = null;
  private attackIndex = -1;
  private swing = gameStore.getState().bossSwing;
  private pendingHit: BossProgress | null = null;
  private controlled = false;
  private bases: number[] = [];
  private chargeStart = new THREE.Vector3();
  private finalStarted = false;
  private activeBefore = false;
  private feedback = "";
  private feedbackAge = 0;
  constructor(private model: Ganondorf) {}
  get locksMovement() { const s = gameStore.getState(); return s.bossActive && bossCinematic(s.boss.stage); }
  get darkness() {
    const s = gameStore.getState(), b = s.boss;
    if (!s.bossActive || b.stage === "completed") return 0;
    if (b.stage === "victory") return Math.max(0, 0.45 * (1 - this.elapsed / 4));
    if (b.stage === "transformation") return Math.min(0.45, this.elapsed / 12);
    if (b.stage === "final_rise") return 0.62;
    if (b.stage === "companions_return") return Math.max(0.2, 0.62 - this.elapsed / 15);
    return b.teamHits === 4 ? 0.35 : 0;
  }
  update(dt: number, position?: THREE.Vector3) {
    let s = gameStore.getState();
    if (position && !s.overlay && dt > 0 && !this.locksMovement) {
      const distance = Math.hypot(position.x, position.z - BOSS_CENTER.z);
      gameStore.setBossPresence(distance < (s.bossActive ? 10 : 8));
      s = gameStore.getState();
    }
    const active = s.bossActive;
    if (!active) { this.attack = null; this.current = null; this.elapsed = 0; this.attackIndex = -1; }
    if (active && (!this.activeBefore || this.current !== s.boss)) {
      this.current = s.boss; this.elapsed = 0; this.attack = null; this.attackIndex = -1; this.finalStarted = false;
    }
    this.activeBefore = active;
    const running = active && !gameStore.getState().overlay && dt > 0;
    if (running) {
      this.elapsed += dt; this.time += dt;
      const sequence = attackSequence(s.boss);
      if (sequence.length) {
        const index = Math.floor(this.elapsed / ATTACK_SECONDS);
        if (index >= sequence.length) gameStore.advanceBoss(s.boss, "elapsed");
        else {
          if (index !== this.attackIndex && position) {
            this.attackIndex = index;
            this.attack = { kind: sequence[index], target: { x: position.x, z: position.z }, age: 0, hit: false };
            gameStore.bossCue("bossWarning");
          }
          if (this.attack) this.attack.age = this.elapsed % ATTACK_SECONDS;
        }
      } else {
        const duration = durations[s.boss.stage];
        if (duration && this.elapsed >= duration) gameStore.advanceBoss(s.boss, "elapsed");
        if (s.boss.stage === "victory" && this.elapsed >= 5) gameStore.readyBossVictory(s.boss);
      }
    }
    s = gameStore.getState();
    const b = s.boss;
    if (active && b !== this.current) { this.elapsed = 0; this.attack = null; }
    this.model.root.visible = b.stage !== "completed" && !(b.stage === "victory" && this.elapsed > 1.5);
    this.model.root.position.set(0, 0, BOSS_CENTER.z);
    const demon = b.teamHits === 4 && (b.stage !== "transformation" || this.elapsed > 2);
    const size = 1.4 * (demon ? 1.22 : 1) * (b.stage === "victory" ? Math.max(0.01, 1 - this.elapsed / 1.5) : 1);
    this.model.root.scale.setScalar(size);
    this.model.update(this.time);
    this.model.battlePose(demon, this.time, this.attack && this.attack.age < WARNING_SECONDS + 0.6 ? Math.min(1, this.attack.age / WARNING_SECONDS) : b.stage === "final_rise" ? 1 : 0,
      bossOpening(b.stage) || b.stage === "final_rise" && this.elapsed < 1 || b.stage === "victory");
    const facing = this.attack?.target ?? position;
    if (facing && active) this.model.root.rotation.y = Math.atan2(facing.x, facing.z - BOSS_CENTER.z);
    this.effects.update(b, this.time, this.elapsed, this.attack, active, s.question?.correctAnswer, position ?? BOSS_CENTER, s.bossFeedback);
  }
  updateActors(dt: number, player: Player, team: Team, area: Area, camera: GameCamera) {
    const s = gameStore.getState(), b = s.boss;
    const running = s.bossActive && !s.overlay && dt > 0;
    if (s.bossFeedback !== this.feedback) { this.feedback = s.bossFeedback; this.feedbackAge = 0; }
    if (running && this.feedback) {
      this.feedbackAge += dt;
      if (this.feedbackAge >= 1.8) gameStore.clearBossFeedback(this.feedback);
    }
    camera.cinematicFocus = s.bossActive && bossCinematic(b.stage) ? new THREE.Vector3(0, 0, BOSS_CENTER.z + 2.5) : null;
    if (!s.bossActive) {
      if (this.controlled) {
        team.forEach((c, i) => { c.root.scale.setScalar(this.bases[i]); c.reset(player.position, area); });
        this.controlled = false;
      }
      player.updateCombat(dt, area.collision);
      return;
    }
    if (!this.controlled) { this.bases = team.map(c => c.root.scale.x); this.controlled = true; }
    if (running && this.swing !== s.bossSwing) {
      this.swing = s.bossSwing;
      if (player.attackToward(BOSS_CENTER)) { this.pendingHit = b; gameStore.bossCue("metal"); }
    }
    const hit = player.updateCombat(running ? dt : 0, area.collision);
    if (running && hit && this.pendingHit === b && bossOpening(b.stage)) {
      if (Math.hypot(player.position.x, player.position.z - BOSS_CENTER.z) < 3.25)
        gameStore.advanceBoss(b, "swordHit");
      else
        gameStore.setBossFeedback("För långt bort – gå närmare!");
      this.pendingHit = null;
    }
    if (running && this.attack && attackHits(this.attack, player.position)) {
      this.attack.hit = true;
      if (player.pushBack(BOSS_CENTER)) gameStore.bossCue("plop");
    }
    if (b.stage === "final_attack") {
      if (!this.finalStarted) { this.chargeStart.copy(player.position); this.finalStarted = true; }
      const t = Math.min(1, this.elapsed / 1.4);
      player.position.lerpVectors(this.chargeStart, new THREE.Vector3(0, 0, BOSS_CENTER.z + 2.5), t * t * (3 - 2 * t));
      player.root.rotation.y = Math.PI;
      if (this.elapsed >= 1.4 && this.elapsed < 1.4 + dt) {
        player.attackToward(BOSS_CENTER);
        gameStore.setBossFeedback("Fullträff! Sista slaget!");
        gameStore.bossCue("bossHit");
      }
    }
    const returned = b.stage === "companions_return" ? Math.floor(this.elapsed / 2) : ["final_ready", "final_attack", "victory", "completed"].includes(b.stage) ? 4 : 0;
    team.forEach((c, i) => {
      const base = new THREE.Vector3((i - 1.5) * 2.7, 0, BOSS_CENTER.z + 5.5 + (i % 2) * 0.5);
      const returnOrder = [2, 1, 0, 3][i];
      const vanish = b.stage === "transformation" ? THREE.MathUtils.clamp((this.elapsed - 4) / 2, 0, 1) : 0;
      const away = b.teamHits === 4 && b.stage !== "transformation" && returned <= returnOrder;
      c.root.visible = !away;
      c.root.scale.setScalar(this.bases[i] * Math.max(0.01, 1 - vanish));
      c.root.position.copy(base); c.root.position.y = vanish * 1.8;
      c.root.rotation.y = Math.atan2(-base.x, BOSS_CENTER.z - base.z);
      if (b.stage === "companion_ready" && i === b.teamHits) c.root.position.y += 0.12 + Math.sin(this.time * 3) * 0.08;
      const helping = b.stage === "ability" && i === b.teamHits || b.stage === "companions_return" && returnOrder === Math.min(3, Math.floor(this.elapsed / 2));
      const t = b.stage === "ability" ? Math.min(1, this.elapsed / 2.2) : (this.elapsed % 2) / 2;
      if (helping && i === 0) c.root.position.lerp(new THREE.Vector3(0, 0, BOSS_CENTER.z + 2), Math.sin(t * Math.PI));
      if (b.stage === "victory") {
        const a = (i - 1.5) * 0.75;
        c.root.position.set(player.position.x + Math.sin(a) * 2.3, Math.abs(Math.sin(this.time * 3 + i)) * 0.2, player.position.z + Math.cos(a) * 1.8);
        c.root.rotation.y = Math.atan2(player.position.x - c.root.position.x, player.position.z - c.root.position.z);
      }
    });
    const cheering = b.stage === "victory";
    const ability = (i: number) => b.stage === "ability" && b.teamHits === i || b.stage === "companions_return" && [2, 1, 0, 3][Math.min(3, Math.floor(this.elapsed / 2))] === i;
    team[0].model.animate(this.time, 0, cheering, ability(0) ? Math.max(0.01, (this.elapsed % 2.6) / 2.6) : 0, running ? dt : 0);
    team[1].model.animate(this.time, 0, cheering, running ? dt : 0, ability(1));
    team[2].model.animate(this.time, 0, cheering, ability(2));
    team[3].model.animate(this.time, 0, cheering, running ? dt : 0, ability(3));
    this.effects.actors(team.map(c => c.root.position), b, this.elapsed, player.position);
  }
  release(player: Player, team: Team, area: Area, camera: GameCamera) {
    if (this.controlled) team.forEach((c, i) => { c.root.scale.setScalar(this.bases[i]); c.reset(player.position, area); });
    this.controlled = false; camera.cinematicFocus = null;
  }
}
