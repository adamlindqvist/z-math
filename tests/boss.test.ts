import { BossPresentation } from "../src/game/boss/Presentation";
import { afterEach, describe, expect, it } from "vitest";
import { Quaternion, Vector3 } from "three";
import { createGameStore, gameStore, parseSave, SAVE_VERSION } from "../src/store/gameStore";
import { freshBoss, transitionBoss, resumeBoss, parseBoss, litCompanions, BOSS_CENTER, type BossProgress } from "../src/game/boss/state";
import { attackHits, attackSequence, WARNING_SECONDS, type BossAttack } from "../src/game/boss/attacks";
import { UnderworldArea } from "../src/game/UnderworldArea";
import { Player } from "../src/game/Player";
import { Ganondorf } from "../src/game/entities/Ganondorf";
import { GameCamera } from "../src/game/Camera";
import { YunoboCompanion } from "../src/game/companions/YunoboCompanion";
import { SidonCompanion } from "../src/game/companions/SidonCompanion";
import { TulinCompanion } from "../src/game/companions/TulinCompanion";
import { RijuCompanion } from "../src/game/companions/RijuCompanion";
import { disposeTree } from "../src/game/Area";
import { ARMY } from "../src/game/underworld/army";
import { generateQuestion } from "../src/math/questionGenerators";

function prepare(store: ReturnType<typeof createGameStore>) {
  store.openDebug(); store.debugTravelTo({ dungeon: "moss", room: "treasure" }); store.debugCompleteCurrentRoom(); store.close();
  store.openDebug(); store.debugTravelTo({ world: "underworld" }); store.close();
  for (const b of ARMY) {
    store.setTarget({ kind: "armyBokoblin", id: b.id, label: "Möt" }); store.interact();
    for (let i = 0; i < 3; i++) { store.answer(store.getState().question!.correctAnswer); store.finishQuiz(); }
  }
}
function saved() {
  const seed = createGameStore(); prepare(seed);
  let raw = JSON.stringify({ ...seed.getState(), version: SAVE_VERSION });
  const storage = { getItem: () => raw, setItem: (_: string, v: string) => { raw = v; } };
  return { store: createGameStore(storage), storage };
}
afterEach(() => { gameStore.debugEndSession(); gameStore.reset(); });

it("extends shared questions to four choices without changing existing quiz defaults", () => {
  for (const level of [1, 2, 3, 4] as const) for (let i = 0; i < 20; i++) {
    expect(generateQuestion(level).answers).toHaveLength(3);
    const q = generateQuestion(level, Math.random, [], undefined, 4);
    expect(new Set(q.answers).size).toBe(4);
    expect(q.answers).toContain(q.correctAnswer);
    expect(q.difficulty).toBe(level);
  }
});

it("keeps illegal events inert and completes exactly four team hits, three demon hits, and one final action", () => {
  let b: BossProgress = { ...freshBoss(), stage: "intro" };
  const step = (event: Parameters<typeof transitionBoss>[1]) => b = transitionBoss(b, event);
  expect(step("swordHit").stage).toBe("intro");
  step("elapsed");
  for (let i = 0; i < 4; i++) {
    step("elapsed"); step("elapsed");
    expect(b.stage).toBe("companion_ready");
    step("activate"); step("elapsed");
    expect(b.stage).toBe("team_opening");
    step("elapsed"); expect(b.stage).toBe("team_opening");
    step("swordHit"); expect(b.teamHits).toBe(i + 1);
  }
  expect(b.stage).toBe("transformation"); step("elapsed");
  for (let i = 0; i < 3; i++) {
    expect(attackSequence(b)).toHaveLength(i === 2 ? 3 : 2);
    step("elapsed");
    expect(litCompanions(b)).toBe(i === 2 ? 4 : i + 1);
    step("swordHit"); step("swordHit");
    expect(b.demonHits).toBe(i + 1);
  }
  expect(b.stage).toBe("final_rise"); step("elapsed"); step("elapsed");
  expect(b.stage).toBe("final_ready");
  step("swordHit"); expect(b.stage).toBe("final_ready");
  step("activate"); step("elapsed"); expect(b.stage).toBe("victory");
  step("finish"); expect(b.stage).toBe("completed"); step("elapsed"); expect(b.stage).toBe("completed");
});

