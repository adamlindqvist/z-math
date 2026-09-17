import * as THREE from "three";
import { ball, box, material, mesh, silhouette } from "../models";

/** Cream-feathered Rito with a dark beak, green travel clothes and an ornate bow. */
export class Tulin {
  root = new THREE.Group();
  private flight = new THREE.Group();
  private wings: THREE.Group[] = [];
  private feet: THREE.Group[] = [];
  private heart: THREE.Mesh;
  constructor() {
    this.root.name = "tulin";
    this.root.add(this.flight);
    const white = material("#eeedd8"), grey = material("#a4a88e"), dark = material("#405959");
    const blue = material("#36b3df"), gold = material("#dbb947"), brown = material("#896741");
    const green = material("#458c65"), black = material("#253e40");
    const lime = material("#b4cd58"), orange = material("#e39036"), leather = material("#684b35");
    ball(this.flight, white, 0, 0.75, 0, 0.29, 0.41, 0.25);
    ball(this.flight, green, 0, 0.7, -0.015, 0.31, 0.33, 0.26);
    ball(this.flight, white, 0, 0.88, 0.18, 0.2, 0.3, 0.12);
    ball(this.flight, brown, 0, 0.5, 0.16, 0.28, 0.26, 0.19);
    const bib = silhouette(this.flight, leather, [[-0.21, 0.65], [0.21, 0.65], [0.19, 0.38], [0, 0.26], [-0.19, 0.38]], 0.035);
    bib.position.z = 0.3;
    box(this.flight, brown, 0, 0.55, 0.35, 0.24, 0.13, 0.06);
    for (const side of [-1, 1]) {
      const lapel = box(this.flight, lime, side * 0.15, 0.88, 0.28, 0.065, 0.47, 0.04);
      lapel.rotation.z = -side * 0.27;
      const strap = box(this.flight, leather, side * 0.235, 0.88, 0.2, 0.067, 0.49, 0.05);
      strap.rotation.z = -side * 0.18;
      box(this.flight, orange, side * 0.2, 0.68, 0.32, 0.1, 0.08, 0.035).rotation.z = side * 0.45;
    }
    const knot = mesh(new THREE.TorusGeometry(0.073, 0.023, 5, 12), lime, this.flight, 0, 0.68, 0.36);
    knot.rotation.z = 0.2;
    const scarfEnd = silhouette(this.flight, green, [[-0.03, 0.69], [-0.19, 0.6], [-0.16, 0.48], [0.04, 0.63]], 0.03);
    scarfEnd.position.z = 0.37;
    const orangeTip = silhouette(this.flight, orange, [[-0.18, 0.57], [-0.16, 0.48], [-0.09, 0.56]], 0.02);
    orangeTip.position.z = 0.405;
    for (let i = 0; i < 3; i++) {
      box(this.flight, white, 0, 0.45 - i * 0.045, 0.343, 0.07, 0.012, 0.012).rotation.z = i % 2 ? -0.5 : 0.5;
    }
    for (const side of [-1, 1]) {
      const wing = new THREE.Group();
      wing.name = side < 0 ? "tulin-left-wing" : "tulin-right-wing";
      wing.position.set(side * 0.26, 0.94, 0);
      this.flight.add(wing);
      this.wings.push(wing);
      ball(wing, white, side * 0.23, 0.02, 0, 0.34, 0.115, 0.22);
      // Broad overlapping feather silhouettes have pointed dark tips, like the reference.
      for (let i = 0; i < 6; i++) {
        const length = 0.57 + i * 0.055;
        const feather = silhouette(wing, i < 2 ? white : grey, [
          [side * 0.2, -0.08], [side * 0.46, -0.17],
          [side * (length + 0.22), -0.08], [side * (length + 0.32), 0.08],
          [side * (length + 0.2), 0.02], [side * 0.45, 0.09],
        ], 0.055);
        feather.position.z = 0.14 - i * 0.085;
        feather.rotation.y = side * (i - 2) * 0.1;
        const tip = silhouette(wing, dark, [
          [side * (length + 0.14), -0.075], [side * (length + 0.22), -0.08],
          [side * (length + 0.32), 0.08], [side * (length + 0.2), 0.02],
        ], 0.058);
        tip.position.z = feather.position.z;
        tip.rotation.y = feather.rotation.y;
      }
      ball(wing, white, side * 0.36, 0.025, 0.06, 0.3, 0.12, 0.19);
      const foot = new THREE.Group();
      foot.position.set(side * 0.14, 0.43, 0);
      this.flight.add(foot);
      this.feet.push(foot);
      ball(foot, white, 0, -0.035, 0, 0.16, 0.17, 0.15);
      mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.055, 8), green, foot, 0, -0.035);
      mesh(new THREE.CylinderGeometry(0.163, 0.163, 0.022, 8), orange, foot, 0, -0.085);
      mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.21, 6), gold, foot, 0, -0.2);
      mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.075, 6), green, foot, 0, -0.17);
      box(foot, white, 0, -0.18, 0.067, 0.07, 0.055, 0.025);
      for (let toe = 0; toe < 3; toe++) {
        ball(foot, gold, (toe - 1) * 0.05, -0.3, 0.065, 0.029, 0.035, 0.095);
        const claw = mesh(new THREE.ConeGeometry(0.029, 0.09, 5), dark, foot, (toe - 1) * 0.05, -0.32, 0.15);
        claw.rotation.x = Math.PI / 2;
      }
      const tail = ball(this.flight, grey, side * 0.13, 0.47, -0.35, 0.1, 0.06, 0.3);
      tail.rotation.y = side * 0.23;
    }
    // A light neck ruff and face keep the bird readable at the game's camera distance.
    for (let i = 0; i < 5; i++) ball(this.flight, white, (i - 2) * 0.09, 1.06 - Math.abs(i - 2) * 0.025, 0.12, 0.11, 0.16, 0.14);
    ball(this.flight, grey, 0, 1.34, -0.05, 0.34, 0.32, 0.29);
    ball(this.flight, white, 0, 1.33, 0.09, 0.3, 0.3, 0.25);
    for (const side of [-1, 1]) {
      ball(this.flight, dark, side * 0.17, 1.35, 0.27, 0.115, 0.108, 0.046);
      ball(this.flight, white, side * 0.17, 1.35, 0.299, 0.099, 0.094, 0.023);
      ball(this.flight, blue, side * 0.17, 1.35, 0.32, 0.072, 0.086, 0.02);
      ball(this.flight, black, side * 0.17, 1.35, 0.34, 0.032, 0.06, 0.012);
      ball(this.flight, white, side * 0.17 - 0.025, 1.39, 0.352, 0.023, 0.029, 0.006);
      ball(this.flight, white, side * 0.17 + 0.026, 1.322, 0.35, 0.01, 0.013, 0.005);
      ball(this.flight, orange, side * 0.255, 1.255, 0.285, 0.055, 0.027, 0.017);
      const brow = ball(this.flight, dark, side * 0.18, 1.51, 0.257, 0.077, 0.023, 0.018);
      brow.rotation.z = side * 0.18;
      for (let i = 0; i < 3; i++) {
        const cheek = silhouette(this.flight, i === 0 ? white : grey, [
          [side * 0.22, 1.43 - i * 0.1], [side * 0.4, 1.39 - i * 0.11],
          [side * 0.48, 1.48 - i * 0.12], [side * 0.43, 1.3 - i * 0.1],
          [side * 0.29, 1.24 - i * 0.055],
        ], 0.07);
        cheek.position.z = -0.025 - i * 0.035;
      }
    }
    // Green eye marking and an open, friendly dark beak.
    const marking = silhouette(this.flight, lime, [[0.25, 1.44], [0.3, 1.43], [0.295, 1.32], [0.27, 1.31], [0.28, 1.4]], 0.02);
    marking.position.z = 0.29;
    const upperBeak = mesh(new THREE.ConeGeometry(0.14, 0.3, 4), dark, this.flight, 0, 1.23, 0.4);
    upperBeak.rotation.x = Math.PI / 2;
    upperBeak.scale.x = 0.85;
    ball(this.flight, black, 0, 1.13, 0.303, 0.16, 0.105, 0.04);
    const lowerBeak = silhouette(this.flight, dark, [[-0.18, 1.19], [-0.1, 1.035], [0, 0.995], [0.1, 1.035], [0.18, 1.19], [0.08, 1.085], [0, 1.055], [-0.08, 1.085]], 0.045);
    lowerBeak.position.z = 0.32;
    ball(this.flight, material("#d98b96"), 0, 1.075, 0.351, 0.065, 0.034, 0.012);
    const crests: [number, number][][] = [
      [[-0.18, 1.52], [-0.3, 1.7], [-0.29, 1.85], [-0.17, 1.91], [-0.23, 1.8], [-0.17, 1.71], [-0.07, 1.57]],
      [[-0.09, 1.55], [-0.14, 1.83], [-0.04, 2.03], [0.1, 2.09], [0.01, 1.99], [-0.005, 1.8], [0.07, 1.62]],
      [[0.01, 1.57], [0.15, 1.82], [0.35, 1.92], [0.27, 1.81], [0.15, 1.66], [0.14, 1.54]],
    ];
    crests.forEach((points, i) => {
      const crest = silhouette(this.flight, white, points, 0.075);
      crest.position.z = 0.035 - i * 0.045;
    });

    // Large diagonal purple bow with forked gold tips and a blue grip ribbon.
    const bowRig = new THREE.Group();
    bowRig.position.set(0, 0.94, -0.39);
    bowRig.rotation.z = 0.65;
    this.flight.add(bowRig);
    const bowMaterial = material("#615367");
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, -0.97, 0), new THREE.Vector3(-0.58, 0, 0), new THREE.Vector3(0, 0.97, 0));
    mesh(new THREE.TubeGeometry(curve, 16, 0.055, 5, false), bowMaterial, bowRig);
    box(bowRig, grey, 0, 0, 0, 0.012, 1.94, 0.012);
    box(bowRig, blue, -0.285, 0, 0, 0.13, 0.16, 0.13);
    for (const side of [-1, 1]) {
      const tip = silhouette(bowRig, gold, [[-0.11, side * 0.78], [-0.13, side * 0.99], [-0.07, side * 1.17], [0, side * 1.07], [0.07, side * 1.15], [0.06, side * 0.97], [0.02, side * 0.88]], 0.08);
      tip.position.z = -0.04;
    }
    const ribbon = silhouette(bowRig, blue, [[-0.3, 0.06], [-0.48, 0.21], [-0.66, 0.17], [-0.57, 0.1], [-0.41, 0.1], [-0.29, -0.04]], 0.025);
    ribbon.position.z = 0.08;
    const quiver = box(this.flight, leather, 0.2, 0.8, -0.3, 0.2, 0.5, 0.18);
    quiver.rotation.z = -0.3;
    for (let i = 0; i < 3; i++) {
      box(this.flight, grey, 0.18 + i * 0.045, 1.06 + i * 0.035, -0.33, 0.018, 0.47, 0.018);
      ball(this.flight, material("#d46552"), 0.18 + i * 0.045, 1.31 + i * 0.035, -0.33, 0.03, 0.05, 0.025);
    }
    this.heart = silhouette(this.root, material("#ff8b9b"), [[0, -0.18], [-0.24, 0.04], [-0.24, 0.2], [-0.12, 0.28], [0, 0.17], [0.12, 0.28], [0.24, 0.2], [0.24, 0.04]]);
    this.root.scale.setScalar(0.76);
    this.animate(0, 0, false);
  }
  animate(time: number, speed: number, greeting: boolean, gust = false) {
    this.flight.position.y = 0.75 + Math.sin(time * 2.5) * 0.055;
    this.flight.rotation.x = Math.min(speed / 4, 1) * 0.12;
    this.wings.forEach((wing, i) => {
      wing.rotation.z = (i === 0 ? -1 : 1) * (0.12 + Math.sin(time * (gust ? 15 : 7)) * (gust ? 0.7 : 0.45));
    });
    this.feet.forEach((foot, i) => { foot.rotation.x = 0.2 + Math.sin(time * 2.5 + i) * 0.07; });
    this.heart.visible = greeting;
    this.heart.position.set(0, 2.95 + Math.sin(time * 3) * 0.08, 0);
  }
}
