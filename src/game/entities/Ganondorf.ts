import * as THREE from "three";
import { ball, box, material, mesh, silhouette } from "../models";

/** Procedural final boss, sharing one rig between his two forms. */
export class Ganondorf {
  root = new THREE.Group();
  private chest = new THREE.Group();
  private ponytail: THREE.Mesh;
  private demonParts = new THREE.Group();
  private swordArm = new THREE.Group();
  private weapon = new THREE.Group();
  private armInverse = new THREE.Quaternion();
  private bladeDirection = new THREE.Vector3();
  private skin: THREE.MeshStandardMaterial;
  private hair: THREE.MeshStandardMaterial;
  private markings = new THREE.MeshStandardMaterial({ color: "#ff493e", emissive: "#ff2015", emissiveIntensity: 1.4 });

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

    this.skin = skin; this.hair = hair;
    this.chest.add(this.demonParts);
    // Flowing crimson mane and broad ember seams echo the reference without horror detail.
    for (let i = 0; i < 9; i++) {
      const a = i / 8 * Math.PI;
      const lock = mesh(new THREE.ConeGeometry(0.13, 1.7, 5), hair, this.demonParts,
        Math.cos(a) * 0.42, 0.55, -0.4 - Math.sin(a) * 0.17);
      lock.rotation.z = Math.cos(a) * 0.55 + Math.PI;
      lock.rotation.x = -0.3;
    }
    for (const side of [-1, 1]) {
      for (let j = 0; j < 5; j++) {
        const seam = box(this.demonParts, this.markings, side * (0.13 + j * 0.065), 0.48 - j * 0.12, 0.325, 0.2, 0.035, 0.025);
        seam.rotation.z = side * (0.3 + j * 0.13);
      }
    }
    // A shoulder pivot owns the complete sword-side limb. The weapon is held
    // at the hand instead of floating independently beside the chest.
    this.swordArm.name = "ganondorf-sword-arm";
    this.swordArm.position.set(-0.52, 0.42, 0);
    this.chest.add(this.swordArm);
    this.weapon.position.set(-0.16, -0.56, 0.06);
    this.weapon.name = "ganondorf-sword";
    this.swordArm.add(this.weapon);
    box(this.weapon, dark, 0, -0.1, 0, 0.09, 0.42, 0.1);
    box(this.weapon, gold, 0, 0.15, 0, 0.48, 0.09, 0.13);
    const blade = silhouette(this.weapon, material("#bfced2", 0.3), [[-0.08, 0.19], [-0.09, 1.75], [0.02, 2.12], [0.14, 1.72], [0.1, 0.19]], 0.07);
    blade.name = "ganondorf-blade";
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
      if (side < 0) {
        const arm = ball(this.swordArm, skin, -0.1, -0.26, 0, 0.21, 0.43, 0.24);
        arm.rotation.z = -0.13;
        mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.1, 10), gold, this.swordArm, -0.15, -0.52);
        const hand = ball(this.swordArm, skin, -0.16, -0.66, 0.06, 0.16, 0.18, 0.16);
        hand.name = "ganondorf-sword-hand";
      } else {
        const arm = ball(this.chest, robe, 0.62, 0.16, 0, 0.21, 0.43, 0.24);
        arm.rotation.z = 0.13;
        mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.1, 10), gold, this.chest, 0.67, -0.1);
        ball(this.chest, skin, 0.68, -0.24, 0.06, 0.16, 0.18, 0.16);
      }
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

  battlePose(demon: boolean, time: number, charge = 0, fallen = false) {
    this.demonParts.visible = demon;
    this.skin.color.set(demon ? "#343a40" : "#818665");
    this.hair.color.set(demon ? "#ff3926" : "#b94d37");
    this.hair.emissive.set(demon ? "#b81713" : "#000000");
    this.hair.emissiveIntensity = demon ? 0.45 : 0;
    this.markings.emissiveIntensity = 1.2 + Math.sin(time * 3) * 0.3;
    this.chest.rotation.x = fallen ? 0.65 : -charge * 0.13;
    // The whole model faces the player. Raise the complete sword-side limb
    // above the shoulder during the warning, then chop it down toward the
    // target. The wrist keeps the blade aimed mostly forward throughout.
    const raise = THREE.MathUtils.smoothstep(charge, 0.02, 0.42);
    // Finish the downstroke at charge 1. The encounter's damage window opens
    // at that exact point, so pose and collision cannot drift apart.
    const strike = THREE.MathUtils.smoothstep(charge, 0.55, 1);
    const armPitch = -0.32 - raise * 0.22 + strike * 1.05;
    const raisedRoll = THREE.MathUtils.lerp(-0.08, -2.55, raise);
    const armRoll = THREE.MathUtils.lerp(raisedRoll, -0.12, strike);
    this.swordArm.rotation.x = armPitch;
    this.swordArm.rotation.z = armRoll;
    this.bladeDirection.set(0, 0.42 - strike * 0.82, 1).normalize();
    this.armInverse.copy(this.swordArm.quaternion).invert();
    this.bladeDirection.applyQuaternion(this.armInverse);
    this.weapon.quaternion.setFromUnitVectors(THREE.Object3D.DEFAULT_UP, this.bladeDirection);
  }
  update(time: number) {
    this.chest.scale.y = 1 + Math.sin(time * 1.4) * 0.008;
    this.ponytail.rotation.y = Math.sin(time * 0.9) * 0.06;
  }
}