it("preserves old adventures and safely defaults only malformed boss data", () => {
  const { store } = saved();
  const baseline = { ...store.getState(), version: SAVE_VERSION };
  for (const boss of [undefined, null, { stage: "wat" }, { ...freshBoss(), stage: "completed" }, { ...freshBoss(), teamHits: -1 }]) {
    const p = parseSave(JSON.stringify({ ...baseline, boss }));
    expect(p.rupees).toBe(baseline.rupees);
    expect(p.items).toEqual(baseline.items);
    expect(p.dungeons).toEqual(baseline.dungeons);
    expect(p.boss).toEqual(freshBoss());
  }
});

it("skips every boss quiz and saves sword hits immediately", () => {
  const { store: s, storage } = saved();
  s.setBossPresence(true);
  const elapsed = () => s.advanceBoss(s.getState().boss, "elapsed");
  elapsed(); elapsed(); elapsed();
  expect(createGameStore(storage).getState().boss.stage).toBe("companion_ready");
  expect(s.getState().overlay).toBeNull();
  expect(s.getState().question).toBeNull();
  s.interact(); elapsed();
  const opening = s.getState().boss;
  s.advanceBoss(opening, "swordHit"); s.advanceBoss(opening, "swordHit");
  expect(s.getState().boss.teamHits).toBe(1);
  expect(s.getState().bossFeedback).toBe("Träff! 3 träffar kvar.");
  expect(createGameStore(storage).getState().boss.teamHits).toBe(1);
  s.setBossPresence(false); s.advanceBoss(s.getState().boss, "elapsed");
  expect(s.getState().boss.stage).toBe("team_attacks");
});

it("resumes every durable checkpoint and never replays a saved victory", () => {
  const { store, storage } = saved();
  const cases: BossProgress[] = [
    { ...freshBoss(), stage: "companion_ready", teamHits: 2 },
    { ...freshBoss(), stage: "ability", teamHits: 2 },
    { ...freshBoss(), stage: "team_math", teamHits: 2 },
    { ...freshBoss(), stage: "team_opening", teamHits: 3 },
    { ...freshBoss(), stage: "transformation", teamHits: 4 },
    { ...freshBoss(), stage: "demon_opening", teamHits: 4, demonHits: 2 },
    { ...freshBoss(), stage: "demon_math", teamHits: 4, demonHits: 2 },
    { ...freshBoss(), stage: "final_ready", teamHits: 4, demonHits: 3 },
    { ...freshBoss(), stage: "final_attack", teamHits: 4, demonHits: 3 },
    { ...freshBoss(), stage: "victory", teamHits: 4, demonHits: 3 },
    { ...freshBoss(), stage: "completed", teamHits: 4, demonHits: 3 },
  ];
  for (const boss of cases) {
    storage.setItem("", JSON.stringify({ ...store.getState(), version: SAVE_VERSION, boss }));
    const loaded = createGameStore(storage);
    expect(loaded.getState().boss).toEqual(resumeBoss(parseBoss(boss)));
    loaded.setBossPresence(true);
    if (boss.stage === "completed") expect(loaded.getState().bossActive).toBe(false);
    if (boss.stage === "victory") {
      loaded.interact(); expect(loaded.getState().boss.stage).toBe("victory");
      loaded.readyBossVictory(loaded.getState().boss); loaded.interact();
      expect(createGameStore(storage).getState().boss.stage).toBe("completed");
    }
  }
});

it("telegraphs attacks before contact and leaves safe ground", () => {
  for (const kind of ["shockwave", "projectile", "sword"] as const) {
    const a: BossAttack = { kind, target: { x: 0, z: -22 }, age: WARNING_SECONDS - 0.01, hit: false };
    expect(attackHits(a, a.target)).toBe(false);
    a.age = WARNING_SECONDS + (kind === "projectile" ? 1 : 0.1);
    expect(attackHits(a, a.target)).toBe(true);
    expect(attackHits(a, { x: 7, z: -25 })).toBe(false);
    a.hit = true; expect(attackHits(a, a.target)).toBe(false);
  }
});

