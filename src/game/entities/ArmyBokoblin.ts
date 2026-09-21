import * as THREE from "three";
import { Bokoblin } from "./Bokoblin";

/** Stationary guard with a short, pooled smoke effect; no bridge patrol behavior. */
export class ArmyBokoblin {
  root = new THREE.Group();
  private model = new Bokoblin(false, true).root;
  private smokeMaterial = new THREE.MeshBasicMaterial({ color: "#d92340", transparent: true, opacity: 0, depthWrite: false });
  private smoke = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), this.smokeMaterial, 14);
  private dummy = new THREE.Object3D();
  private fade: number;
  constructor(defeated: boolean) {
    this.model.position.set(0, 0, 0);
    this.model.rotation.y = Math.PI;
    this.root.add(this.model, this.smoke);
    this.smoke.name = "red-smoke";
    this.smoke.frustumCulled = false;
    this.fade = defeated ? 1 : 0;
    this.update(0, 0, defeated, false);
  }
  update(dt: number, time: number, defeated: boolean, paused: boolean) {
    if (!defeated) this.fade = 0;
    else if (!paused) this.fade = Math.min(1, this.fade + Math.max(0, dt) / 1.4);
    this.model.visible = this.fade < 0.45;
    this.model.scale.setScalar(1 - this.fade * 0.8);
    this.model.position.y = defeated ? this.fade * 0.5 : Math.sin(time * 2) * 0.035;
    this.smoke.visible = this.fade > 0 && this.fade < 1;
    this.smokeMaterial.opacity = Math.sin(this.fade * Math.PI) * 0.65;
    for (let i = 0; i < this.smoke.count; i++) {
      const angle = i * 2.4;
      const spread = 0.3 + this.fade * 0.9;
      this.dummy.position.set(Math.cos(angle) * spread, 0.4 + (i % 4) * 0.38 + this.fade * 2, Math.sin(angle) * spread);
      this.dummy.scale.setScalar((0.3 + (i % 3) * 0.08) * (1 + this.fade));
      this.dummy.updateMatrix();
      this.smoke.setMatrixAt(i, this.dummy.matrix);
    }
    this.smoke.instanceMatrix.needsUpdate = true;
  }
}
