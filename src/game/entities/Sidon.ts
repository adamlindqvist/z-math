import * as THREE from "three";
import { ball, box, material, mesh, silhouette } from "../models";

/** Friendly red Zora: swept shark head, ivory chest, silver armour and a trident. */
export class Sidon {
  root = new THREE.Group();
  private body = new THREE.Group();
  private arms: THREE.Group[] = [];
  private legs: THREE.Group[] = [];
  private heart: THREE.Mesh;
  private stride = 0;
  private walkBlend = 0;
  constructor() {
    this.root.name = "sidon";
    this.root.add(this.body);
    const red = material("#ba3154"), shadow = material("#76283e"), ivory = material("#e4efcf");
    const silver = material("#c5d2c6", 0.4), steel = material("#586c6a", 0.45), turquoise = material("#4fbfc2");
    const gold = material("#e6c55e", 0.45), dark = material("#263b3d"), white = material("#fff9e0");
    ball(this.body, red, 0, 1.37, 0, 0.35, 0.51, 0.23);
    ball(this.body, ivory, 0, 1.34, 0.18, 0.255, 0.44, 0.1);
    ball(this.body, red, 0, 1.64, -0.025, 0.47, 0.24, 0.24);
    const chest = silhouette(this.body, turquoise, [[-0.19, 1.69], [0.19, 1.69], [0.15, 1.27], [0, 1.11], [-0.15, 1.27]], 0.035);
    chest.position.z = 0.265;
    for (const side of [-1, 1]) {
      const trim = box(this.body, silver, side * 0.23, 1.5, 0.24, 0.055, 0.48, 0.045);
      trim.rotation.z = side * 0.25;
      const sash = silhouette(this.body, turquoise, [[side * 0.16, 1.06], [side * 0.33, 0.98], [side * 0.5, 0.56], [side * 0.29, 0.65]], 0.035);
      sash.position.z = -0.01;
      const hem = box(this.body, gold, side * 0.39, 0.62, 0.025, 0.24, 0.055, 0.04);
      hem.rotation.z = side * 0.35;
      const hipFin = silhouette(this.body, red, [[side * 0.24, 1.08], [side * 0.56, 0.56], [side * 0.36, 0.66]], 0.04);
      hipFin.position.z = -0.1;

      const leg = new THREE.Group();
      leg.name = side < 0 ? "sidon-left-leg" : "sidon-right-leg";
      leg.position.set(side * 0.19, 0.94, 0);
      this.root.add(leg); this.legs.push(leg);
      ball(leg, red, 0, -0.25, 0, 0.16, 0.3, 0.17);
      ball(leg, ivory, 0, -0.23, 0.13, 0.13, 0.26, 0.06);
      ball(leg, red, 0, -0.62, 0.015, 0.12, 0.26, 0.13);
      for (let i = 0; i < 2; i++) {
        const band = mesh(new THREE.TorusGeometry(0.125, 0.022, 4, 10), silver, leg, 0, -0.65 - i * 0.085, 0.015);
        band.rotation.x = Math.PI / 2; band.rotation.z = side * 0.2;
      }
      ball(leg, red, 0, -0.84, 0.1, 0.16, 0.1, 0.25);
      ball(leg, ivory, side * 0.03, -0.85, 0.3, 0.085, 0.028, 0.045);
      const ankleGem = ball(leg, turquoise, 0, -0.7, 0.15, 0.04, 0.075, 0.025);
      ankleGem.rotation.z = side * 0.2;

      const arm = new THREE.Group();
      arm.position.set(side * 0.39, 1.69, 0);
      this.body.add(arm); this.arms.push(arm);
      ball(arm, red, side * 0.04, -0.18, 0, 0.15, 0.25, 0.16);
      ball(arm, silver, side * 0.035, 0.025, 0, 0.22, 0.13, 0.22);
      const shoulder = silhouette(arm, steel, [[-0.15, 0.03], [0, 0.21], [0.18, 0.05], [0.14, -0.06], [-0.13, -0.06]], 0.035);
      shoulder.position.z = 0.17;
      ball(arm, turquoise, 0.025, 0.05, 0.215, 0.065, 0.08, 0.02);
      ball(arm, red, side * 0.065, -0.48, 0.025, 0.115, 0.23, 0.13);
      ball(arm, ivory, side * 0.065, -0.48, 0.12, 0.09, 0.2, 0.045);
      const armFin = silhouette(arm, red, [[side * 0.14, -0.25], [side * 0.38, -0.57], [side * 0.14, -0.47]], 0.035);
      armFin.position.z = -0.04;
      for (let i = 0; i < 2; i++) {
        const cuff = mesh(new THREE.TorusGeometry(0.12, 0.019, 4, 10), silver, arm, side * 0.065, -0.59 + i * 0.075, 0.025);
        cuff.rotation.x = Math.PI / 2;
      }
      ball(arm, red, side * 0.065, -0.7, 0.065, 0.105, 0.13, 0.1);
    }
    box(this.body, steel, 0, 1, 0.2, 0.57, 0.095, 0.08);
    const beltGem = silhouette(this.body, silver, [[0, 1.14], [-0.115, 1.025], [0, 0.91], [0.115, 1.025]], 0.035);
    beltGem.position.z = 0.27;
    const jewel = silhouette(this.body, turquoise, [[0, 1.105], [-0.07, 1.025], [0, 0.955], [0.07, 1.025]], 0.025);
    jewel.position.z = 0.31;

    ball(this.body, ivory, 0, 1.87, 0, 0.14, 0.2, 0.14);
    ball(this.body, red, 0, 2.12, -0.015, 0.3, 0.31, 0.26);
    ball(this.body, ivory, 0, 2.03, 0.18, 0.235, 0.23, 0.15);
    // Wide sloping brow and trailing shark-head fin are Sidon's defining silhouette.
    const brow = silhouette(this.body, red, [[-0.52, 2.21], [-0.3, 2.35], [0, 2.42], [0.3, 2.35], [0.52, 2.43], [0.38, 2.19], [0.12, 2.12], [-0.12, 2.12]], 0.15);
    brow.position.z = 0.19;
    // Local coordinates keep the fin attached when it turns into the head's side profile.
    const headFin = silhouette(this.body, shadow, [[0, 0.15], [0.23, 0.04], [0.44, -0.25], [0.59, -0.65], [0.35, -0.55], [0.15, -0.3], [-0.03, -0.08]], 0.16);
    headFin.name = "sidon-head-fin";
    headFin.position.set(-0.08, 2.24, -0.09);
    headFin.rotation.y = Math.PI / 2;
    const dorsal = silhouette(this.body, red, [[0, 0.08], [0.42, -0.27], [0.16, -0.23]], 0.06);
    dorsal.position.set(-0.03, 1.6, -0.16); dorsal.rotation.y = Math.PI / 2;
    for (const side of [-1, 1]) {
      const cheek = silhouette(this.body, red, [[side * 0.24, 2.17], [side * 0.34, 1.68], [side * 0.2, 1.83], [side * 0.17, 2.07]], 0.065);
      cheek.position.z = 0.07;
      ball(this.body, dark, side * 0.14, 2.12, 0.305, 0.085, 0.045, 0.02);
      ball(this.body, gold, side * 0.14, 2.12, 0.324, 0.038, 0.036, 0.012);
      ball(this.body, dark, side * 0.14, 2.12, 0.335, 0.014, 0.028, 0.006);
    }
    const smile = mesh(new THREE.TorusGeometry(0.13, 0.025, 4, 12, Math.PI), dark, this.body, 0, 1.985, 0.316);
    smile.rotation.z = Math.PI;
    for (const x of [-0.075, 0, 0.075]) {
      const tooth = mesh(new THREE.ConeGeometry(0.025, 0.045, 3), white, this.body, x, 1.96, 0.335);
      tooth.rotation.z = Math.PI;
    }
    const crest = silhouette(this.body, silver, [[-0.075, 2.36], [-0.07, 2.65], [0.02, 2.79], [0.09, 2.59], [0.075, 2.37]], 0.04);
    crest.position.z = -0.02;
    const crestInset = silhouette(this.body, steel, [[-0.04, 2.48], [-0.035, 2.65], [0.02, 2.73], [0.055, 2.57]], 0.025);
    crestInset.position.z = 0.025;

    // A compact three-pronged spear, held upright clear of the path.
    const trident = new THREE.Group();
    trident.name = "sidon-trident";
    trident.position.set(-0.1, -0.67, 0.12);
    trident.rotation.z = -0.12;
    this.arms[0].add(trident);
    mesh(new THREE.CylinderGeometry(0.024, 0.024, 2.3, 6), silver, trident, 0, 0.38);
    mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.36, 6), turquoise, trident, 0, 0.05);
    for (const side of [-1, 1]) {
      const fork = silhouette(trident, silver, [[0, 1.26], [side * 0.23, 1.4], [side * 0.3, 1.72], [side * 0.2, 1.61], [side * 0.15, 1.46], [0, 1.38]], 0.04);
      fork.position.z = -0.02;
      const inset = silhouette(trident, red, [[side * 0.15, 1.45], [side * 0.24, 1.65], [side * 0.17, 1.55]], 0.02);
      inset.position.z = 0.025;
    }
    const middle = silhouette(trident, silver, [[0, 1.91], [-0.085, 1.6], [0, 1.4], [0.085, 1.6]], 0.04);
    middle.position.z = -0.02;
    const spearGem = silhouette(trident, turquoise, [[0, 1.78], [-0.04, 1.6], [0, 1.51], [0.04, 1.6]], 0.025);
    spearGem.position.z = 0.025;
    this.heart = silhouette(this.root, material("#ff8b9b"), [[0, -0.18], [-0.24, 0.04], [-0.24, 0.2], [-0.12, 0.28], [0, 0.17], [0.12, 0.28], [0.24, 0.2], [0.24, 0.04]]);
    this.root.scale.setScalar(0.73);
    this.animate(0, 0, false);
  }
  animate(time: number, speed: number, greeting: boolean, dt = 0, helping = false, waiting = false) {
    this.stride += speed * dt * 6;
    this.walkBlend = dt > 0 ? THREE.MathUtils.damp(this.walkBlend, Math.min(1, speed / 1.5), 12, dt) : 0;
    const swing = Math.sin(this.stride) * this.walkBlend;
    this.body.position.y = (1 - Math.cos(this.stride * 2)) * 0.013 * this.walkBlend;
    this.body.rotation.z = swing * 0.02;
    this.legs.forEach((leg, i) => {
      const phase = this.stride + i * Math.PI;
      leg.rotation.x = Math.sin(phase) * this.walkBlend * 0.4;
      leg.position.y = 0.94 + Math.max(0, Math.sin(phase)) * this.walkBlend * 0.035;
    });
    this.arms[0].rotation.x = helping ? -0.4 : -swing * 0.08;
    this.arms[1].rotation.x = swing * 0.25;
    this.arms[1].rotation.z = greeting || waiting ? 2.2 + Math.sin(time * 4) * 0.18 : helping ? 1.2 : 0;
    this.heart.visible = greeting;
    this.heart.position.set(0, 3.05 + Math.sin(time * 3) * 0.08, 0);
  }
}
