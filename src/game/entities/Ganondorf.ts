import * as THREE from "three";
import { ball, box, material, mesh, silhouette } from "../models";

/** A quiet placeholder for the final boss; no combat or rewards yet. */
export class Ganondorf {
  root = new THREE.Group();
  private chest = new THREE.Group();
  private ponytail: THREE.Mesh;

  constructor() {
    this.root.name = "ganondorf";
    const skin = material("#818665"),
      hair = material("#b94d37"),
      robe = material("#302f38"),
      trim = material("#763b42"),
      gold = material("#efbe51", 0.4),
      cloth = material("#c3ae8a"),
      boots = material("#384d46"),
      dark = material("#22272a"),
      eyes = material("#ffc969"),
      jewel = material("#ab665c", 0.35);

    // Broad silhouette, planted boots and a robe draped over one shoulder.
    for (const side of [-1, 1]) {
      ball(this.root, robe, side * 0.28, 0.73, 0, 0.28, 0.46, 0.28);
      ball(this.root, boots, side * 0.29, 0.27, 0.09, 0.24, 0.27, 0.34);
      mesh(
        new THREE.CylinderGeometry(0.22, 0.23, 0.07, 10),
        gold,
        this.root,
        side * 0.29,
        0.47,
      );
    }
    const cape = mesh(
      new THREE.CylinderGeometry(
        0.45,
        0.85,
        1.75,
        10,
        1,
        true,
        Math.PI / 2,
        Math.PI,
      ),
      robe,
      this.root,
      0,
      1.14,
      -0.08,
    );
    robe.side = THREE.DoubleSide;
    cape.scale.z = 0.72;
    box(this.root, cloth, 0, 1.12, 0, 0.91, 0.23, 0.63);
    const sash = box(this.root, trim, 0, 1.24, 0.33, 0.94, 0.1, 0.06);
    sash.rotation.z = -0.13;
    ball(this.root, gold, 0.26, 1.14, 0.37, 0.12, 0.12, 0.04);
    const hangingSash = box(
      this.root,
      cloth,
      0.32,
      0.87,
      0.36,
      0.18,
      0.48,
      0.07,
    );
    hangingSash.rotation.z = 0.2;

    this.chest.position.y = 1.35;
    this.root.add(this.chest);
    ball(this.chest, skin, 0, 0.34, 0, 0.57, 0.49, 0.33);
    ball(this.chest, robe, 0.46, 0.4, -0.02, 0.26, 0.46, 0.37);
    const border = box(this.chest, trim, 0.29, 0.36, 0.32, 0.1, 0.84, 0.06);
    border.rotation.z = -0.14;
    for (const side of [-1, 1]) {
      const arm = ball(
        this.chest,
        side < 0 ? skin : robe,
        side * 0.62,
        0.16,
        0,
        0.21,
        0.43,
        0.24,
      );
      arm.rotation.z = side * 0.13;
      mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.1, 10),
        gold,
        this.chest,
        side * 0.67,
        -0.1,
      );
      ball(this.chest, skin, side * 0.68, -0.24, 0.06, 0.16, 0.18, 0.16);
    }
    // Necklace and forehead ornament echo the reference's gold jewellery.
    for (let i = -2; i <= 2; i++)
      ball(
        this.chest,
        gold,
        i * 0.15,
        0.57 + Math.abs(i) * 0.045,
        0.3,
        0.055,
        0.07,
        0.04,
      );
    ball(this.chest, gold, 0, 0.44, 0.35, 0.13, 0.15, 0.045);
    ball(this.chest, jewel, 0, 0.44, 0.39, 0.065, 0.085, 0.025);

    ball(this.chest, hair, 0, 0.94, -0.13, 0.4, 0.41, 0.29);
    ball(this.chest, skin, 0, 0.94, 0.045, 0.34, 0.35, 0.3);
    ball(this.chest, hair, 0, 0.7, 0.12, 0.29, 0.15, 0.23);
    ball(this.chest, skin, 0, 0.78, 0.26, 0.2, 0.09, 0.08);
    for (const side of [-1, 1]) {
      const ear = silhouette(
        this.chest,
        skin,
        [
          [side * 0.29, 1.04],
          [side * 0.53, 1.15],
          [side * 0.36, 0.86],
        ],
        0.09,
      );
      ear.position.z = 0.01;
      ball(this.chest, gold, side * 0.39, 0.89, 0.09, 0.04, 0.07, 0.035);
      ball(this.chest, dark, side * 0.13, 0.98, 0.314, 0.085, 0.045, 0.022);
      ball(this.chest, eyes, side * 0.13, 0.98, 0.335, 0.034, 0.03, 0.01);
      const brow = box(
        this.chest,
        hair,
        side * 0.13,
        1.05,
        0.31,
        0.2,
        0.055,
        0.055,
      );
      brow.rotation.z = side * 0.14;
    }
    ball(this.chest, skin, 0, 0.89, 0.34, 0.065, 0.085, 0.06);
    box(this.chest, dark, 0, 0.78, 0.336, 0.15, 0.018, 0.01);
    ball(this.chest, hair, 0, 1.25, -0.06, 0.36, 0.2, 0.3);
    ball(this.chest, hair, 0, 1.5, -0.12, 0.23, 0.27, 0.22);
    mesh(
      new THREE.CylinderGeometry(0.2, 0.21, 0.07, 10),
      gold,
      this.chest,
      0,
      1.4,
      -0.12,
    );
    this.ponytail = ball(this.chest, hair, 0.13, 1.12, -0.4, 0.22, 0.25, 0.51);
    box(this.chest, gold, 0, 1.16, 0.29, 0.53, 0.055, 0.06);
    const ornament = mesh(
      new THREE.OctahedronGeometry(0.13),
      gold,
      this.chest,
      0,
      1.19,
      0.35,
    );
    ornament.scale.z = 0.4;
    ball(this.chest, jewel, 0, 1.19, 0.405, 0.05, 0.065, 0.025);
  }

  update(time: number) {
    this.chest.scale.y = 1 + Math.sin(time * 1.4) * 0.008;
    this.ponytail.rotation.y = Math.sin(time * 0.9) * 0.06;
  }
}
