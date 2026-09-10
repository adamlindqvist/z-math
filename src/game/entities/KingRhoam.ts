import * as THREE from "three";
import { ball, box, material, mesh, silhouette } from "../models";

/** Decorative seated NPC. Coordinates match the throne's seat and armrests. */
export class KingRhoam {
  readonly root = new THREE.Group();

  constructor() {
    const root = this.root;
    root.name = "Kung Rhoam";
    const coat = material("#403b38"), blue = material("#087f99");
    const gold = material("#efbf39", 0.4), cream = material("#eee5c4");
    const hair = material("#fff5df"), skin = material("#eab47c");
    const boots = material("#59422f"), dark = material("#343936");

    // Broad coat, pale tunic and a blue mantle edged in gold.
    ball(root, coat, 0, 1.12, 0.14, 0.44, 0.4, 0.26);
    ball(root, cream, 0, 1.07, 0.34, 0.29, 0.29, 0.09);
    ball(root, gold, 0, 1.35, 0.1, 0.53, 0.15, 0.3);
    ball(root, blue, 0, 1.39, 0.1, 0.51, 0.14, 0.3);
    for (const side of [-1, 1]) {
      // Horizontal thighs and bent shins make the sitting pose explicit.
      ball(root, cream, side * 0.21, 0.83, 0.34, 0.18, 0.14, 0.29);
      ball(root, cream, side * 0.23, 0.64, 0.55, 0.14, 0.23, 0.13);
      ball(root, boots, side * 0.23, 0.43, 0.63, 0.16, 0.13, 0.23);
      box(root, gold, side * 0.23, 0.54, 0.68, 0.24, 0.065, 0.06);
      const lapel = box(root, gold, side * 0.32, 0.99, 0.36, 0.055, 0.55, 0.06);
      lapel.rotation.z = side * -0.16;
      ball(root, coat, side * 0.44, 1.18, 0.18, 0.14, 0.22, 0.15);
      ball(root, coat, side * 0.49, 1.1, 0.32, 0.12, 0.1, 0.21);
      box(root, gold, side * 0.49, 1.11, 0.45, 0.23, 0.16, 0.1);
      ball(root, skin, side * 0.5, 1.12, 0.54, 0.1, 0.07, 0.12);
    }
    box(root, boots, 0, 0.9, 0.4, 0.56, 0.1, 0.065);
    ball(root, gold, 0, 0.9, 0.45, 0.12, 0.12, 0.035);
    ball(root, blue, 0, 0.9, 0.48, 0.065, 0.07, 0.02);

    // Long white hair, pointed ears and a friendly, bearded face.
    ball(root, hair, 0, 1.63, 0.04, 0.35, 0.37, 0.24);
    ball(root, skin, 0, 1.65, 0.19, 0.28, 0.3, 0.23);
    for (const side of [-1, 1]) {
      const ear = silhouette(root, skin, [
        [side * 0.24, 1.72], [side * 0.43, 1.78], [side * 0.29, 1.56],
      ], 0.07);
      ear.position.z = 0.13;
      ball(root, hair, side * 0.28, 1.55, 0.11, 0.12, 0.3, 0.17);
      ball(root, dark, side * 0.105, 1.69, 0.4, 0.047, 0.057, 0.02);
      ball(root, blue, side * 0.105, 1.69, 0.418, 0.027, 0.033, 0.009);
      ball(root, hair, side * 0.105 - 0.008, 1.71, 0.426, 0.012);
      const brow = ball(root, hair, side * 0.115, 1.77, 0.395, 0.105, 0.033, 0.035);
      brow.rotation.z = side * -0.1;
      ball(root, hair, side * 0.16, 1.4, 0.34, 0.18, 0.22, 0.13);
    }
    ball(root, hair, 0, 1.31, 0.35, 0.23, 0.23, 0.16);
    ball(root, dark, 0, 1.49, 0.43, 0.085, 0.028, 0.02);
    for (const side of [-1, 1]) {
      const moustache = ball(root, hair, side * 0.075, 1.53, 0.44, 0.12, 0.055, 0.045);
      moustache.rotation.z = side * -0.18;
    }
    ball(root, skin, 0, 1.61, 0.43, 0.06, 0.08, 0.055);

    // Tall flared crown with a red centre jewel, echoing the reference.
    mesh(new THREE.CylinderGeometry(0.3, 0.28, 0.1, 12), gold, root, 0, 1.93, 0.12);
    for (const side of [-1, 1]) {
      const point = silhouette(root, gold, [
        [side * 0.21, 1.95], [side * 0.3, 2.01], [side * 0.4, 2.21],
        [side * 0.34, 2.27], [side * 0.23, 2.11], [side * 0.25, 2.03],
      ], 0.06);
      point.position.z = 0.12;
    }
    const crest = silhouette(root, gold, [[-0.13, 1.97], [0, 2.19], [0.13, 1.97]], 0.045);
    crest.position.z = 0.4;
    ball(root, material("#b53f59", 0.35), 0, 2.055, 0.45, 0.045, 0.065, 0.018);
  }
}
