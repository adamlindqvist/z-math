import * as THREE from "three";
import { material, mesh } from "../models";
export class Collectible {
  root = new THREE.Group();
  constructor(
    public id: string,
    x: number,
    z: number,
  ) {
    const coin = mesh(
      new THREE.CylinderGeometry(0.21, 0.21, 0.085, 16),
      material("#f9c74c", 0.3),
      this.root,
    );
    coin.rotation.x = Math.PI / 2;
    const inner = mesh(
      new THREE.TorusGeometry(0.145, 0.018, 4, 16),
      material("#fff0a0", 0.3),
      this.root,
      0,
      0,
      0.05,
    );
    inner.castShadow = false;
    this.root.position.set(x, 0.65, z);
  }
  update(time: number, collected: boolean) {
    this.root.visible = !collected;
    this.root.rotation.y = time * 1.8;
    this.root.position.y =
      0.68 + Math.sin(time * 3 + this.root.position.x) * 0.09;
  }
}
