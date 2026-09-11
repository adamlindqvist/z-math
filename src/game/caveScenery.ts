import * as THREE from "three";
import { box, material, mesh } from "./models";
import type { CollisionSystem } from "./CollisionSystem";

/** An irregular arch with a real opening, shared by both sides of the cave. */
export function caveMouth(
  root: THREE.Group,
  collision: CollisionSystem,
  position: { x: number; z: number },
  daylight = false,
) {
  const group = new THREE.Group();
  group.name = daylight ? "daylight-cave-exit" : "volcano-cave-mouth";
  group.position.set(position.x, 0, position.z);
  root.add(group);
  const stone = material("#544b50");
  const contour = new THREE.Shape();
  const points = [
    [-1.65, 0], [-1.8, 1.1], [-1.48, 2.3], [-0.8, 2.85],
    [0.25, 2.98], [1.3, 2.55], [1.72, 1.4], [1.6, 0],
    [0.76, 0], [0.76, 1.65], [0.48, 2.15], [-0.35, 2.25],
    [-0.76, 1.75], [-0.76, 0],
  ];
  points.forEach(([x, y], i) => i ? contour.lineTo(x, y) : contour.moveTo(x, y));
  contour.closePath();
  const arch = mesh(new THREE.ExtrudeGeometry(contour, {
    depth: 1.1, bevelEnabled: false,
  }), stone, group, 0, 0, -0.8);
  arch.name = "rough-cave-arch";
  for (const x of [-1.18, 1.18]) collision.add(position.x + x, position.z - 0.25, 0.42, 0.55);
  const light = new THREE.MeshBasicMaterial({ color: daylight ? "#ffe2a5" : "#39221d" });
  const opening = mesh(new THREE.PlaneGeometry(1.5, 2.2), light, group, 0, 1.1, -0.7);
  opening.material.side = THREE.DoubleSide;
  opening.castShadow = false;
  opening.name = "cave-depth";
  const threshold = box(group, material(daylight ? "#cead79" : "#a37a55"), 0, 0.025, 0, 1.48, 0.05, 1.4);
  threshold.name = "cave-threshold";
  const seam = new THREE.MeshStandardMaterial({
    color: daylight ? "#d2b689" : "#bc774a",
    emissive: daylight ? "#a9854b" : "#df6e26",
    emissiveIntensity: 0.35, roughness: 1,
  });
  for (const side of [-1, 1]) {
    const face = box(group, seam, side * 1.03, 1.12, 0.32, 0.13, 1.1, 0.035);
    face.rotation.z = side * 0.14;
  }
  const blocker = mesh(new THREE.DodecahedronGeometry(1, 0), material("#70616a"), group, 0, 1.05, -0.05);
  blocker.scale.set(0.91, 1.3, 0.55);
  blocker.name = "cave-sealing-stone";
  blocker.visible = !daylight;
  return {
    root: group,
    update(open: boolean, time: number) {
      seam.emissiveIntensity = open ? 0.35 + Math.sin(time * 1.4) * 0.07 : 0;
      blocker.visible = !open;
      opening.visible = open;
    },
  };
}

/** Faceted columns stay inside their collision rectangles, leaving routes clear. */
export function rockWall(
  root: THREE.Group, collision: CollisionSystem, stone: THREE.Material,
  x: number, z: number, width: number, depth: number, height: number, seed: number,
) {
  const geometry = new THREE.CylinderGeometry(0.78, 1, 1, 5, 1);
  geometry.rotateY(0.25 + seed * 0.47);
  geometry.computeBoundingBox();
  const size = geometry.boundingBox!.getSize(new THREE.Vector3());
  geometry.scale(width / size.x, height, depth / size.z);
  geometry.computeBoundingBox();
  const center = geometry.boundingBox!.getCenter(new THREE.Vector3());
  geometry.translate(-center.x, 0, -center.z);
  const rock = mesh(geometry, stone, root, x, height / 2 - 0.05, z);
  rock.name = "basalt-wall";
  collision.add(x, z, width / 2, depth / 2);
  return rock;
}
