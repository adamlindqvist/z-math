import * as THREE from "three";

type Vector = readonly [number, number, number];
type Shape =
  | { kind: "box"; size: Vector }
  | { kind: "ellipsoid"; size: Vector }
  | { kind: "rock"; size: Vector; seed: number }
  | { kind: "collar"; side: number }
  | { kind: "cape" }
  | { kind: "leaf" }
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
const shirtAndCollar: GarmentPart[] = [
  {
    name: "undershirt",
    section: "base",
    material: "under",
    shape: { kind: "ellipsoid", size: [0.07, 0.065, 0.018] },
    position: [0, 0.225, 0.285],
  },
  ...[-1, 1].map((side): GarmentPart => ({
    name: `collar-${side}`,
    section: "collar",
    material: "under",
    shape: { kind: "collar", side },
    position: [0, 0, 0],
  })),
];
const belt: GarmentPart[] = [
  {
    name: "belt",
    section: "belt",
    material: "leather",
    shape: { kind: "taper", top: 0.37, bottom: 0.38, height: 0.115 },
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
    under: { color: "#fff1d4" },
    leather: { color: "#805033" },
    gold: { color: "#efbd45", roughness: 0.4 },
  },
  parts: [base, ...sleeves("cloth"), ...shirtAndCollar, ...belt],
};
export const forestGarment: GarmentDefinition = {
  materials: {
    cloth: { color: "#487344" },
    cape: { color: "#244d35" },
    flap: { color: "#97623d" },
    under: { color: "#fff1d4" },
    leather: { color: "#71452c" },
    gold: { color: "#cda65a", roughness: 0.5, metalness: 0.25 },
  },
  parts: [
    base,
    ...sleeves("cloth"),
    ...shirtAndCollar,
    ...belt,
    {
      name: "leaf-cape",
      section: "accessories",
      material: "cape",
      shape: { kind: "cape" },
      position: [0, 0, 0],
    },
    {
      name: "leaf-clasp",
      section: "decoration",
      material: "gold",
      shape: { kind: "leaf" },
      position: [0, 0.21, 0.335],
      rotation: [0, 0, -0.4],
    },
    {
      name: "belt-pouch",
      section: "accessories",
      material: "leather",
      shape: { kind: "ellipsoid", size: [0.105, 0.12, 0.07] },
      position: [0.27, -0.23, 0.29],
    },
    {
      name: "pouch-flap",
      section: "accessories",
      material: "flap",
      shape: { kind: "ellipsoid", size: [0.108, 0.055, 0.025] },
      position: [0.27, -0.17, 0.348],
    },
    {
      name: "pouch-button",
      section: "decoration",
      material: "gold",
      shape: { kind: "ellipsoid", size: [0.016, 0.016, 0.009] },
      position: [0.27, -0.192, 0.373],
    },
  ],
};

/** A short shoulder cape with seven leaf tips and an opening at the throat. */
function capeGeometry() {
  const positions: number[] = [], indices: number[] = [];
  const segments = 56;
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i <= segments; i++) {
      const angle = 0.23 + (i / segments) * (Math.PI * 2 - 0.46);
      const tip = Math.sin((i / segments) * Math.PI * 7) ** 2;
      const radius = row === 0 ? 0.205 : row === 1 ? 0.35 : 0.46 + tip * 0.025;
      const y = row === 0 ? 0.33 : row === 1 ? 0.34 : 0.15 - tip * 0.07;
      positions.push(Math.sin(angle) * radius, y, Math.cos(angle) * radius);
      if (row < 2 && i < segments) {
        const a = row * (segments + 1) + i, b = a + segments + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function leafGeometry() {
  const outline = new THREE.Shape();
  outline.moveTo(0, -0.06);
  outline.quadraticCurveTo(-0.065, 0, 0, 0.075);
  outline.quadraticCurveTo(0.065, 0, 0, -0.06);
  return new THREE.ExtrudeGeometry(outline, {
    depth: 0.012, bevelEnabled: true, bevelSize: 0.003,
    bevelThickness: 0.003, bevelSegments: 1, curveSegments: 6, steps: 1,
  });
}

/** Thin, rounded collar tips draped over the tapered tunic. */
function collarGeometry(side: number) {
  const outline = new THREE.Shape();
  outline.moveTo(side * 0.012, 0.275);
  outline.quadraticCurveTo(side * 0.07, 0.288, side * 0.14, 0.264);
  outline.quadraticCurveTo(side * 0.13, 0.215, side * 0.095, 0.172);
  outline.quadraticCurveTo(side * 0.085, 0.161, side * 0.075, 0.177);
  outline.quadraticCurveTo(side * 0.035, 0.235, side * 0.012, 0.275);
  const geometry = new THREE.ExtrudeGeometry(outline, {
    depth: 0.009,
    bevelEnabled: false,
    steps: 1,
    curveSegments: 4,
  });
  const vertices = geometry.getAttribute("position");
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), y = vertices.getY(i);
    const radius = 0.27 + ((0.285 - y) / 0.57) * 0.09;
    vertices.setZ(i, vertices.getZ(i) + Math.sqrt(radius * radius - x * x) + 0.025);
  }
  geometry.computeVertexNormals();
  return geometry;
}

