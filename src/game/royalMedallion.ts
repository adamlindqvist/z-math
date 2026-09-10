import * as THREE from "three";
import { ball, material, mesh, silhouette } from "./models";
export function royalMedallion(parent: THREE.Object3D, x = 0, y = 0, z = 0, size = 1) {
  const root = new THREE.Group(); root.position.set(x, y, z); root.scale.setScalar(size); parent.add(root);
  const gold = material("#f8d16a", 0.45);
  const rim = mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.055, 16), gold, root);
  rim.rotation.x = Math.PI / 2;
  const insetMaterial = material("#6a394e");
  const inset = ball(root, insetMaterial, 0, 0, 0.035, 0.195, 0.195, 0.02);
  inset.castShadow = false;
  const crown = silhouette(root, gold, [[-0.14,-0.07],[0.14,-0.07],[0.16,0.1],[0.065,0.025],[0,0.15],[-0.065,0.025],[-0.16,0.1]], 0.035);
  crown.position.z = 0.065;
  return { root, gold, inset: insetMaterial, depth: z };
}