it("gives protected pushback without tunneling or losing progress", () => {
  const p = new Player(), area = new UnderworldArea();
  p.position.set(0, 0, -21);
  expect(p.pushBack(BOSS_CENTER)).toBe(true);
  expect(p.pushBack(BOSS_CENTER)).toBe(false);
  for (let i = 0; i < 60; i++) p.updateCombat(0.04, area.collision);
  expect(p.position.z).toBeGreaterThan(-21);
  expect(area.collision.free(p.position.x, p.position.z)).toBe(true);
  expect(p.pushBack(BOSS_CENTER)).toBe(true);
  area.dispose(); disposeTree(p.root);
});

it("swings both swords forward toward their faced target instead of through either body", () => {
  const player = new Player(), area = new UnderworldArea(), ganondorf = new Ganondorf();
  try {
    player.position.set(2, 0, -20);
    const sword = player.model.root.getObjectByName("sword")!;
    const restX = sword.rotation.x;
    expect(player.attackToward(BOSS_CENTER)).toBe(true);
    player.updateCombat(0.3, area.collision);
    expect(player.root.rotation.y).toBeCloseTo(Math.atan2(-2, -5));
    expect(sword.rotation.x).toBeGreaterThan(restX + 1);

    const bossSword = ganondorf.root.getObjectByName("ganondorf-sword")!;
    const bossArm = ganondorf.root.getObjectByName("ganondorf-sword-arm")!;
    const bossHand = ganondorf.root.getObjectByName("ganondorf-sword-hand")!;
    expect(bossSword.parent).toBe(bossArm);
    ganondorf.battlePose(false, 0, 0);
    ganondorf.root.updateMatrixWorld(true);
    const windupDirection = new Vector3(0, 1, 0).applyQuaternion(bossSword.getWorldQuaternion(new Quaternion()));
    ganondorf.battlePose(false, 0, 0.42);
    ganondorf.root.updateMatrixWorld(true);
    const raisedHand = bossHand.getWorldPosition(new Vector3());
    ganondorf.battlePose(false, 0, 0.75);
    ganondorf.root.updateMatrixWorld(true);
    const descendingHand = bossHand.getWorldPosition(new Vector3());
    ganondorf.battlePose(false, 0, 1);
    ganondorf.root.updateMatrixWorld(true);
    const strikingHand = bossHand.getWorldPosition(new Vector3());
    const strikeDirection = new Vector3(0, 1, 0).applyQuaternion(bossSword.getWorldQuaternion(new Quaternion()));
    expect(raisedHand.y).toBeGreaterThan(strikingHand.y + 0.6);
    expect(descendingHand.y).toBeGreaterThan(strikingHand.y + 0.2);
    expect(windupDirection.z).toBeGreaterThan(0.8);
    expect(strikeDirection.z).toBeGreaterThan(0.8);
  } finally { area.dispose(); disposeTree(player.root); disposeTree(ganondorf.root); }
});

