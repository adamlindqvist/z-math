import * as THREE from "three";
import { box, material, mesh } from "../models";
export class Chest {
  root = new THREE.Group();
  lid = new THREE.Group();
  openAmount = 0;
  constructor(open: boolean) {
    const wood = material("#b86537"),
      gold = material("#efc562", 0.38),
      dark = material("#694730");
    box(this.root, dark, 0, 0.3, 0, 1.05, 0.55, 0.72);
    box(this.root, wood, 0, 0.35, 0, 1, 0.48, 0.7);
    this.lid.position.set(0, 0.6, -0.35);
    this.root.add(this.lid);
    const top = mesh(
      new THREE.CylinderGeometry(0.36, 0.36, 1.04, 12, 1, false, 0, Math.PI),
      wood,
      this.lid,
      0,
      0,
      0.35,
    );
    top.rotation.z = Math.PI / 2;
    box(this.lid, wood, 0, 0.04, 0.35, 1.04, 0.14, 0.7);
    for (const x of [-0.37, 0.37]) {
      box(this.root, gold, x, 0.34, 0.365, 0.11, 0.53, 0.045);
      box(this.lid, gold, x, 0.13, 0.35, 0.105, 0.055, 0.69);
    }
    box(this.root, gold, 0, 0.48, 0.4, 0.23, 0.25, 0.09);
    box(this.root, dark, 0, 0.48, 0.452, 0.045, 0.08, 0.015);
    this.root.position.set(5.6, 0, -3.7);
    this.openAmount = open ? 1 : 0;
  }
  update(dt: number, opened: boolean) {
    this.openAmount +=
      ((opened ? 1 : 0) - this.openAmount) * Math.min(1, dt * 5);
    this.lid.rotation.x = -this.openAmount * 1.8;
  }
}