/** A chipped boulder filling `size`, shaped like the stone giant's blocks. */
function rockGeometry(size: Vector, seed: number) {
  const geometry = new THREE.DodecahedronGeometry(1, 0);
  const vertices = geometry.getAttribute("position");
  // Coordinate-based variation preserves shared corners and flat rock faces.
  for (let v = 0; v < vertices.count; v++) {
    const x = vertices.getX(v),
      y = vertices.getY(v),
      z = vertices.getZ(v);
    const uneven = 1 + 0.14 * Math.sin(x * 3.7 + y * 5.1 + z * 2.9 + seed * 1.8);
    vertices.setXYZ(v, x * uneven, y * uneven, z * uneven);
  }
  geometry.rotateX(Math.sin(seed * 2.3) * 0.2);
  geometry.rotateY(seed * 0.73);
  geometry.scale(size[0] / 2, size[1] / 2, size[2] / 2);
  geometry.computeVertexNormals();
  return geometry;
}

/** Each instance owns its resources; dispose with the containing scene. */
export function garmentModel(definition: GarmentDefinition) {
  const root = new THREE.Group();
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  for (const part of definition.parts) {
    let material = materials.get(part.material);
    if (!material) {
      const spec = definition.materials[part.material];
      if (!spec) throw new Error(`Unknown garment material: ${part.material}`);
      material = new THREE.MeshStandardMaterial({
        roughness: 0.8, ...spec,
        side: part.shape.kind === "cape" ? THREE.DoubleSide : THREE.FrontSide,
      });
      materials.set(part.material, material);
    }
    const shape = part.shape;
    const geometry =
      shape.kind === "box"
        ? new THREE.BoxGeometry(...shape.size)
        : shape.kind === "cape"
          ? capeGeometry()
        : shape.kind === "leaf"
          ? leafGeometry()
        : shape.kind === "collar"
          ? collarGeometry(shape.side)
        : shape.kind === "rock"
          ? rockGeometry(shape.size, shape.seed)
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

export const stoneGarment: GarmentDefinition = {
  materials: {
    stone: { color: "#737785", roughness: 0.95 },
    edge: { color: "#434552", roughness: 0.95 },
    under: { color: "#b6b6b9", roughness: 0.95 },
  },
  // Loose boulders piled around the torso rather than fitted plates.
  parts: [
    {
      name: "stone-torso",
      section: "base",
      material: "edge",
      shape: { kind: "rock", size: [0.58, 0.58, 0.42], seed: 0 },
      position: [0, 0, 0],
      rotation: [0.05, 0.2, -0.04],
    },
    ...[-1, 1].flatMap((side): GarmentPart[] => [
      {
        name: `stone-plate-${side}`,
        section: "base",
        material: "stone",
        shape: { kind: "rock", size: [0.3, 0.44, 0.24], seed: side + 2 },
        position: [side * 0.15, 0.05, 0.18],
        rotation: [side * 0.08, side * -0.22, side * 0.11],
      },
      {
        name: `stone-chip-${side}`,
        section: "decoration",
        material: "edge",
        shape: { kind: "rock", size: [0.19, 0.17, 0.19], seed: side + 4 },
        position: [side * 0.27, 0.23, 0.2],
        rotation: [side * 0.3, side * 0.4, side * -0.25],
      },
      {
        name: `stone-shoulder-${side}`,
        section: "sleeves",
        material: "stone",
        shape: { kind: "rock", size: [0.32, 0.28, 0.38], seed: side + 6 },
        position: [side * 0.34, 0.21, 0],
        rotation: [side * 0.1, side * 0.3, side * -0.22],
      },
      {
        name: `stone-sleeve-${side}`,
        section: "sleeves",
        material: "under",
        shape: { kind: "rock", size: [0.21, 0.35, 0.23], seed: side + 8 },
        position: [side * 0.37, 0.02, 0.02],
        rotation: [side * -0.12, side * 0.5, side * 0.14],
      },
      {
        name: `stone-waist-${side}`,
        section: "belt",
        material: "stone",
        shape: { kind: "rock", size: [0.32, 0.2, 0.5], seed: side + 10 },
        position: [side * 0.15, -0.23, 0],
        rotation: [side * -0.06, side * 0.18, side * 0.1],
      },
      {
        name: `stone-hip-${side}`,
        section: "belt",
        material: "edge",
        shape: { kind: "rock", size: [0.17, 0.16, 0.18], seed: side + 12 },
        position: [side * 0.26, -0.31, 0.19],
        rotation: [side * 0.22, side * -0.35, side * 0.3],
      },
    ]),
  ],
};
