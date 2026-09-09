import * as THREE from "three";
import { material, mesh } from "../models";
export class Collectible {
  root = new THREE.Group();
  constructor(
    public id: string,
    x: number,
    z: number,
  ) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.3);
    shape.lineTo(0.18, 0.08);
    shape.lineTo(0.12, -0.3);
    shape.lineTo(-0.12, -0.3);
    shape.lineTo(-0.18, 0.08);
    shape.closePath();
    const rupee = mesh(
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.09,
        bevelEnabled: true,
        bevelSize: 0.018,
        bevelThickness: 0.018,
        bevelSegments: 1,
      }),
      material("#38a7ac", 0.35),
      this.root,
      0,
      0,
      -0.045,
    );
    rupee.castShadow = true;
    this.root.position.set(x, 0.65, z);
  }
  update(time: number, collected: boolean) {
    this.root.visible = !collected;
    this.root.rotation.y = time * 1.8;
    this.root.position.y =
      0.68 + Math.sin(time * 3 + this.root.position.x) * 0.09;
  }
}
