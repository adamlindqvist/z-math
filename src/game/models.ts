import * as THREE from "three";
export const material = (color: THREE.ColorRepresentation, roughness = 0.8) =>
  new THREE.MeshStandardMaterial({ color, roughness });
export function mesh(
  geometry: THREE.BufferGeometry,
  mat: THREE.Material,
  parent: THREE.Object3D,
  x = 0,
  y = 0,
  z = 0,
) {
  const m = new THREE.Mesh(geometry, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
export function ball(
  parent: THREE.Object3D,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  sx: number,
  sy = sx,
  sz = sx,
) {
  const m = mesh(new THREE.SphereGeometry(1, 12, 8), mat, parent, x, y, z);
  m.scale.set(sx, sy, sz);
  return m;
}
export function box(
  parent: THREE.Object3D,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
) {
  return mesh(new THREE.BoxGeometry(w, h, d), mat, parent, x, y, z);
}
export function character(coatColor: string, npc = false) {
  const root = new THREE.Group();
  const coat = material(coatColor),
    skin = material("#f4c392"),
    hair = material(npc ? "#e8ded0" : "#543d31"),
    dark = material("#293c37"),
    boots = material("#5b4536");
  const body = mesh(
    new THREE.CylinderGeometry(0.26, 0.38, 0.57, 10),
    coat,
    root,
    0,
    0.65,
  );
  ball(root, skin, 0, 1.18, 0, 0.37, 0.39, 0.34);
  ball(root, hair, 0, 1.4, -0.04, 0.38, 0.22, 0.34);
  ball(root, hair, -0.29, 1.24, 0, 0.09, 0.19, 0.18);
  ball(root, hair, 0.29, 1.24, 0, 0.09, 0.19, 0.18);
  for (const x of [-0.13, 0.13]) {
    ball(root, dark, x, 1.19, 0.315, 0.035, 0.05, 0.023);
    ball(root, material("#e99b83"), x * 1.55, 1.09, 0.29, 0.055, 0.025, 0.018);
  }
  ball(root, skin, 0, 1.11, 0.34, 0.055);
  const left = ball(root, boots, -0.17, 0.18, 0.05, 0.14, 0.18, 0.21);
  const right = ball(root, boots, 0.17, 0.18, 0.05, 0.14, 0.18, 0.21);
  ball(root, skin, -0.37, 0.62, 0, 0.11, 0.17, 0.11);
  ball(root, skin, 0.37, 0.62, 0, 0.11, 0.17, 0.11);
  if (!npc) {
    const hat = material("#c57643");
    mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.07, 16), hat, root, 0, 1.47);
    ball(root, hat, 0, 1.53, -0.02, 0.3, 0.2, 0.29);
    box(root, material("#a04f35"), 0, 0.74, -0.3, 0.39, 0.42, 0.22);
    box(root, material("#f9dd9a"), 0, 0.85, 0.28, 0.28, 0.12, 0.08);
  } else {
    ball(root, hair, 0, 1.59, -0.14, 0.16);
    box(root, material("#f9e3b4"), 0, 0.59, 0.31, 0.38, 0.37, 0.04);
  }
  return { root, body, left, right };
}
