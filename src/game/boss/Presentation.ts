import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import fontData from "three/examples/fonts/helvetiker_bold.typeface.json";
import { box, material, mesh } from "../models";
import { BOSS_CENTER, ELEMENT_COLORS, litCompanions, bossDefeated, type BossProgress } from "./state";
import { WARNING_SECONDS, projectilePosition, type BossAttack, type Point } from "./attacks";
const font = new FontLoader().parse(fontData);
const basic = (color: string, opacity = 1) => new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: false, side: THREE.DoubleSide });

/** Bounded procedural effects; no per-frame geometry creation or extra render pass. */
export class BossPresentation {
  root = new THREE.Group();
  private warning = new THREE.Group();
  private disc: THREE.Mesh;
  private sector: THREE.Mesh;
  private lane: THREE.Mesh;
  private projectile: THREE.Mesh;
  private armor = new THREE.Group();
  private shield: THREE.Mesh;
  private mist = new THREE.Group();
  private fire = new THREE.Group();
  private symbols: THREE.Mesh[] = [];
  private power = new THREE.Group();
  private streams: THREE.Mesh[] = [];
  private portals: THREE.Mesh[] = [];
  private fragments: THREE.Mesh[] = [];
  private rune = new THREE.Group();
  private digits: THREE.Mesh[] = [];
  private swordGlow = new THREE.Group();
  private hitBurst = new THREE.Group();
  private hitMaterials: THREE.MeshBasicMaterial[] = [];
  private lightning = new THREE.Group();
  private shock: THREE.Mesh;
  constructor() {
    this.root.name = "ganondorf-effects";
    const floor = mesh(new THREE.CircleGeometry(8.1, 64), material("#354855"), this.root, 0, 0.015, BOSS_CENTER.z);
    floor.rotation.x = -Math.PI / 2;
    const ring = mesh(new THREE.RingGeometry(7.85, 8.02, 64), basic("#87d9cc", 0.5), this.root, 0, 0.04, BOSS_CENTER.z);
    ring.rotation.x = -Math.PI / 2;
    this.root.add(this.warning, this.armor, this.mist, this.fire, this.power, this.rune, this.swordGlow, this.hitBurst);
    this.warning.name = "boss-attack-warning";
    const warningMat = basic("#ffe384", 0.65);
    this.disc = mesh(new THREE.CircleGeometry(2.4, 40), warningMat, this.warning);
    this.disc.rotation.x = -Math.PI / 2;
    // Circle sector points in +z, matching the attack's collision angle.
    this.sector = mesh(new THREE.CircleGeometry(6, 32, Math.PI / 2 - Math.PI / 5, Math.PI * 2 / 5), warningMat, this.warning);
    this.sector.rotation.x = Math.PI / 2;
    this.lane = mesh(new THREE.PlaneGeometry(1.7, 12), warningMat, this.warning);
    this.lane.rotation.x = -Math.PI / 2;
    this.lane.name = "boss-projectile-lane";
    this.projectile = mesh(new THREE.IcosahedronGeometry(0.65, 1), basic("#e68cff"), this.root);
    this.projectile.name = "boss-dark-projectile";
    this.shock = mesh(new THREE.TorusGeometry(1, 0.07, 5, 48), basic("#efb5ff", 0.8), this.root);
    this.shock.rotation.x = -Math.PI / 2;
    this.root.add(this.lightning);
    this.lightning.position.set(0, 0, BOSS_CENTER.z);
    this.hitBurst.name = "boss-hit-burst";
    this.hitBurst.position.set(0, 2.15, BOSS_CENTER.z + 0.55);
    const impactRingMaterial = basic("#fff4a8", 0.95);
    this.hitMaterials.push(impactRingMaterial);
    mesh(new THREE.TorusGeometry(0.65, 0.11, 6, 24), impactRingMaterial, this.hitBurst);
    for (let i = 0; i < 8; i++) {
      const rayMaterial = basic(i % 2 ? "#ffffff" : "#baff75", 0.95);
      this.hitMaterials.push(rayMaterial);
      const ray = box(this.hitBurst, rayMaterial, 0, 0.98, 0, 0.12, 0.72, 0.05);
      ray.rotation.z = i * Math.PI / 4;
    }
    for (let i = 0; i < 7; i++) {
      const start = new THREE.Vector3(i % 2 ? 0.4 : -0.3, 6 - i * 0.65, 0.35);
      const end = new THREE.Vector3(i % 2 ? -0.3 : 0.4, 6 - (i + 1) * 0.65, 0.35);
      const beam = mesh(new THREE.CylinderGeometry(0.075, 0.075, start.distanceTo(end), 5), basic("#fff6ac"), this.lightning);
      beam.position.copy(start).add(end).multiplyScalar(0.5);
      beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
    }
    this.armor.position.set(0, 0, BOSS_CENTER.z);
    const stone = material("#847580");
    for (let i = 0; i < 10; i++) {
      const a = i * Math.PI * 2 / 10;
      const block = mesh(new THREE.DodecahedronGeometry(0.65, 0), stone, this.armor, Math.cos(a) * 1.15, 1.8 + (i % 2) * 0.6, Math.sin(a) * 0.8);
      block.scale.set(0.7, 1.3, 0.7);
    }
    this.shield = mesh(new THREE.SphereGeometry(2.15, 20, 12), new THREE.MeshBasicMaterial({ color: "#c497ff", transparent: true, opacity: 0.25, wireframe: true, depthWrite: false }), this.root, 0, 2.1, BOSS_CENTER.z);
    for (let i = 0; i < 12; i++) {
      const cloud = mesh(new THREE.IcosahedronGeometry(1, 0), basic("#4d3b67", 0.38), this.mist);
      cloud.position.set(Math.sin(i * 2.4) * 3, 1 + i % 3, BOSS_CENTER.z + Math.cos(i * 2.4) * 2);
      cloud.scale.set(1.7, 0.8, 1.2);
      const flame = mesh(new THREE.ConeGeometry(0.28, 1.1, 5), basic(i % 2 ? "#ffba65" : "#ff725d", 0.8), this.fire, -4 + (i % 6) * 1.6, 0.5, BOSS_CENTER.z + 2.6 + Math.floor(i / 6) * 1.2);
      flame.rotation.z = Math.sin(i) * 0.12;
    }
    for (let i = 0; i < 4; i++) {
      const x = (i - 1.5) * 3.6;
      const symbol = mesh(new THREE.TorusGeometry(0.65, 0.085, 6, 24), basic(ELEMENT_COLORS[i]), this.root, x, 0.1, BOSS_CENTER.z - 5.4);
      symbol.rotation.x = -Math.PI / 2;
      this.symbols.push(symbol);
      const portal = mesh(new THREE.TorusGeometry(0.9, 0.16, 6, 32), basic("#b19bec", 0.7), this.root);
      this.portals.push(portal);
      const power = mesh(new THREE.TorusGeometry(0.65, 0.07, 5, 32, Math.PI * 1.7), basic(ELEMENT_COLORS[i], 0.85), this.power);
      power.rotation.x = Math.PI / 2;
      const stream = mesh(new THREE.CylinderGeometry(0.05, 0.1, 1, 6), basic(ELEMENT_COLORS[i], 0.8), this.root);
      this.streams.push(stream);
      const glow = mesh(new THREE.TorusGeometry(0.45 + i * 0.11, 0.035, 5, 24), basic(ELEMENT_COLORS[i]), this.swordGlow);
      glow.rotation.x = i * 0.5;
    }
    const fragmentGeo = new THREE.OctahedronGeometry(0.17);
    for (let i = 0; i < 28; i++) this.fragments.push(mesh(fragmentGeo, basic(i % 2 ? "#e5c9ff" : "#ffc67c", 0.85), this.root));
    for (let i = 0; i <= 10; i++) {
      const geo = new THREE.ShapeGeometry(font.generateShapes(String(i), 0.75));
      geo.computeBoundingBox(); geo.translate(-(geo.boundingBox!.max.x + geo.boundingBox!.min.x) / 2, 0, 0);
      const digit = mesh(geo, basic("#ffedaa"), this.rune);
      this.digits.push(digit);
    }
    this.rune.position.set(0, 4.6, BOSS_CENTER.z);
    this.rune.rotation.y = 0.5;
    this.root.traverse(o => { if (o instanceof THREE.Mesh) { o.castShadow = false; o.receiveShadow = false; } });
  }
  update(b: BossProgress, time: number, elapsed: number, attack: BossAttack | null, active: boolean, answer: number | undefined, player: Point, feedback = "") {
    const stage = b.stage;
    const returning = stage === "companions_return";
    const final = stage === "final_rise" || returning;
    const powerIndex = returning ? [2, 1, 0, 3][Math.min(3, Math.floor(elapsed / 2))] : b.teamHits;
    const showObstacle = ["obstacle", "team_math", "companion_ready", "ability"].includes(stage);
    const breaking = stage === "ability" ? Math.min(1, elapsed / 2.2) : 0;
    this.armor.visible = (showObstacle && b.teamHits === 0 && breaking < 0.9) || (final && (!returning || elapsed < 6));
    this.armor.children.forEach((o, i) => {
      const a = i * Math.PI * 2 / 10;
      o.position.set(Math.cos(a) * (1.15 + breaking * 2), 1.8 + i % 2 * 0.6 - breaking, Math.sin(a) * (0.8 + breaking * 2));
      o.rotation.z = breaking * (i % 2 ? 1 : -1);
      o.scale.setScalar(1 - breaking * 0.7);
    });
    this.fire.visible = (showObstacle && b.teamHits === 1 && breaking < 0.7) || (final && (!returning || elapsed < 4));
    this.fire.children.forEach((o, i) => o.scale.y = 0.8 + Math.sin(time * 5 + i) * 0.2);
    this.mist.visible = (showObstacle && b.teamHits === 2 && breaking < 0.7) || stage === "transformation" || (final && (!returning || elapsed < 2));
    this.mist.children.forEach((o, i) => { o.rotation.y = time * 0.15 + i; });
    this.shield.visible = (showObstacle && b.teamHits === 3 && breaking < 0.8) || (b.teamHits === 4 && !["demon_opening", "final_ready", "final_attack", "victory", "completed"].includes(stage) && (!returning || elapsed < 7.6));
    this.shield.scale.setScalar(1 + Math.sin(time * 2) * 0.04);
    this.symbols.forEach((s, i) => { const lit = b.teamHits < 4 ? i < b.teamHits : i < litCompanions(b); (s.material as THREE.MeshBasicMaterial).color.set(lit ? ELEMENT_COLORS[i] : "#647080"); });
    this.warning.visible = active && !!attack && attack.age < WARNING_SECONDS + 0.6;
    this.disc.visible = attack?.kind === "shockwave";
    this.sector.visible = attack?.kind === "sword";
    this.lane.visible = attack?.kind === "projectile";
    if (attack) {
      const yaw = Math.atan2(attack.target.x, attack.target.z - BOSS_CENTER.z);
      this.disc.position.set(attack.target.x, 0.1, attack.target.z);
      this.sector.position.set(0, 0.1, BOSS_CENTER.z);
      this.sector.rotation.set(Math.PI / 2, 0, -yaw);
      this.lane.position.set(Math.sin(yaw) * 6, 0.1, BOSS_CENTER.z + Math.cos(yaw) * 6);
      this.lane.rotation.set(-Math.PI / 2, 0, yaw);
      (this.disc.material as THREE.MeshBasicMaterial).opacity = attack.age < WARNING_SECONDS ? 0.28 + Math.min(1, attack.age / WARNING_SECONDS) * 0.35 : 0.85;
    }
    this.projectile.visible = active && attack?.kind === "projectile" && attack.age >= WARNING_SECONDS && attack.age < 6.4;
    if (attack) { const p = projectilePosition(attack); this.projectile.position.set(p.x, 1, p.z); this.projectile.rotation.y = time * 2; }
    this.rune.visible = active && (stage === "demon_math" || stage === "team_math");
    this.digits.forEach((digit, i) => digit.visible = i === answer);
    this.rune.position.y = 4.6 + Math.sin(time * 2) * 0.08;
    this.power.visible = active && (stage === "ability" || returning);
    this.lightning.visible = this.power.visible && powerIndex === 3;
    this.shock.visible = active && !!attack && attack.kind === "shockwave" && attack.age >= WARNING_SECONDS && attack.age < WARNING_SECONDS + 0.6;
    if (attack) {
      this.shock.position.set(attack.target.x, 0.18, attack.target.z);
      this.shock.scale.setScalar(Math.max(0.01, Math.min(2.4, (attack.age - WARNING_SECONDS) * 4)));
    }
    const powerTime = returning ? elapsed % 2 / 2 : breaking;
    this.power.position.set(0, 1.8, BOSS_CENTER.z);
    this.power.children.forEach((o, i) => {
      (o as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>).material.color.set(ELEMENT_COLORS[Math.min(3, powerIndex)]);
      o.scale.setScalar(0.5 + ((powerTime + i / 4) % 1) * 4);
      o.rotation.z = time * 2 + i;
    });
    this.fragments.forEach((o, i) => {
      const burst = stage === "ability" && elapsed > 1 || stage === "victory";
      o.visible = active && burst;
      const age = stage === "victory" ? elapsed / 5 : Math.max(0, elapsed - 1) / 1.2;
      o.position.set(Math.cos(i * 2.4) * age * 5, 2 + Math.sin(i * 1.7) * age * 3 + age, BOSS_CENTER.z + Math.sin(i * 2.4) * age * 4);
      o.scale.setScalar(Math.max(0, 1 - age * 0.85)); o.rotation.set(time + i, time, i);
    });
    this.swordGlow.visible = active && ["final_ready", "final_attack"].includes(stage);
    this.swordGlow.position.set(player.x + 0.25, 1.4, player.z);
    this.swordGlow.rotation.set(time, time * 0.6, 0);
    const finalBlowAge = stage === "final_attack" ? elapsed - 1.4 : -1;
    const confirmedHit = feedback.startsWith("Träff") || feedback.startsWith("Fullträff");
    const hitSeconds = finalBlowAge >= 0 ? finalBlowAge : elapsed;
    const hitAge = THREE.MathUtils.clamp(hitSeconds / 0.7, 0, 1);
    this.hitBurst.visible = active && (confirmedHit || finalBlowAge >= 0) && hitSeconds < 0.7;
    this.hitBurst.scale.setScalar(0.35 + Math.sin(hitAge * Math.PI / 2) * 1.25);
    this.hitBurst.rotation.z = time * 0.8;
    this.hitMaterials.forEach(material => material.opacity = 1 - hitAge);
    if (bossDefeated(b)) { this.armor.visible = this.shield.visible = this.fire.visible = this.mist.visible = false; }
  }
  actors(positions: THREE.Vector3[], b: BossProgress, elapsed: number, player: THREE.Vector3) {
    const transform = b.stage === "transformation";
    const returning = b.stage === "companions_return";
    this.portals.forEach((p, i) => {
      const returnAt = [2, 1, 0, 3][i] * 2;
      p.visible = transform && elapsed > 3 || returning && elapsed >= returnAt && elapsed < returnAt + 1.8;
      p.position.copy(positions[i]); p.position.y = 1.2;
      p.rotation.y = 0.5;
      p.scale.setScalar(transform ? Math.min(1, Math.max(0, elapsed - 3)) : 1);
    });
    this.streams.forEach((s, i) => {
      s.visible = b.stage === "final_ready" || returning && elapsed > 7;
      const from = positions[i].clone().add(new THREE.Vector3(0, 1.4, 0));
      const to = player.clone().add(new THREE.Vector3(0, 1.4, 0));
      const direction = to.sub(from);
      s.position.copy(from).addScaledVector(direction, 0.5);
      s.scale.y = direction.length();
      s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    });
  }
}
