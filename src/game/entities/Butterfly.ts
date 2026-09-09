import * as THREE from "three";
import type { ButterflySecret } from "../secrets/definitions";
import { ball, material } from "../models";

type Phase = "waiting" | "reacting" | "flying" | "finishing" | "hidden";
const HEIGHT = 1.2;
const RADIUS = 2.2;
const FLIGHT_SECONDS = 2.5;

/** A short proximity-led sequence. All animation state stays outside React. */
export class Butterfly {
  root = new THREE.Group();
  body = new THREE.Group();
  phase: Phase = "waiting";
  waypoint = 0;
  private wings: THREE.Group[] = [];
  private elapsed = 0;
  private time = 0;
  private from = new THREE.Vector3();
  private to = new THREE.Vector3();
  private trailTime = 0;
  private particles: { mesh: THREE.Mesh; life: number; seed: number }[] = [];

  constructor(
    private definition: ButterflySecret,
    completed: boolean,
    revealed = false,
  ) {
    this.root.name = definition.id;
    this.body.name = "butterfly";
    this.root.add(this.body);
    const edge = material("#164d95");
    const blue = material("#21cfe5");
    blue.emissive.set("#15aac7");
    blue.emissiveIntensity = 0.45;
    blue.side = THREE.DoubleSide;
    const spot = material("#d4ffff");
    spot.emissive.set("#87e7ed");
    spot.emissiveIntensity = 0.3;
    ball(this.body, edge, 0, 0, 0, 0.055, 0.055, 0.19);
    for (const side of [-1, 1]) {
      const wing = new THREE.Group();
      this.body.add(wing);
      this.wings.push(wing);
      for (const [x, z, sx, sz] of [
        [0.25, -0.1, 0.23, 0.23],
        [0.19, 0.16, 0.17, 0.17],
      ]) {
        ball(wing, edge, side * x, 0, z, sx, 0.035, sz);
        ball(wing, blue, side * x, 0.012, z, sx * 0.85, 0.029, sz * 0.85);
        ball(
          wing,
          spot,
          side * (x + 0.04),
          0.04,
          z - 0.025,
          0.055,
          0.012,
          0.065,
        );
      }
      ball(this.body, edge, side * 0.06, 0.025, -0.24, 0.012, 0.012, 0.08);
    }
    // Shared geometry/material, fixed pool and no new allocation per frame.
    const glitterGeometry = new THREE.OctahedronGeometry(1);
    const glitterMaterial = new THREE.MeshBasicMaterial({ color: "#c4ffff" });
    for (let i = 0; i < 18; i++) {
      const sparkle = new THREE.Mesh(glitterGeometry, glitterMaterial);
      sparkle.visible = false;
      this.root.add(sparkle);
      this.particles.push({ mesh: sparkle, life: 0, seed: i });
    }
    this.root.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = false;
        object.receiveShadow = false;
      }
    });
    this.reset(completed, revealed);
  }

  reset(completed: boolean, revealed = false) {
    this.phase = completed ? "hidden" : "waiting";
    this.waypoint = revealed ? this.definition.waypoints.length - 1 : 0;
    this.elapsed = 0;
    this.time = 0;
    this.trailTime = 0;
    const start = this.definition.waypoints[this.waypoint];
    this.body.position.set(start.x, HEIGHT, start.z);
    this.body.rotation.set(0, 0, 0);
    this.body.scale.setScalar(1);
    this.body.visible = !completed;
    this.particles.forEach((p) => {
      p.life = 0;
      p.mesh.visible = false;
    });
  }

  /** Returns true only when proximity triggers a flight. */
  update(
    dt: number,
    player: { x: number; z: number },
    completed: boolean,
    paused: boolean,
  ): boolean {
    if (paused) return false;
    this.time += dt;
    this.elapsed += dt;
    if (completed && this.phase !== "finishing" && this.phase !== "hidden") {
      this.phase = "finishing";
      this.elapsed = 0;
      this.from.copy(this.body.position);
    }
    let activated = false;
    switch (this.phase) {
      case "waiting": {
        const anchor = this.definition.waypoints[this.waypoint];
        this.body.position.set(
          anchor.x + Math.sin(this.elapsed * 1.8) * 0.1,
          HEIGHT + Math.sin(this.elapsed * 2.4) * 0.1,
          anchor.z + Math.sin(this.elapsed * 1.2) * 0.07,
        );
        if (
          this.waypoint < this.definition.waypoints.length - 1 &&
          this.elapsed >= 0.8 &&
          Math.hypot(player.x - anchor.x, player.z - anchor.z) <= RADIUS
        ) {
          this.phase = "reacting";
          this.elapsed = 0;
          activated = true;
        }
        break;
      }
      case "reacting":
        if (this.elapsed >= 0.4) {
          this.phase = "flying";
          this.elapsed = 0;
          this.from.copy(this.body.position);
          const next = this.definition.waypoints[this.waypoint + 1];
          this.to.set(next.x, HEIGHT, next.z);
          this.body.rotation.y = Math.atan2(
            this.from.x - this.to.x,
            this.from.z - this.to.z,
          );
        }
        break;
      case "flying": {
        const t = Math.min(1, this.elapsed / FLIGHT_SECONDS);
        const eased = t * t * (3 - 2 * t);
        this.body.position.lerpVectors(this.from, this.to, eased);
        this.body.position.y += Math.sin(Math.PI * t) * 0.8;
        if (t === 1) {
          this.waypoint++;
          this.phase = "waiting";
          this.elapsed = 0;
        }
        break;
      }
      case "finishing": {
        const t = Math.min(1, Math.max(0, this.elapsed - 1) / 2);
        this.body.position.copy(this.from);
        this.body.position.x += Math.sin(t * Math.PI * 4) * 0.3;
        this.body.position.z += Math.sin(t * Math.PI * 2) * 0.25;
        this.body.position.y += t * 2.3;
        this.body.scale.setScalar(Math.min(1, (1 - t) * 5));
        if (t === 1) {
          this.phase = "hidden";
          this.body.visible = false;
        }
        break;
      }
    }
    const energetic =
      this.phase === "reacting" ||
      this.phase === "flying" ||
      this.phase === "finishing";
    this.wings.forEach((wing, i) => {
      wing.rotation.z =
        (i === 0 ? -1 : 1) *
        (0.2 + Math.sin(this.time * (energetic ? 32 : 15)) * 0.65);
    });
    for (const p of this.particles) {
      if (p.life <= 0) continue;
      p.life = Math.max(0, p.life - dt);
      p.mesh.visible = p.life > 0;
      p.mesh.position.y -= dt * 0.22;
      p.mesh.position.x += Math.sin(p.seed * 2.4) * dt * 0.12;
      p.mesh.rotation.y += dt * 3;
      p.mesh.scale.setScalar(p.life * 0.07);
    }
    if (energetic) {
      this.trailTime += dt;
      if (this.trailTime >= 0.06) {
        this.trailTime = 0;
        const p = this.particles.find((p) => p.life <= 0);
        if (p) {
          p.life = 0.8;
          p.mesh.visible = true;
          p.mesh.position.copy(this.body.position);
          p.mesh.position.x += Math.sin(p.seed * 2.4) * 0.2;
          p.mesh.position.z += Math.cos(p.seed * 2.4) * 0.2;
          p.mesh.scale.setScalar(0.056);
        }
      }
    }
    return activated;
  }
}
