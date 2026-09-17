import * as THREE from "three";

/** A short, pooled burst: two draw calls, no physics or per-frame allocations. */
export class RockBurst {
  readonly root = new THREE.Group();
  private dustMaterial = new THREE.MeshStandardMaterial({
    color: "#c4ad96", transparent: true, opacity: 0, depthWrite: false, roughness: 1,
  });
  private chips = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(1, 0),
    new THREE.MeshStandardMaterial({ color: "#977561", roughness: 1 }), 24,
  );
  private dust = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), this.dustMaterial, 18);
  private transform = new THREE.Object3D();
  private age = 2;
  constructor() {
    this.root.name = "yunobo-rock-burst";
    this.root.add(this.chips, this.dust);
    this.root.visible = false;
    // The instances spread beyond their initial bounds during the burst.
    this.chips.frustumCulled = this.dust.frustumCulled = false;
    this.chips.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.dust.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < this.chips.count; i++)
      this.chips.setColorAt(i, new THREE.Color(i % 3 === 0 ? "#655047" : i % 3 === 1 ? "#ac8971" : "#876450"));
  }
  dispose() {
    this.chips.dispose();
    this.dust.dispose();
  }
  start() {
    this.age = 0;
    this.root.visible = true;
    this.update(0);
  }
  update(dt: number) {
    if (!this.root.visible) return;
    this.age = Math.min(2, this.age + dt);
    const t = this.age;
    this.root.visible = t < 2;
    const shrink = 1 - THREE.MathUtils.smoothstep(t, 1.2, 2);
    for (let i = 0; i < this.chips.count; i++) {
      const angle = i * 2.39996;
      const speed = 1.4 + (i % 5) * 0.32;
      const side = i % 2 ? -1 : 1;
      // Pieces fan toward the edges while the center path stays readable.
      this.transform.position.set(
        Math.sin(angle) * 1.5 + side * speed * t,
        Math.max(0.12, 0.6 + (i % 4) * 0.52 + (2.6 + i % 3 * 0.5) * t - 4.8 * t * t),
        0.2 + Math.cos(angle) * 0.35 + Math.sin(angle) * t * 1.4,
      );
      this.transform.rotation.set(angle + t * 4, t * side * 3, angle + t * 2);
      const size = (0.12 + i % 4 * 0.07) * shrink;
      this.transform.scale.set(size, size * 0.7, size * 0.85);
      this.transform.updateMatrix();
      this.chips.setMatrixAt(i, this.transform.matrix);
    }
    this.dustMaterial.opacity = 0.48 * (1 - THREE.MathUtils.smoothstep(t, 0.25, 2));
    for (let i = 0; i < this.dust.count; i++) {
      const angle = i * 2.39996;
      const spread = 0.7 + t * (0.6 + i % 3 * 0.16);
      this.transform.position.set(
        Math.sin(angle) * spread * 1.55,
        0.4 + i % 4 * 0.42 + t * (0.65 + i % 3 * 0.12),
        0.3 + Math.cos(angle) * spread * 0.6,
      );
      this.transform.rotation.set(angle, angle * 0.7, t * 0.2);
      const size = (0.38 + i % 3 * 0.12) * (1 + t * 0.9);
      this.transform.scale.set(size * 1.2, size, size * 0.85);
      this.transform.updateMatrix();
      this.dust.setMatrixAt(i, this.transform.matrix);
    }
    this.chips.instanceMatrix.needsUpdate = this.dust.instanceMatrix.needsUpdate = true;
  }
}
