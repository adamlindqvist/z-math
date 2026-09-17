import * as THREE from "three";
import { ball, box, material, mesh, silhouette } from "../models";

/** Chunky orange Goron with a swept tuft, turquoise scarf and short green trousers. */
export class Yunobo {
  root = new THREE.Group();
  body = new THREE.Group();
  private arms: THREE.Group[] = [];
  private legs: THREE.Group[] = [];
  private rolling = new THREE.Group();
  private heart: THREE.Mesh;
  private stride = 0;
  private walkBlend = 0;
  constructor() {
    this.root.name = "yunobo";
    this.root.add(this.body);
    const skin = material("#f5a027"), rock = material("#98643a");
    const dark = material("#64482f"), blue = material("#079bb7"), hair = material("#e8ebbb");
    const hairShade = material("#b4c58c"), green = material("#436d3b"), leather = material("#725046");
    const buckle = material("#a18e67"), nail = material("#eee0ab"), eye = material("#16465c");
    this.rolling.position.y = 0.7;
    this.root.add(this.rolling);
    ball(this.rolling, skin, 0, 0, 0, 0.7);
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2;
      ball(this.rolling, rock, 0, Math.sin(a) * 0.63, Math.cos(a) * 0.63, 0.35, 0.2, 0.2);
    }

