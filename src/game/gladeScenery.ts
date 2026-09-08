import { gladeDistance } from "./gladeLayout";
import * as THREE from "three";
import { ball, material, mesh } from "./models";
import type { CollisionSystem } from "./CollisionSystem";

// Shared handmade scenery keeps both glades visually consistent.
export function gladePath(
  root: THREE.Group,
  curve: THREE.CatmullRomCurve3,
  path: THREE.Material,
) {
  curve = curve.clone();
  curve.points.forEach((point) => {
    point.x = gladeDistance(point.x);
    point.z = gladeDistance(point.z);
  });
  const points = curve.getPoints(80);
  const positions: number[] = [];
  const indices: number[] = [];
  points.forEach((p, i) => {
    const tangent = curve.getTangent(i / 80);
    const n = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(
      0.77 + Math.sin(i * 0.4) * 0.045,
    );
    positions.push(p.x + n.x, p.y, p.z + n.z, p.x - n.x, p.y, p.z - n.z);
    if (i < 80) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  });
  const pathGeometry = new THREE.BufferGeometry();
  pathGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  pathGeometry.setIndex(indices);
  pathGeometry.computeVertexNormals();
  const pathMesh = mesh(pathGeometry, path, root);
  pathMesh.castShadow = false;
  return points;
}

export function gladeTrees(
  root: THREE.Group,
  collision: CollisionSystem,
  positions: number[][],
) {
  const trunk = material("#8e7250");
  const greens = ["#5c9460", "#6fa45e", "#80ab60"];
  positions.forEach(([layoutX, layoutZ, s], i) => {
    const x = gladeDistance(layoutX),
      z = gladeDistance(layoutZ);
    const t = new THREE.Group();
    t.position.set(x, 0, z);
    t.scale.setScalar(s);
    root.add(t);
    mesh(new THREE.CylinderGeometry(0.17, 0.27, 1.65, 7), trunk, t, 0, 0.8);
    const leaf = material(greens[i % 3]);
    ball(t, leaf, 0, 2, 0, 0.99, 1.03, 0.95);
    ball(t, leaf, -0.5, 1.85, 0.08, 0.58, 0.7, 0.65);
    ball(t, leaf, 0.5, 2, 0.02, 0.6, 0.75, 0.65);
    ball(t, leaf, 0.1, 2.6, 0, 0.66, 0.65, 0.65);
    collision.add(x, z, 0.26 * s);
  });
}

export function gladeRocks(
  root: THREE.Group,
  collision: CollisionSystem,
  positions: number[][],
) {
  positions.forEach(([layoutX, layoutZ, s]) => {
    const x = gladeDistance(layoutX),
      z = gladeDistance(layoutZ);
    const rock = mesh(
      new THREE.DodecahedronGeometry(s, 0),
      material("#a5aea2"),
      root,
      x,
      s * 0.6,
      z,
    );
    rock.scale.set(1.25, 0.8, 0.9);
    rock.rotation.set(0.2, x, 0.1);
    collision.add(x, z, s * 0.85);
  });
}

export function gladeBushes(
  root: THREE.Group,
  collision: CollisionSystem,
  positions: number[][],
) {
  positions.forEach(([layoutX, layoutZ], i) => {
    const x = gladeDistance(layoutX),
      z = gladeDistance(layoutZ);
    const bush = material("#71994f");
    ball(root, bush, x, 0.38, z, 0.62, 0.5, 0.6);
    ball(root, bush, x + 0.38, 0.28, z + 0.1, 0.37);
    collision.add(x, z, 0.55, 0.45);
    for (let j = 0; j < 3; j++)
      ball(
        root,
        material(i % 2 ? "#d88973" : "#eebd78"),
        x - 0.25 + j * 0.22,
        0.73,
        z + 0.1,
        0.065,
      );
  });
}

export function gladeFlowers(
  root: THREE.Group,
  collision: CollisionSystem,
  points: THREE.Vector3[],
  options: {
    seed: number;
    count: number;
    minX: number;
    minZ: number;
    width: number;
    depth: number;
  },
) {
  // Deterministic scattered flowers and grass, never on the main path.
  let seed = options.seed;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const stem = material("#6c984f"),
    petals = [material("#fff4d1"), material("#e8aaa1"), material("#d8c4e5")];
  for (let i = 0; i < options.count; i++) {
    const x = gladeDistance(options.minX + random() * options.width),
      z = gladeDistance(options.minZ + random() * options.depth);
    if (
      !collision.free(x, z, 0.3) ||
      points.some((p) => Math.hypot(p.x - x, p.z - z) < 1.1)
    )
      continue;
    if (i % 3 === 0) {
      mesh(
        new THREE.CylinderGeometry(0.018, 0.022, 0.2, 4),
        stem,
        root,
        x,
        0.1,
        z,
      );
      const petal = petals[Math.floor(i / 3) % petals.length];
      for (let j = 0; j < 4; j++)
        ball(
          root,
          petal,
          x + Math.cos((j * Math.PI) / 2) * 0.055,
          0.22,
          z + Math.sin((j * Math.PI) / 2) * 0.055,
          0.055,
          0.08,
          0.055,
        );
      ball(root, material("#e8bf5e"), x, 0.24, z, 0.03);
    } else {
      const tuft = mesh(
        new THREE.ConeGeometry(0.06, 0.19, 3),
        stem,
        root,
        x,
        0.075,
        z,
      );
      tuft.rotation.z = 0.2;
    }
  }
}
