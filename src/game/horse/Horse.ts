import * as THREE from "three";
import { ball, box, material, mesh } from "../models";
import { gladePosition } from "../gladeLayout";
import type { CollisionSystem } from "../CollisionSystem";

export const HORSE_HOME = gladePosition(2.7, 16.1);

export class Horse {
  readonly root = new THREE.Group();
  private body = new THREE.Group();
  private head = new THREE.Group();
  private tail = new THREE.Group();
  private legs: THREE.Group[] = [];
  private phase = 0;
  constructor() {
    this.root.name = "golden-horse";
    this.root.add(this.body);
    const gold = material("#efbd45"),
      light = material("#ffe298"),
      cream = material("#fff6df"),
      white = material("#fffdf5"),
      hoof = material("#786b59"),
      pink = material("#b95980"),
      blue = material("#339db3"),
      dark = material("#333d3d"),
      leather = material("#97613f");
    ball(this.body, gold, 0, 1.05, 0, 0.43, 0.48, 0.76);
    ball(this.body, light, 0, 1.12, 0.5, 0.34, 0.44, 0.33);
    const neck = ball(this.body, gold, 0, 1.55, 0.53, 0.28, 0.62, 0.3);
    neck.rotation.x = 0.3;
    this.head.position.set(0, 1.97, 0.66);
    this.body.add(this.head);
    ball(this.head, gold, 0, 0, 0.08, 0.27, 0.34, 0.34);
    ball(this.head, light, 0, -0.19, 0.34, 0.24, 0.21, 0.28);
    for (const side of [-1, 1]) {
      const ear = mesh(
        new THREE.ConeGeometry(0.105, 0.4, 7),
        gold,
        this.head,
        side * 0.17,
        0.38,
        -0.04,
      );
      ear.rotation.z = -side * 0.18;
      ball(this.head, cream, side * 0.17, 0.37, 0.015, 0.045, 0.13, 0.035);
      ball(this.head, white, side * 0.235, 0.065, 0.19, 0.04, 0.095, 0.08);
      ball(this.head, blue, side * 0.266, 0.065, 0.205, 0.018, 0.066, 0.055);
      ball(this.head, dark, side * 0.281, 0.065, 0.215, 0.012, 0.044, 0.033);
      ball(this.head, white, side * 0.289, 0.09, 0.232, 0.008, 0.018, 0.015);
      ball(this.head, hoof, side * 0.145, -0.19, 0.565, 0.045, 0.035, 0.018);
    }
    ball(this.head, cream, 0, 0.09, 0.355, 0.065, 0.19, 0.025);
    ball(this.head, white, -0.035, 0.26, 0.19, 0.16, 0.16, 0.25);
    // Long overlapping locks and rose ribbons read clearly from the game camera.
    for (let i = 0; i < 6; i++) {
      const lock = ball(
        this.body,
        white,
        0.2,
        1.94 - i * 0.12,
        0.4 - i * 0.12,
        0.12,
        0.32,
        0.12,
      );
      lock.rotation.z = -0.3;
      ball(
        this.body,
        pink,
        0.26,
        1.79 - i * 0.12,
        0.4 - i * 0.12,
        0.125,
        0.04,
        0.125,
      );
    }
    this.tail.position.set(0, 1.25, -0.66);
    this.body.add(this.tail);
    for (const side of [-1, 0, 1]) {
      const strand = ball(
        this.tail,
        white,
        side * 0.075,
        -0.36,
        -0.22,
        0.1,
        0.48,
        0.13,
      );
      strand.rotation.x = 0.35;
    }
    ball(this.tail, pink, 0, -0.04, -0.08, 0.15, 0.065, 0.12);
    box(this.body, pink, 0, 1.44, -0.12, 0.86, 0.09, 0.66);
    ball(this.body, leather, 0, 1.5, -0.12, 0.34, 0.085, 0.33);
    for (const z of [-0.27, 0.14])
      box(this.body, leather, 0, 1.55, z, 0.52, 0.13, 0.1);
    for (const z of [0.49, -0.49])
      for (const x of [-0.28, 0.28]) {
        const leg = new THREE.Group();
        leg.position.set(x, 1.02, z);
        this.body.add(leg);
        ball(leg, gold, 0, -0.3, 0, 0.115, 0.38, 0.13);
        ball(leg, cream, 0, -0.73, 0.02, 0.15, 0.2, 0.16);
        ball(leg, hoof, 0, -0.9, 0.055, 0.15, 0.095, 0.19);
        this.legs.push(leg);
      }
    this.reset();
  }
  reset() {
    this.root.position.set(HORSE_HOME.x, 0, HORSE_HOME.z);
    this.root.rotation.y = -Math.PI / 2;
    this.phase = 0;
    this.animate(0, false);
  }
  animate(dt: number, moving: boolean) {
    this.phase += dt * (moving ? 10 : 1.7);
    this.legs.forEach((leg, i) => {
      leg.rotation.x = moving
        ? Math.sin(this.phase + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.42
        : 0;
    });
    this.body.position.y = moving
      ? Math.abs(Math.sin(this.phase)) * 0.035
      : Math.sin(this.phase) * 0.012;
    this.head.rotation.x = Math.sin(this.phase) * (moving ? 0.025 : 0.035);
    this.tail.rotation.z = Math.sin(this.phase * 0.6) * 0.12;
  }
}

export function buildHorsePaddock(
  root: THREE.Group,
  collision: CollisionSystem,
) {
  const paddock = new THREE.Group();
  paddock.name = "horse-paddock";
  paddock.position.set(HORSE_HOME.x, 0, HORSE_HOME.z);
  root.add(paddock);
  const wood = material("#ae7d4e"),
    rail = material("#edcf99");
  const fence = (x: number, z: number, w: number, d: number) => {
    for (const y of [0.34, 0.68]) box(paddock, rail, x, y, z, w, 0.1, d);
    collision.add(HORSE_HOME.x + x, HORSE_HOME.z + z, w / 2, d / 2);
  };
  fence(0, -1.5, 4, 0.12);
  fence(0, 1.5, 4, 0.12);
  fence(2, 0, 0.12, 3);
  fence(-2, -1.25, 0.12, 0.5);
  fence(-2, 1.25, 0.12, 0.5);
  for (const [x, z] of [
    [-2, -1.5],
    [0, -1.5],
    [2, -1.5],
    [-2, 1.5],
    [0, 1.5],
    [2, 1.5],
    [2, 0],
    [-2, -1],
    [-2, 1],
  ]) {
    box(paddock, wood, x, 0.44, z, 0.14, 0.88, 0.14);
    ball(paddock, rail, x, 0.89, z, 0.1, 0.055, 0.1);
  }
}
