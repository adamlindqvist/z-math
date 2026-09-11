import * as THREE from "three";
import { ball, material, mesh } from "../models";
import type { StrangeRockSecret, SecretId } from "../secrets/definitions";
import type { Obstacle } from "../CollisionSystem";

/** Fixed animation and a tiny particle pool; no per-frame React updates. */
export class StrangeRock {
  root = new THREE.Group();
  stone = new THREE.Group();
  pit = new THREE.Group();
  phase: "waiting" | "moving" | "revealed" = "waiting";
  private elapsed = 0;
  private glitterTime = 0;
  private glitter: THREE.Mesh[] = [];
  private solid = false;

  constructor(
    public definition: StrangeRockSecret & { id: SecretId },
    revealed: boolean,
  ) {
    this.root.name = definition.id;
    this.root.position.set(definition.position.x, 0, definition.position.z);
    this.root.add(this.stone, this.pit);
    const volcanic = definition.world === "volcano";
    const rune = volcanic
      ? new THREE.MeshStandardMaterial({ color: "#ffb45c", emissive: "#ff651f", emissiveIntensity: 1.1, roughness: 1 })
      : material("#798778");
    const rock = mesh(
      new THREE.DodecahedronGeometry(0.67, 1),
      material(volcanic ? "#403b49" : "#a5aea2"),
      this.stone,
      0,
      0.4,
    );
    rock.scale.set(1.05, 0.78, 0.95);
    rock.rotation.y = 0.3;
    if (volcanic) {
      // Follow the faceted surface so the warm seams stay attached while moving.
      rock.updateMatrixWorld();
      for (const coordinates of [
        [[-0.34, 0.72, 0.30], [-0.38, 0.48, 0.50], [-0.23, 0.26, 0.56], [-0.29, 0.10, 0.44]],
        [[0.33, 0.70, 0.25], [0.48, 0.49, 0.32], [0.51, 0.25, 0.19]],
      ]) {
        const points = coordinates.map(([x, y, z]) => {
          const direction = new THREE.Vector3(x, y - 0.4, z).normalize();
          const origin = new THREE.Vector3(0, 0.4, 0).addScaledVector(direction, 2);
          const hit = new THREE.Raycaster(origin, direction.clone().negate()).intersectObject(rock)[0];
          return hit ? hit.point.addScaledVector(direction, 0.012) : new THREE.Vector3(x, y, z);
        });
        mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 12, 0.018, 4, false), rune, this.stone);
      }
    } else {
      const moss = material("#75865c");
      ball(this.stone, moss, -0.38, 0.56, 0.12, 0.23, 0.085, 0.23);
      ball(this.stone, moss, -0.28, 0.7, -0.08, 0.16, 0.04, 0.17);
    }
    const points = Array.from({ length: 41 }, (_, i) => {
      const t = i / 40,
        angle = t * Math.PI * 3;
      return new THREE.Vector3(
        Math.cos(angle) * (0.025 + t * 0.19),
        0.922 - t * 0.028,
        Math.sin(angle) * (0.025 + t * 0.19),
      );
    });
    mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points),
        40,
        0.015,
        4,
        false,
      ),
      rune,
      this.stone,
    );
    const soil = material(volcanic ? "#76616a" : "#927352");
    mesh(
      new THREE.CylinderGeometry(0.58, 0.62, 0.04, 24),
      soil,
      this.pit,
      0,
      0.04,
    );
    mesh(
      new THREE.CylinderGeometry(0.47, 0.47, 0.012, 24),
      material(volcanic ? "#29232e" : "#453c2c"),
      this.pit,
      0,
      0.068,
    );
    for (let i = 0; i < 7; i++) {
      const a = (i * Math.PI * 2) / 7;
      ball(
        this.pit,
        soil,
        Math.cos(a) * 0.54,
        0.07,
        Math.sin(a) * 0.54,
        0.085,
        0.05,
        0.07,
      );
    }
    const glitterGeometry = new THREE.OctahedronGeometry(0.08);
    const glitterMaterial = new THREE.MeshBasicMaterial({ color: "#fff2b0" });
    for (let i = 0; i < 2; i++)
      this.glitter.push(mesh(glitterGeometry, glitterMaterial, this.root));
    this.reset(revealed);
  }

  reset(revealed: boolean) {
    this.phase = revealed ? "revealed" : "waiting";
    this.elapsed = 0;
    this.glitterTime = 0;
    this.solid = !revealed;
    this.stone.position.set(
      revealed ? this.definition.offset.x : 0,
      0,
      revealed ? this.definition.offset.z : 0,
    );
    this.stone.rotation.z = 0;
    this.pit.visible = revealed;
    this.glitter.forEach((p) => (p.visible = false));
  }

  start() {
    if (this.phase !== "waiting") return;
    this.phase = "moving";
    this.solid = false;
  }

  /** True on the frame that the treasure becomes available. */
  update(dt: number, paused: boolean): boolean {
    if (paused) return false;
    if (this.glitterTime > 0) {
      this.glitterTime = Math.max(0, this.glitterTime - dt);
      this.glitter.forEach((p, i) => {
        p.visible = this.glitterTime > 0;
        p.position.set(
          i ? 0.25 : -0.25,
          0.35 + (0.65 - this.glitterTime) * 0.9,
          i ? -0.15 : 0.15,
        );
        p.rotation.y += dt * 3;
        p.scale.setScalar(this.glitterTime / 0.65);
      });
    }
    if (this.phase !== "moving") return false;
    this.elapsed = Math.min(1.2, this.elapsed + dt);
    const t = Math.min(1, Math.max(0, (this.elapsed - 0.22) / 0.78));
    const eased = t * t * (3 - 2 * t);
    const shake = this.elapsed < 0.22 ? Math.sin(this.elapsed * 70) * 0.035 : 0;
    const bounce =
      this.elapsed > 1
        ? Math.sin(((this.elapsed - 1) / 0.2) * Math.PI) * 0.07
        : 0;
    this.stone.position.set(
      this.definition.offset.x * eased + shake,
      Math.sin(t * Math.PI) * 0.16 + bounce,
      this.definition.offset.z * eased,
    );
    this.stone.rotation.z = shake + Math.sin(t * Math.PI) * -0.16;
    this.pit.visible = t > 0;
    if (this.elapsed < 1.2) return false;
    this.phase = "revealed";
    this.stone.position.set(
      this.definition.offset.x,
      0,
      this.definition.offset.z,
    );
    this.stone.rotation.z = 0;
    this.glitterTime = 0.65;
    return true;
  }

  obstacle(player?: { x: number; z: number }): Obstacle[] {
    if (this.phase === "moving") return [];
    const x = this.root.position.x + this.stone.position.x;
    const z = this.root.position.z + this.stone.position.z;
    // A player may stand at the landing spot. Let them walk out before making it solid.
    if (!this.solid) {
      if (!player) return [];
      const dx = Math.max(Math.abs(player.x - x) - 0.52, 0);
      const dz = Math.max(Math.abs(player.z - z) - 0.52, 0);
      this.solid = dx * dx + dz * dz >= 0.32 * 0.32;
    }
    return this.solid ? [{ x, z, halfX: 0.52, halfZ: 0.52 }] : [];
  }
}
