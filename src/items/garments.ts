import * as THREE from "three";

type Vector = readonly [number, number, number];
type Shape =
  | { kind: "box"; size: Vector }
  | { kind: "ellipsoid"; size: Vector }
  | { kind: "taper"; top: number; bottom: number; height: number };
export interface GarmentPart {
  name: string;
  section:
    "base" | "sleeves" | "collar" | "belt" | "decoration" | "accessories";
  shape: Shape;
  material: string;
  position: Vector;
  rotation?: Vector;
}
export interface GarmentDefinition {
  materials: Record<
    string,
    { color: string; roughness?: number; metalness?: number }
  >;
  parts: readonly GarmentPart[];
}
// Coordinates are relative to the torso anchor at y=0.65; +z is forward.
const sleeves = (fabric: string): GarmentPart[] =>
  [-1, 1].flatMap((side) => [
    {
      name: `sleeve-${side}`,
      section: "sleeves",
      material: fabric,
      shape: { kind: "ellipsoid", size: [0.14, 0.16, 0.15] },
      position: [side * 0.31, 0.17, 0],
    },
    {
      name: `undersleeve-${side}`,
      section: "sleeves",
      material: "under",
      shape: { kind: "ellipsoid", size: [0.09, 0.17, 0.1] },
      position: [side * 0.37, 0.03, 0.02],
    },
  ]);
const base: GarmentPart = {
  name: "tunic",
  section: "base",
  material: "cloth",
  shape: { kind: "taper", top: 0.27, bottom: 0.36, height: 0.57 },
  position: [0, 0, 0],
};
const belt: GarmentPart[] = [
  {
    name: "belt",
    section: "belt",
    material: "leather",
    shape: { kind: "taper", top: 0.325, bottom: 0.34, height: 0.115 },
    position: [0, -0.13, 0],
  },
  {
    name: "buckle",
    section: "belt",
    material: "gold",
    shape: { kind: "box", size: [0.16, 0.13, 0.045] },
    position: [0, -0.13, 0.339],
  },
  {
    name: "buckle-inset",
    section: "belt",
    material: "leather",
    shape: { kind: "box", size: [0.09, 0.065, 0.018] },
    position: [0, -0.13, 0.368],
  },
];
export const starterGarment: GarmentDefinition = {
  materials: {
    cloth: { color: "#36964a" },
    under: { color: "#805033" },
    leather: { color: "#805033" },
    gold: { color: "#efbd45", roughness: 0.4 },
  },
  parts: [base, ...sleeves("cloth"), ...belt],
};
export const forestGarment: GarmentDefinition = {
  materials: {
    cloth: { color: "#487344" },
    under: { color: "#fff1d4" },
    leather: { color: "#71452c" },
    gold: { color: "#cda65a", roughness: 0.5, metalness: 0.25 },
  },
  parts: [
    base,
    ...sleeves("cloth"),
    {
      name: "undershirt",
      section: "base",
      material: "under",
      shape: { kind: "box", size: [0.19, 0.27, 0.055] },
      position: [0, 0.155, 0.25],
    },
    ...[-1, 1].map((side): GarmentPart => ({
      name: `collar-${side}`,
      section: "collar",
      material: "under",
      shape: { kind: "box", size: [0.115, 0.19, 0.065] },
      position: [side * 0.105, 0.205, 0.255],
      rotation: [0, 0, side * -0.4],
    })),
    ...belt,
  ],
};

/** Each instance owns its resources; dispose with the containing scene. */
export function garmentModel(definition: GarmentDefinition) {
  const root = new THREE.Group();
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  for (const part of definition.parts) {
    let material = materials.get(part.material);
    if (!material) {
      const spec = definition.materials[part.material];
      if (!spec) throw new Error(`Unknown garment material: ${part.material}`);
      material = new THREE.MeshStandardMaterial({ roughness: 0.8, ...spec });
      materials.set(part.material, material);
    }
    const shape = part.shape;
    const geometry =
      shape.kind === "box"
        ? new THREE.BoxGeometry(...shape.size)
        : shape.kind === "taper"
          ? new THREE.CylinderGeometry(
              shape.top,
              shape.bottom,
              shape.height,
              12,
            )
          : new THREE.SphereGeometry(1, 12, 8);
    const mesh = new THREE.Mesh(geometry, material);
    if (shape.kind === "ellipsoid") mesh.scale.set(...shape.size);
    mesh.name = part.name;
    mesh.userData.section = part.section;
    mesh.position.set(...part.position);
    if (part.rotation) mesh.rotation.set(...part.rotation);
    mesh.castShadow = mesh.receiveShadow = true;
    root.add(mesh);
  }
  return root;
}
