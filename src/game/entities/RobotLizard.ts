import * as THREE from "three";
import { box, material, mesh } from "../models";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/** Decorative companion: no collision, interaction target or saved state. */
export class RobotLizard {
  root = new THREE.Group();
  private body = new THREE.Group();
  private tail = new THREE.Group();
  private legs: THREE.Group[] = [];
  private elapsed = 0;
  private ray = new THREE.Raycaster();
  private hits: THREE.Intersection[] = [];
  private normalMatrix = new THREE.Matrix3();
  private normal = new THREE.Vector3();
  private ahead = new THREE.Vector3();
  private forward = new THREE.Vector3();
  private right = new THREE.Vector3();
  private basis = new THREE.Matrix4();

  constructor(private mountain: THREE.Mesh) {
    this.root.name = "robot-lizard";
    this.root.add(this.body);
    const shell = material("#80633e", 0.7);
    const metal = material("#c4a56a", 0.5);
    const joints = material("#303b3f", 0.6);
    shell.metalness = 0.45;
    metal.metalness = 0.6;
    const light = new THREE.MeshStandardMaterial({
      color: "#9be9f1", emissive: "#50c7dc", emissiveIntensity: 0.5,
    });
    box(this.body, joints, 0, 0.33, 0, 0.48, 0.25, 0.72);
    // Overlapping armor, raised engine drums and a dorsal frame echo the reference.
    for (const z of [-0.25, 0, 0.25]) {
      box(this.body, shell, 0, 0.46, z, 0.51, 0.12, 0.2);
      box(this.body, metal, 0, 0.53, z, 0.48, 0.025, 0.035);
    }
    const head = mesh(new THREE.CylinderGeometry(0.23, 0.08, 0.5, 4),
      shell, this.body, 0, 0.37, 0.58);
    head.rotation.set(-Math.PI / 2, Math.PI / 4, 0);
    box(this.body, metal, 0, 0.49, 0.56, 0.045, 0.035, 0.36);
    box(this.body, joints, 0, 0.285, 0.62, 0.19, 0.025, 0.29);
    for (let i = 0; i < 4; i++) {
      const spine = mesh(new THREE.ConeGeometry(0.065, 0.19, 4),
        metal, this.body, 0, 0.69, 0.2 - i * 0.18);
      spine.rotation.x = -0.25;
    }
    const arch = mesh(new THREE.TorusGeometry(0.31, 0.028, 4, 10, Math.PI),
      metal, this.body, 0, 0.51, -0.05);
    arch.rotation.y = Math.PI / 2;
    for (const side of [-1, 1]) {
      const eye = mesh(new THREE.CylinderGeometry(0.063, 0.063, 0.035, 8),
        metal, this.body, side * 0.155, 0.42, 0.6);
      eye.rotation.z = Math.PI / 2;
      const lens = mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.04, 8),
        light, this.body, side * 0.172, 0.42, 0.6);
      lens.rotation.z = Math.PI / 2;
      for (const z of [-0.23, 0.23]) {
        mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.23, 8),
          shell, this.body, side * 0.3, 0.4, z);
        mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.045, 8),
          metal, this.body, side * 0.3, 0.535, z);
        mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.012, 8),
          joints, this.body, side * 0.3, 0.565, z);
        box(this.body, metal, side * 0.3, 0.575, z, 0.025, 0.02, 0.18);
        const leg = new THREE.Group();
        leg.position.set(side * 0.3, 0.27, z);
        this.body.add(leg);
        this.legs.push(leg);
        box(leg, joints, side * 0.13, -0.04, 0, 0.3, 0.07, 0.09);
        for (let i = 0; i < 3; i++) {
          const rib = box(leg, metal, side * (0.05 + i * 0.085), -0.04, 0,
            0.04, 0.12, 0.14);
          rib.rotation.z = -side * 0.2;
        }
        const hinge = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.13, 8),
          joints, leg, side * 0.27, -0.07, 0);
        hinge.rotation.x = Math.PI / 2;
        const shin = box(leg, shell, side * 0.31, -0.15, 0.025, 0.1, 0.2, 0.12);
        shin.rotation.z = side * 0.35;
        box(leg, metal, side * 0.33, -0.235, 0.065, 0.18, 0.055, 0.13);
        for (const toe of [-1, 0, 1]) {
          const claw = box(leg, metal, side * 0.33 + toe * 0.065, -0.24,
            0.16, 0.04, 0.045, 0.17);
          claw.rotation.y = toe * 0.2;
        }
      }
    }
    this.tail.position.set(0, 0.32, -0.3);
    this.body.add(this.tail);
    for (let i = 0; i < 6; i++) {
      const radius = 0.115 - i * 0.015;
      const segment = mesh(new THREE.CylinderGeometry(radius, radius * 0.85, 0.12, 6),
        shell, this.tail, 0, -i * 0.015, -0.08 - i * 0.13);
      segment.rotation.x = -Math.PI / 2;
      box(this.tail, metal, 0, radius - i * 0.015, -0.08 - i * 0.13,
        radius * 1.6, 0.035, 0.045);
    }
    // Batch rigid parts by material; articulated legs and tail keep their pivots.
    for (const group of [this.body, ...this.legs, this.tail]) {
      for (const mat of [shell, metal, joints, light]) {
        const parts = group.children.filter((part): part is THREE.Mesh =>
          part instanceof THREE.Mesh && part.material === mat);
        if (parts.length < 2) continue;
        const geometries = parts.map((part) => {
          part.updateMatrix();
          return part.geometry.clone().applyMatrix4(part.matrix).toNonIndexed();
        });
        const combined = mergeGeometries(geometries);
        geometries.forEach((geometry) => geometry.dispose());
        if (!combined) continue;
        for (const part of parts) {
          part.geometry.dispose();
          group.remove(part);
        }
        mesh(combined, mat, group);
      }
    }
    this.root.scale.setScalar(0.8);
    mountain.updateWorldMatrix(true, false);
    this.normalMatrix.getNormalMatrix(mountain.matrixWorld);
    this.update(0);
  }

  private surfacePoint(angle: number, point: THREE.Vector3, normal?: THREE.Vector3) {
    // Probe the actual rock mesh, including its irregular facets and world scale.
    // Stay below the rim while climbing up and down twice on each circuit.
    const height = 1.65 + Math.sin(angle * 2) * 0.85;
    this.ray.ray.origin.set(Math.cos(angle) * 6, height - 1.7, Math.sin(angle) * 6)
      .applyMatrix4(this.mountain.matrixWorld);
    this.ray.ray.direction.set(-Math.cos(angle), 0, -Math.sin(angle))
      .transformDirection(this.mountain.matrixWorld);
    this.hits.length = 0;
    this.ray.intersectObject(this.mountain, false, this.hits);
    const hit = this.hits[0];
    if (!hit?.face) return;
    point.copy(hit.point);
    if (normal) normal.copy(hit.normal ?? hit.face.normal).applyNormalMatrix(this.normalMatrix);
  }

  update(dt: number) {
    this.elapsed += dt;
    const angle = Math.PI / 2 + this.elapsed * 0.13;
    this.surfacePoint(angle, this.root.position, this.normal);
    this.surfacePoint(angle + 0.005, this.ahead);
    this.forward.subVectors(this.ahead, this.root.position);
    this.forward.addScaledVector(this.normal, -this.forward.dot(this.normal)).normalize();
    this.right.crossVectors(this.normal, this.forward).normalize();
    this.basis.makeBasis(this.right, this.normal, this.forward);
    this.root.quaternion.setFromRotationMatrix(this.basis);
    this.root.position.addScaledVector(this.normal, 0.07);
    const stride = this.elapsed * 7;
    this.body.position.y = Math.sin(stride * 2) * 0.012;
    this.legs.forEach((leg, i) => {
      const step = Math.sin(stride + (i === 0 || i === 3 ? 0 : Math.PI));
      leg.rotation.x = step * 0.3;
      leg.position.y = 0.27 + Math.max(0, step) * 0.045;
    });
    this.tail.rotation.y = Math.sin(stride * 0.5) * 0.2;
  }
}