    // Broad shoulders and a round orange belly, with tiny legs underneath.
    ball(this.body, skin, 0, 1.06, 0, 0.7, 0.7, 0.49);
    ball(this.body, skin, 0, 1.39, -0.015, 0.78, 0.4, 0.4);
    ball(this.body, skin, 0, 0.99, 0.21, 0.59, 0.52, 0.35);
    ball(this.body, green, 0, 0.49, -0.02, 0.6, 0.24, 0.39);
    box(this.body, leather, 0, 0.54, 0.365, 0.88, 0.095, 0.08);
    box(this.body, buckle, 0, 0.54, 0.42, 0.16, 0.13, 0.045);
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++)
        ball(this.body, rock, side * (0.26 + i % 2 * 0.1), 0.94 + i * 0.22, -0.39, 0.27, 0.21, 0.18);
      const leg = new THREE.Group();
      leg.name = side < 0 ? "yunobo-left-leg" : "yunobo-right-leg";
      leg.position.set(side * 0.32, 0.49, 0);
      this.root.add(leg);
      this.legs.push(leg);
      ball(leg, green, 0, -0.04, 0, 0.24, 0.19, 0.26);
      ball(leg, skin, 0, -0.25, 0, 0.14, 0.19, 0.14);
      box(leg, leather, 0, -0.27, 0, 0.29, 0.065, 0.28);
      ball(leg, skin, 0, -0.38, 0.11, 0.2, 0.11, 0.28);
      for (let toe = 0; toe < 3; toe++)
        ball(leg, nail, (toe - 1) * 0.105, -0.37, 0.34, 0.043, 0.027, 0.04);

      const arm = new THREE.Group();
      arm.position.set(side * 0.66, 1.46, 0);
      this.body.add(arm);
      this.arms.push(arm);
      ball(arm, skin, side * 0.08, -0.12, 0, 0.3, 0.35, 0.3);
      ball(arm, skin, side * 0.2, -0.49, 0.02, 0.28, 0.38, 0.29);
      ball(arm, skin, side * 0.24, -0.84, 0.08, 0.3, 0.29, 0.28);
      ball(arm, skin, side * 0.07, -0.77, 0.27, 0.11, 0.17, 0.11);
      ball(arm, nail, side * 0.07, -0.84, 0.34, 0.06, 0.05, 0.025);
      for (const [x, y, radius] of [[0.14, -0.28, 0.285], [0.23, -0.65, 0.265]]) {
        mesh(new THREE.CylinderGeometry(radius, radius, 0.095, 10), leather, arm, side * x, y, 0.025);
        box(arm, buckle, side * x, y, radius + 0.025, 0.12, 0.12, 0.035);
      }
    }

    // The scarf rests around the shoulders and ties at the front.
    const scarf = mesh(new THREE.TorusGeometry(0.45, 0.115, 6, 16), blue, this.body, 0, 1.58, 0.02);
    scarf.rotation.x = Math.PI / 2;
    scarf.scale.set(1.25, 0.95, 1);
    for (const side of [-1, 1]) {
      ball(this.body, blue, side * 0.1, 1.47, 0.46, 0.12, 0.12, 0.085);
      const tail = silhouette(this.body, blue, [[side * 0.09, 1.49], [side * 0.4, 1.32], [side * 0.27, 1.19], [side * 0.04, 1.4]]);
      tail.position.z = 0.44;
    }
    box(this.body, leather, 0, 1.26, 0.5, 0.075, 0.35, 0.035);
    const pendant = box(this.body, buckle, 0, 1.13, 0.57, 0.34, 0.36, 0.055);
    pendant.rotation.z = -0.12;
    box(this.body, leather, 0, 1.13, 0.605, 0.27, 0.29, 0.025);
    const red = material("#d94736");
    const gem = silhouette(this.body, red, [[-0.1, 1.04], [-0.015, 1.24], [0.035, 1.13], [0.11, 1.18], [0.06, 1.04]], 0.02);
    gem.position.z = 0.63;

    ball(this.body, skin, 0, 1.87, 0.035, 0.47, 0.48, 0.38);
    ball(this.body, skin, 0, 1.7, 0.15, 0.49, 0.26, 0.32);
    for (const side of [-1, 1]) {
      ball(this.body, eye, side * 0.185, 1.87, 0.396, 0.038, 0.055, 0.02);
      ball(this.body, nail, side * 0.185 - 0.009, 1.89, 0.415, 0.011, 0.014, 0.008);
      const brow = ball(this.body, dark, side * 0.2, 2.005, 0.365, 0.105, 0.027, 0.025);
      brow.rotation.z = -side * 0.35;
      ball(this.body, material("#ee812e"), side * 0.3, 1.76, 0.365, 0.075, 0.04, 0.025);
    }
    ball(this.body, skin, 0, 1.78, 0.44, 0.12, 0.09, 0.075);
    for (const side of [-1, 1]) ball(this.body, dark, side * 0.047, 1.77, 0.504, 0.023, 0.028, 0.01);
    ball(this.body, material("#b97747"), 0, 1.645, 0.432, 0.29, 0.075, 0.035);
    ball(this.body, dark, 0, 1.655, 0.46, 0.255, 0.023, 0.014);

    // Swept ivory crest with a long front lock, rather than three round tufts.
    const crest = silhouette(this.body, hairShade, [[-0.2, 2.18], [-0.21, 2.41], [-0.1, 2.57], [0.06, 2.61], [0.23, 2.5], [0.37, 2.48], [0.28, 2.39], [0.12, 2.4], [0.2, 2.31], [0.06, 2.16], [0.035, 1.98], [-0.1, 2.08]], 0.17);
    crest.position.z = 0.11;
    const lock = silhouette(this.body, hair, [[-0.15, 2.19], [-0.17, 2.4], [-0.06, 2.53], [0.055, 2.55], [0.22, 2.45], [0.08, 2.47], [-0.02, 2.41], [0.1, 2.37], [-0.035, 2.22], [0.035, 1.98], [-0.1, 2.09]], 0.06);
    lock.position.z = 0.29;
    this.heart = silhouette(this.root, material("#ff8b9b"), [[0, -0.18], [-0.24, 0.04], [-0.24, 0.2], [-0.12, 0.28], [0, 0.17], [0.12, 0.28], [0.24, 0.2], [0.24, 0.04]]);
    this.heart.position.set(0, 2.9, 0);
    this.root.scale.setScalar(0.72);
    this.animate(0, 0, false);
  }
  animate(time: number, speed: number, greeting: boolean, roll = 0, dt = 0) {
    this.body.visible = roll === 0;
    this.rolling.visible = roll > 0;
    this.rolling.rotation.x = roll * Math.PI * 4;
    // Advance steps by distance, so slow walking never becomes foot sliding.
    this.stride += speed * dt * 7;
    this.walkBlend = dt > 0 ? THREE.MathUtils.damp(this.walkBlend, Math.min(1, speed / 1.5), 12, dt) : 0;
    const swing = Math.sin(this.stride) * this.walkBlend;
    this.body.position.y = (1 - Math.cos(this.stride * 2)) * 0.018 * this.walkBlend;
    this.body.rotation.z = swing * 0.035;
    this.arms.forEach((arm, i) => {
      arm.rotation.x = (i === 0 ? -1 : 1) * swing * 0.22;
      arm.rotation.z = greeting && i === 1 ? 2.3 + Math.sin(time * 5) * 0.3 : 0;
    });
    this.legs.forEach((leg, i) => {
      const phase = this.stride + i * Math.PI;
      leg.visible = roll === 0;
      leg.rotation.x = Math.sin(phase) * this.walkBlend * 0.48;
      leg.position.y = 0.49 + Math.max(0, Math.sin(phase)) * this.walkBlend * 0.055;
    });
    this.heart.visible = greeting;
    this.heart.position.y = 2.9 + Math.sin(time * 3) * 0.08;
  }
}
