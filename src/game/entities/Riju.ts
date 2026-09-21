import * as THREE from "three";
import { ball, box, material, mesh, silhouette } from "../models";

/** Gerudo companion with a sun crown, red ponytail and paired curved swords. */
export class Riju {
  readonly root = new THREE.Group();
  private body = new THREE.Group();
  private arms: THREE.Group[] = [];
  private legs: THREE.Group[] = [];
  private heart: THREE.Mesh;
  private stride = 0;
  private blend = 0;
  constructor() {
    this.root.name = "riju";
    this.root.add(this.body);
    const skin = material("#bb792d"), hair = material("#b52c3c"), gold = material("#f1c448", 0.4);
    const ivory = material("#eee9c9"), dark = material("#353b3c"), turquoise = material("#38c0bc");
    const silver = material("#dce4d5", 0.4), white = material("#fff9eb");
    ball(this.body, skin, 0, 1.25, 0, 0.25, 0.38, 0.19);
    ball(this.body, dark, 0, 1.46, 0.035, 0.3, 0.18, 0.2);
    const skirt = mesh(new THREE.CylinderGeometry(0.25, 0.52, 0.48, 10), dark, this.body, 0, 0.91);
    skirt.name = "riju-skirt";
    mesh(new THREE.CylinderGeometry(0.47, 0.53, 0.09, 10), ivory, this.body, 0, 0.69);
    mesh(new THREE.CylinderGeometry(0.28, 0.29, 0.09, 10), gold, this.body, 0, 1.17);
    for (let i = 0; i < 10; i++) {
      const a = i * Math.PI / 5;
      ball(this.body, gold, Math.sin(a) * 0.51, 0.65, Math.cos(a) * 0.51, 0.045, 0.06, 0.035);
      ball(this.body, gold, Math.sin(a) * 0.4, 0.92, Math.cos(a) * 0.4, 0.065, 0.09, 0.04);
      ball(this.body, turquoise, Math.sin(a) * 0.425, 0.93, Math.cos(a) * 0.425, 0.042, 0.065, 0.035);
    }
    for (const side of [-1, 1]) {
      const trim = box(this.body, gold, side * 0.14, 1.46, 0.215, 0.055, 0.32, 0.035);
      trim.rotation.z = side * 0.65;
      const leg = new THREE.Group(); leg.position.set(side * 0.18, 0.77, 0);
      leg.name = side < 0 ? "riju-left-leg" : "riju-right-leg";
      this.root.add(leg); this.legs.push(leg);
      ball(leg, skin, 0, -0.29, 0, 0.12, 0.35, 0.12);
      ball(leg, dark, 0, -0.66, 0.09, 0.14, 0.08, 0.22);
      box(leg, gold, 0, -0.6, 0.17, 0.22, 0.06, 0.05);
      const anklet = mesh(new THREE.TorusGeometry(0.115, 0.025, 4, 10), gold, leg, 0, -0.51);
      anklet.rotation.x = Math.PI / 2;
      const arm = new THREE.Group(); arm.position.set(side * 0.31, 1.52, 0);
      this.body.add(arm); this.arms.push(arm);
      ball(arm, gold, 0, 0, 0, 0.16, 0.12, 0.17);
      ball(arm, turquoise, 0, 0.02, 0.15, 0.07, 0.065, 0.03);
      ball(arm, skin, side * 0.035, -0.23, 0, 0.1, 0.25, 0.11);
      ball(arm, gold, side * 0.04, -0.4, 0, 0.12, 0.1, 0.12);
      ball(arm, skin, side * 0.04, -0.51, 0, 0.105, 0.12, 0.1);
      const sword = new THREE.Group(); sword.name = "riju-scimitar";
      sword.position.set(side * 0.05, -0.52, 0.05); sword.rotation.z = side * -0.65;
      arm.add(sword);
      box(sword, gold, 0, 0, 0, 0.07, 0.26, 0.07);
      ball(sword, gold, 0, 0.16, 0, 0.2, 0.05, 0.1);
      ball(sword, turquoise, 0, 0.16, 0.08, 0.06, 0.04, 0.025);
      silhouette(sword, silver, [[-0.055, 0.2], [-0.07, 0.52], [0.02, 0.78], [0.24, 1], [0.18, 0.73], [0.13, 0.48], [0.07, 0.2]], 0.035);
    }
    ball(this.body, gold, 0, 1.5, 0.23, 0.105, 0.13, 0.04);
    ball(this.body, turquoise, 0, 1.5, 0.266, 0.065, 0.095, 0.025);
    ball(this.body, skin, 0, 1.7, 0, 0.12, 0.15, 0.12);
    ball(this.body, hair, 0, 1.98, -0.065, 0.36, 0.38, 0.28);
    ball(this.body, skin, 0, 1.98, 0.13, 0.28, 0.29, 0.2);
    for (const side of [-1, 1]) {
      ball(this.body, hair, side * 0.27, 1.99, 0.04, 0.095, 0.29, 0.16);
      ball(this.body, white, side * 0.115, 2.025, 0.31, 0.085, 0.075, 0.025);
      ball(this.body, turquoise, side * 0.115, 2.025, 0.335, 0.043, 0.059, 0.012);
      ball(this.body, dark, side * 0.115, 2.025, 0.346, 0.021, 0.042, 0.007);
      ball(this.body, white, side * 0.1, 2.049, 0.354, 0.012);
      const brow = box(this.body, dark, side * 0.12, 2.12, 0.305, 0.14, 0.025, 0.025); brow.rotation.z = side * -0.15;
      mesh(new THREE.TorusGeometry(0.075, 0.021, 4, 10), gold, this.body, side * 0.3, 1.87, 0.13);
    }
    ball(this.body, skin, 0, 1.965, 0.33, 0.048, 0.06, 0.05);
    const smile = mesh(new THREE.TorusGeometry(0.09, 0.016, 4, 12, Math.PI), dark, this.body, 0, 1.89, 0.316); smile.rotation.z = Math.PI;
    // Crown and ponytail use local pivots, keeping every part attached from behind.
    const crown = new THREE.Group(); crown.position.set(0, 2.37, -0.06); this.body.add(crown);
    mesh(new THREE.TorusGeometry(0.25, 0.043, 5, 16), gold, crown, 0, 0.13);
    for (let i = 0; i < 9; i++) {
      const a = i * Math.PI / 8;
      const ray = mesh(new THREE.ConeGeometry(0.05, 0.19, 4), gold, crown, Math.cos(a) * 0.32, 0.13 + Math.sin(a) * 0.32);
      ray.rotation.z = a - Math.PI / 2;
    }
    ball(crown, hair, 0, 0, 0.04, 0.13, 0.18, 0.14);
    for (let i = 0; i < 5; i++) ball(this.body, hair, -0.1 * i, 2.32 - i * 0.11, -0.18 - i * 0.12, 0.16 - i * 0.016, 0.18, 0.18);
    box(this.body, gold, 0, 2.19, 0.28, 0.43, 0.055, 0.035);
    ball(this.body, gold, 0, 2.17, 0.315, 0.095, 0.1, 0.035);
    ball(this.body, turquoise, 0, 2.17, 0.349, 0.043, 0.063, 0.015);
    this.heart = silhouette(this.root, material("#ff8b9b"), [[0,-0.18],[-0.24,0.04],[-0.24,0.2],[-0.12,0.28],[0,0.17],[0.12,0.28],[0.24,0.2],[0.24,0.04]]);
    this.root.scale.setScalar(0.75);
    this.animate(0, 0, false);
  }
  animate(time: number, speed: number, greeting: boolean, dt = 0, helping = false, waiting = false) {
    this.stride += speed * dt * 6;
    this.blend = dt > 0 ? THREE.MathUtils.damp(this.blend, Math.min(1, speed / 1.5), 12, dt) : 0;
    const swing = Math.sin(this.stride) * this.blend;
    this.body.position.y = (1 - Math.cos(this.stride * 2)) * 0.012 * this.blend;
    this.legs.forEach((leg, i) => { leg.rotation.x = Math.sin(this.stride + i * Math.PI) * this.blend * 0.4; });
    this.arms.forEach((arm, i) => {
      arm.rotation.x = helping ? -1 : swing * (i ? 0.16 : -0.16);
      arm.rotation.z = (i ? 1 : -1) * (helping ? 0.8 : greeting || waiting ? 0.5 + Math.sin(time * 3) * 0.1 : 0.15);
    });
    this.heart.visible = greeting;
    this.heart.position.set(0, 3.05 + Math.sin(time * 3) * 0.08, 0);
  }
}
