import * as THREE from "three";
import { box, mesh, material, silhouette } from "./models";
import { gladePosition } from "./gladeLayout";
import type { CollisionSystem } from "./CollisionSystem";

export const VOLCANO_ENTRANCE = gladePosition(6, 24);
export const VOLCANO_RETURN = gladePosition(-7, 5);
// Exit toward the destination world so continuing forward leads away from the portal.
export const portalSpawn = (p: { x: number; z: number }, side: -1 | 1) => ({
  x: p.x,
  z: p.z + side * 1.4,
});

export function buildVolcanoPortal(
  root: THREE.Group,
  collision: CollisionSystem,
  position: { x: number; z: number },
  returning = false,
) {
  const group = new THREE.Group();
  group.name = returning ? "glade-return-portal" : "volcano-portal";
  group.position.set(position.x, 0, position.z);
  root.add(group);
  const stone = material("#655b68");
  for (const side of [-1, 1]) {
    box(group, stone, side * 0.95, 1.15, 0, 0.55, 2.3, 0.65);
    collision.add(position.x + side * 0.95, position.z, 0.275, 0.325);
    for (let i = 0; i < 3; i++)
      box(
        group,
        material("#a49288"),
        side * 0.95,
        0.35 + i * 0.7,
        0.34,
        0.4,
        0.08,
        0.04,
      );
  }
  box(group, stone, 0, 2.4, 0, 2.5, 0.45, 0.75);
  const glow = new THREE.MeshBasicMaterial({
    color: returning ? "#a1e4a0" : "#ff9b45",
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const opening = mesh(
    new THREE.PlaneGeometry(1.35, 2.15),
    glow,
    group,
    0,
    1.1,
  );
  opening.castShadow = false;
  const symbol = silhouette(
    group,
    material(returning ? "#b9ed8e" : "#ffbf65"),
    returning
      ? [
          [0, 0.35],
          [-0.3, -0.15],
          [-0.1, -0.15],
          [-0.1, -0.3],
          [0.1, -0.3],
          [0.1, -0.15],
          [0.3, -0.15],
        ]
      : [
          [-0.3, -0.25],
          [-0.24, 0.04],
          [-0.05, -0.02],
          [0.04, 0.35],
          [0.3, -0.06],
          [0.22, -0.25],
        ],
  );
  symbol.position.set(0, 2.45, 0.4);
  return {
    update(active: boolean, time: number) {
      opening.visible = active;
      glow.opacity = 0.43 + Math.sin(time * 1.5) * 0.08;
    },
  };
}
