import * as THREE from "three";
import { ball, box, material, mesh } from "../models";

export class Bokoblin {
  root = new THREE.Group();
  private flight = 0;
  private materials: THREE.Material[];
  constructor(unlocked: boolean) {
    this.root.name = "Bokoblin";
    const skin = material("#bf795c"),
      cloth = material("#736449"),
      eye = material("#fff3d9"),
      snout = material("#dca17b"),
      pupil = material("#453e35");
    this.materials = [skin, cloth, eye, snout, pupil];
    for (const mat of this.materials) mat.transparent = true;
    ball(this.root, skin, 0, 0.85, 0, 0.43, 0.52, 0.3);
    ball(this.root, skin, 0, 1.5, 0, 0.48, 0.4, 0.35);
    ball(this.root, snout, 0, 1.35, -0.32, 0.25, 0.18, 0.16);
    for (const side of [-1, 1]) {
      const ear = mesh(
        new THREE.ConeGeometry(0.2, 0.6, 4),
        skin,
        this.root,
        side * 0.5,
        1.62,
        0,
      );
      ear.rotation.z = -side * 1.1;
      ball(this.root, eye, side * 0.19, 1.56, -0.29, 0.11);
      ball(this.root, pupil, side * 0.19, 1.56, -0.38, 0.048);
      box(this.root, cloth, side * 0.23, 0.25, 0, 0.24, 0.5, 0.3);
      ball(this.root, skin, side * 0.51, 0.83, 0, 0.17, 0.35, 0.17);
    }
    box(this.root, cloth, 0, 0.55, 0, 0.75, 0.25, 0.55);
    this.flight = unlocked ? 1 : 0;
    this.update(0, unlocked, false);
  }
  update(dt: number, unlocked: boolean, paused: boolean) {
    if (!unlocked) this.flight = 0;
    else if (!paused) this.flight = Math.min(1, this.flight + dt / 0.9);
    const opacity = 1 - this.flight;
    this.root.visible = this.flight < 1;
    this.root.position.set(
      this.flight * 3.8,
      Math.sin(this.flight * Math.PI * 8) * 0.08,
      7.9 - this.flight * 1.2,
    );
    this.root.rotation.y = unlocked ? -Math.PI / 2 : 0;
    for (const mat of this.materials) mat.opacity = opacity;
    this.root.traverse((object) => {
      if (object instanceof THREE.Mesh) object.castShadow = opacity === 1;
    });
  }
}