describe("full encounter with real area, player, and companion controllers", () => {
  it("plays both phases, pauses safely, requires actual close sword hits, and finishes from anywhere", () => {
    prepare(gameStore);
    const area = new UnderworldArea(), player = new Player(), camera = new GameCamera();
    const team: [YunoboCompanion, SidonCompanion, TulinCompanion, RijuCompanion] = [new YunoboCompanion(), new SidonCompanion(), new TulinCompanion(), new RijuCompanion()];
    player.position.set(0, 0, -19);
    team.forEach(c => c.reset(player.position, area));
    const step = (seconds: number) => {
      for (let i = 0; i < Math.ceil(seconds / 0.04); i++) {
        area.update(0.04, i * 0.04, player.position);
        area.bossEncounter.updateActors(0.04, player, team, area, camera);
      }
    };
    try {
      step(0.1); expect(gameStore.getState().boss.stage).toBe("intro");
      gameStore.pause(); step(30); expect(gameStore.getState().boss.stage).toBe("intro"); gameStore.pause();
      step(18.8);
      for (let i = 0; i < 4; i++) {
        expect(gameStore.getState().boss.stage).toBe("companion_ready");
        expect(gameStore.getState().overlay).toBeNull();
        gameStore.interact(); gameStore.interact(); step(2.8);
        expect(gameStore.getState().boss.stage).toBe("team_opening");
        player.position.set(0, 0, -19); gameStore.interact(); step(0.7);
        expect(gameStore.getState().boss.teamHits).toBe(i);
        expect(gameStore.getState().bossFeedback).toContain("För långt bort");
        player.position.set(0, 0, -22.4); gameStore.interact(); step(0.7);
        expect(gameStore.getState().boss.teamHits).toBe(i + 1);
        expect(gameStore.getState().bossFeedback).toContain("träff");
        if (i < 3) step(17);
      }
      expect(gameStore.getState().boss.stage).toBe("transformation");
      step(7.2); expect(team.every(c => !c.root.visible)).toBe(true);
      for (let i = 0; i < 3; i++) {
        player.position.set(6, 0, -24); step(i === 2 ? 22 : 15);
        expect(gameStore.getState().boss.stage).toBe("demon_opening");
        expect(gameStore.getState().overlay).toBeNull();
        expect(litCompanions(gameStore.getState().boss)).toBe(i === 2 ? 4 : i + 1);
        player.position.set(0, 0, -22.4); gameStore.interact(); step(0.7);
        expect(gameStore.getState().boss.demonHits).toBe(i + 1);
      }
      step(13); expect(gameStore.getState().boss.stage).toBe("final_ready");
      expect(team.every(c => c.root.visible)).toBe(true);
      player.position.set(7, 0, -22); gameStore.interact(); step(3);
      expect(gameStore.getState().boss.stage).toBe("victory");
      expect(player.position.distanceTo(new Vector3(0, 0, -22.5))).toBeLessThan(0.1);
      gameStore.interact(); expect(gameStore.getState().boss.stage).toBe("victory");
      step(5); gameStore.interact(); step(0.1);
      expect(gameStore.getState().boss.stage).toBe("completed");
      expect(area.root.getObjectByName("ganondorf")!.visible).toBe(false);
      expect(camera.cinematicFocus).toBeNull();
      gameStore.setBossPresence(true); expect(gameStore.getState().bossActive).toBe(false);
    } finally { area.dispose(); disposeTree(player.root); team.forEach(c => disposeTree(c.root)); }
  });
});


it("keeps projectile warnings aligned with the actual launch direction in every quadrant", () => {
  const view = new BossPresentation();
  try {
    const b: BossProgress = { ...freshBoss(), stage: "demon_attacks", teamHits: 4, demonHits: 1 };
    for (const [x, dz] of [[4, 3], [-4, 3], [4, -3], [-4, -3]]) {
      const target = { x, z: BOSS_CENTER.z + dz };
      view.update(b, 1, 1, { kind: "projectile", target, age: 1, hit: false }, true, undefined, target);
      view.root.updateMatrixWorld(true);
      const lane = view.root.getObjectByName("boss-projectile-lane")!;
      // A warning's long axis must cover the origin and aim point, not a mirrored lane.
      const axis = new Vector3(0, 1, 0).applyQuaternion(lane.quaternion).normalize();
      const launch = new Vector3(x, 0, dz).normalize();
      expect(Math.abs(axis.dot(launch))).toBeCloseTo(1);
      const center = lane.position.clone().sub(new Vector3(0, 0.1, BOSS_CENTER.z)).normalize();
      expect(center.dot(launch)).toBeCloseTo(1);
    }
  } finally { disposeTree(view.root); }
});

it("shows a bright impact burst only for a confirmed boss hit", () => {
  const view = new BossPresentation();
  const b: BossProgress = { ...freshBoss(), stage: "team_attacks", teamHits: 1 };
  try {
    view.update(b, 1, 0.1, null, true, undefined, BOSS_CENTER, "Träff! 3 träffar kvar.");
    expect(view.root.getObjectByName("boss-hit-burst")!.visible).toBe(true);
    view.update(b, 1, 0.1, null, true, undefined, BOSS_CENTER, "För långt bort – gå närmare!");
    expect(view.root.getObjectByName("boss-hit-burst")!.visible).toBe(false);
    view.update({ ...b, stage: "final_attack", teamHits: 4, demonHits: 3 }, 1, 1.5, null, true, undefined, BOSS_CENTER);
    expect(view.root.getObjectByName("boss-hit-burst")!.visible).toBe(true);
  } finally { disposeTree(view.root); }
});
