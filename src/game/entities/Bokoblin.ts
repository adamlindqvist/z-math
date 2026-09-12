import { gladeDistance } from "../gladeLayout";
import * as THREE from "three";
import { ball, box, material, mesh, silhouette } from "../models";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export class Bokoblin {
  root = new THREE.Group();
  private flight = 0;
  private patrolDirection = 1;
  private guarding = true;
  private stepTime = 0;
  private legs: THREE.Group[] = [];
  private materials: THREE.Material[];
  constructor(unlocked: boolean) {
    this.root.name = "Bokoblin";
    const skin = material("#a95730"),
      cloth = material("#777348"),
      bone = material("#ece3ac"),
      snout = material("#e48b40"),
      dark = material("#44372a"),
      innerEar = material("#c2b268"),
      eye = material("#43d5ee"),
      leather = material("#695035");
    eye.emissive.set("#219bb9");
    eye.emissiveIntensity = 0.45;
    this.materials = [skin, cloth, bone, snout, dark, innerEar, eye, leather];
    for (const mat of this.materials) mat.transparent = true;

    // The face looks toward the approaching player (negative Z).
    ball(this.root, skin, 0, 0.87, 0.04, 0.36, 0.47, 0.27);
    ball(this.root, skin, 0, 1.19, 0.04, 0.47, 0.24, 0.29);
    ball(this.root, snout, 0, 0.91, -0.21, 0.23, 0.3, 0.065);
    ball(this.root, skin, 0, 1.57, 0, 0.45, 0.38, 0.34);
    ball(this.root, skin, 0, 1.34, -0.16, 0.37, 0.19, 0.27);
    ball(this.root, dark, 0, 1.34, -0.383, 0.29, 0.045, 0.027);
    ball(this.root, snout, 0, 1.29, -0.36, 0.29, 0.04, 0.05);
    ball(this.root, snout, 0, 1.48, -0.34, 0.25, 0.19, 0.18);
    const nose = ball(this.root, snout, 0, 1.48, -0.47, 0.21, 0.135, 0.065);
    nose.rotation.z = 0.08;
    const horn = mesh(
      new THREE.ConeGeometry(0.095, 0.28, 6),
      bone,
      this.root,
      0,
      1.99,
      0.015,
    );
    horn.rotation.x = -0.25;
    mesh(
      new THREE.CylinderGeometry(0.105, 0.12, 0.055, 8),
      leather,
      this.root,
      0,
      1.88,
      0.015,
    );

    for (const side of [-1, 1]) {
      const ear = silhouette(
        this.root,
        skin,
        [
          [side * 0.32, 1.72],
          [side * 0.62, 1.85],
          [side * 0.98, 1.94],
          [side * 0.85, 1.61],
          [side * 0.59, 1.48],
          [side * 0.38, 1.51],
        ],
        0.12,
      );
      ear.position.z = -0.045;
      const inset = silhouette(
        this.root,
        innerEar,
        [
          [side * 0.44, 1.68],
          [side * 0.85, 1.83],
          [side * 0.75, 1.64],
          [side * 0.57, 1.56],
        ],
        0.025,
      );
      inset.position.z = -0.075;
      ball(this.root, dark, side * 0.245, 1.65, -0.282, 0.13, 0.105, 0.075);
      ball(this.root, eye, side * 0.245, 1.65, -0.343, 0.075, 0.072, 0.028);
      ball(this.root, bone, side * 0.228, 1.675, -0.365, 0.024, 0.027, 0.009);
      const brow = ball(
        this.root,
        skin,
        side * 0.24,
        1.75,
        -0.28,
        0.15,
        0.055,
        0.085,
      );
      brow.rotation.z = side * 0.16;
      const nostril = ball(
        this.root,
        dark,
        side * 0.085,
        1.49,
        -0.529,
        0.037,
        0.065,
        0.013,
      );
      nostril.rotation.z = side * 0.25;
      const tooth = mesh(
        new THREE.ConeGeometry(0.04, 0.105, 5),
        bone,
        this.root,
        side * 0.21,
        1.375,
        -0.411,
      );
      tooth.rotation.z = -side * 0.2;

      // Bent legs and broad, bare feet give the guard a steady stance.
      const leg = new THREE.Group();
      leg.name = side < 0 ? "left-leg" : "right-leg";
      leg.position.set(side * 0.27, 0.58, 0);
      this.legs.push(leg);
      const thigh = ball(leg, skin, side * 0.27, 0.43, 0.03, 0.17, 0.26, 0.18);
      thigh.rotation.z = -side * 0.4;
      const shin = ball(leg, skin, side * 0.36, 0.23, 0, 0.115, 0.19, 0.12);
      shin.rotation.z = side * 0.16;
      ball(leg, skin, side * 0.38, 0.095, -0.1, 0.18, 0.095, 0.23);
      for (const toe of [-1, 1])
        ball(
          leg,
          bone,
          side * 0.38 + toe * 0.073,
          0.075,
          -0.29,
          0.048,
          0.04,
          0.067,
        );

      // Keep the hip as the animation pivot while retaining the standing pose.
      for (const part of leg.children) part.position.sub(leg.position);

      const upperArm = ball(
        this.root,
        skin,
        side * 0.49,
        1.12,
        0,
        0.18,
        0.28,
        0.18,
      );
      upperArm.rotation.z = side * 0.65;
      const forearm = new THREE.Group();
      forearm.position.set(side * 0.67, 0.94, -0.04);
      forearm.rotation.z = side * 0.55;
      this.root.add(forearm);
      ball(forearm, skin, 0, 0, 0, 0.135, 0.22, 0.14);
      for (let band = 0; band < 4; band++) {
        const wrap = mesh(
          new THREE.CylinderGeometry(0.143, 0.143, 0.06, 8),
          bone,
          forearm,
          0,
          -0.12 + band * 0.075,
          0,
        );
        wrap.rotation.z = band % 2 === 0 ? 0.09 : -0.09;
      }
      ball(forearm, skin, 0, -0.29, -0.015, 0.17, 0.14, 0.13);
      ball(forearm, skin, -side * 0.15, -0.25, -0.06, 0.075, 0.1, 0.075);
      for (const finger of [-1, 0, 1])
        ball(forearm, bone, finger * 0.09, -0.38, -0.05, 0.037, 0.055, 0.045);
    }

    const skirt = mesh(
      new THREE.CylinderGeometry(0.3, 0.4, 0.22, 8),
      leather,
      this.root,
      0,
      0.58,
      0.02,
    );
    skirt.scale.z = 0.8;
    const flap = silhouette(
      this.root,
      cloth,
      [
        [-0.23, 0.63],
        [0.23, 0.63],
        [0.17, 0.37],
        [0.06, 0.29],
        [-0.03, 0.36],
        [-0.12, 0.31],
      ],
      0.035,
    );
    flap.position.z = -0.3;
    box(this.root, bone, 0, 0.65, -0.313, 0.12, 0.08, 0.04);
    for (const side of [-1, 1]) {
      const cord = box(
        this.root,
        leather,
        side * 0.12,
        1.15,
        -0.284,
        0.025,
        0.31,
        0.025,
      );
      cord.rotation.z = -side * 0.65;
    }
    ball(this.root, bone, 0, 1.01, -0.315, 0.105, 0.095, 0.045);
    box(this.root, bone, 0, 0.938, -0.316, 0.105, 0.055, 0.065);
    for (const side of [-1, 1])
      ball(this.root, dark, side * 0.038, 1.018, -0.355, 0.025, 0.029, 0.01);

    // Merge each moving part separately, preserving its local hip pivot.
    for (const group of [this.root, ...this.legs]) {
      group.updateMatrixWorld(true);
      const inverse = group.matrixWorld.clone().invert();
      const parts = new Map<THREE.Material, THREE.BufferGeometry[]>();
      group.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        const mat = object.material as THREE.Material;
        const geometry = object.geometry.index
          ? object.geometry.toNonIndexed()
          : object.geometry;
        if (geometry !== object.geometry) object.geometry.dispose();
        geometry.applyMatrix4(
          new THREE.Matrix4().multiplyMatrices(inverse, object.matrixWorld),
        );
        const geometries = parts.get(mat) ?? [];
        geometries.push(geometry);
        parts.set(mat, geometries);
      });
      group.clear();
      for (const [mat, geometries] of parts) {
        const combined = mergeGeometries(geometries);
        if (!combined) throw new Error("Kunde inte skapa bokoblinens modell.");
        mesh(combined, mat, group);
        geometries.forEach((geometry) => geometry.dispose());
      }
    }
    this.root.add(...this.legs);
    this.flight = unlocked ? 1 : 0;
    this.update(0, unlocked, false);
  }
  update(
    dt: number,
    unlocked: boolean,
    paused: boolean,
    playerPosition?: THREE.Vector3,
  ) {
    const step = Math.max(0, dt);
    const bridgeZ = gladeDistance(7.9);
    if (!unlocked) {
      if (this.flight > 0 || !playerPosition) {
        this.root.position.set(0, 0, bridgeZ);
        this.patrolDirection = 1;
        this.guarding = true;
        this.stepTime = 0;
        this.animateLegs(false);
      }
      this.flight = 0;
    } else if (!paused) this.flight = Math.min(1, this.flight + step / 0.9);
    const opacity = 1 - this.flight;
    this.root.visible = this.flight < 1;
    if (unlocked) {
      this.root.position.set(
        this.flight * 3.8,
        Math.sin(this.flight * Math.PI * 8) * 0.08,
        bridgeZ - this.flight * 1.2,
      );
      this.root.rotation.y = -Math.PI / 2;
      if (!paused) {
        this.stepTime += step * 18;
        this.animateLegs(this.flight < 1, true);
      }
    } else if (!playerPosition) this.root.rotation.y = 0;
    else if (!paused) {
      // Measure from the bridge, not the patrolling guard. A wider release
      // radius prevents repeated starts and stops at the edge of detection.
      const distance = Math.hypot(playerPosition.x, playerPosition.z - bridgeZ);
      this.guarding = distance <= (this.guarding ? 7 : 5.5);
      const targetX = this.guarding ? 0 : this.patrolDirection * 1.1;
      const remaining = targetX - this.root.position.x;
      const movement =
        Math.sign(remaining) *
        Math.min(Math.abs(remaining), step * (this.guarding ? 4.2 : 0.65));
      this.root.position.x += movement;
      this.root.position.z = bridgeZ;
      const moving = Math.abs(movement) > 0.00001;
      if (moving) this.stepTime += step * (this.guarding ? 18 : 7);
      this.root.position.y = moving
        ? Math.abs(Math.sin(this.stepTime)) * 0.035
        : 0;
      this.animateLegs(moving, this.guarding);
      if (!this.guarding && Math.abs(targetX - this.root.position.x) < 0.001)
        this.patrolDirection *= -1;

      const returning = this.guarding && Math.abs(this.root.position.x) > 0.05;
      const dx =
        !this.guarding || returning
          ? remaining
          : playerPosition.x - this.root.position.x;
      const dz =
        !this.guarding || returning
          ? 0
          : playerPosition.z - this.root.position.z;
      if (dx * dx + dz * dz > 0.0001) {
        // The model faces -Z; ease along the shortest arc without tilting.
        const target = Math.atan2(-dx, -dz);
        const difference = target - this.root.rotation.y;
        const shortestArc = Math.atan2(
          Math.sin(difference),
          Math.cos(difference),
        );
        this.root.rotation.y += shortestArc * (1 - Math.exp(-6 * step));
      }
    }
    for (const mat of this.materials) mat.opacity = opacity;
    this.root.traverse((object) => {
      if (object instanceof THREE.Mesh) object.castShadow = opacity === 1;
    });
  }
  private animateLegs(moving: boolean, running = false) {
    const swing = moving ? Math.sin(this.stepTime) * (running ? 0.5 : 0.3) : 0;
    this.legs.forEach((leg, index) => {
      leg.rotation.x = index === 0 ? swing : -swing;
    });
  }
}
