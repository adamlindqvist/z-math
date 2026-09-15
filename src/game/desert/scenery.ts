import {
  DESERT_PATHS,
  DESERT_TEMPLE,
  DESERT_OASIS,
  desertBoundary,
} from "./layout";
import * as THREE from "three";
import type { CollisionSystem } from "../CollisionSystem";
import { material } from "../models";

/** A continuous sand surface: paths are colours, never overlapping flat slabs. */
export function desertGround(root: THREE.Group) {
  const geometry = new THREE.PlaneGeometry(56, 62, 112, 124);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, 0, 11);
  const positions = geometry.attributes.position;
  const colors: number[] = [];
  const sand = new THREE.Color("#e8be7c"),
    light = new THREE.Color("#f8dda4"),
    shade = new THREE.Color("#d39a60");
  const routes = DESERT_PATHS;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i),
      z = positions.getZ(i);
    const edge = THREE.MathUtils.smoothstep(
      Math.hypot(x / 16, (z - 11) / 11),
      1.25,
      1.9,
    );
    // All playable sand stays at foot level; the rolling dunes rise beyond it.
    const waves = Math.sin(x * 0.44 + z * 0.2) + Math.cos(z * 0.38 - x * 0.22);
    positions.setY(i, -0.025 + edge * (1.5 + waves * 0.65));
    let distance = Infinity;
    for (const [ax, az, bx, bz] of routes) {
      const dx = bx - ax,
        dz = bz - az;
      const t = THREE.MathUtils.clamp(
        ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz),
        0,
        1,
      );
      distance = Math.min(
        distance,
        Math.hypot(x - ax - t * dx, z - az - t * dz),
      );
    }
    const wind = Math.sin(z * 5 + Math.sin(x * 0.7) * 2.5) * 0.5 + 0.5;
    const c = sand.clone().lerp(shade, wind * 0.13 + edge * 0.15);
    c.lerp(
      light,
      (1 -
        THREE.MathUtils.smoothstep(
          distance + Math.sin(z * 1.1 + x) * 0.13,
          0.45,
          1.5,
        )) *
        0.85,
    );
    colors.push(c.r, c.g, c.b);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const ground = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }),
  );
  ground.name = "wind-sculpted-sand";
  ground.receiveShadow = true;
  root.add(ground);
}

/** Repeated details are instanced, so extra richness costs few draw calls on iPad. */
export function desertScenery(
  root: THREE.Group,
  collision: CollisionSystem,
  oasis: THREE.Group,
) {
  const sphere = new THREE.SphereGeometry(1, 10, 6);
  const stone = new THREE.DodecahedronGeometry(1, 0);
  const cylinder = new THREE.CylinderGeometry(0.85, 1, 1, 9);
  const ring = new THREE.TorusGeometry(1, 0.075, 5, 24);
  const palette = {
    sandstone: material("#c38758"),
    cap: material("#efc18a"),
    rose: material("#ad7054"),
    green: material("#568c73"),
    mint: material("#80ad7a"),
    flower: material("#ec9294"),
    gold: material("#f6ca63"),
    teal: material("#4baea5"),
    cream: material("#fff0c2"),
    clay: material("#c87853"),
  };
  const batches = new Map<
    string,
    {
      geometry: THREE.BufferGeometry;
      mat: THREE.Material;
      transforms: THREE.Matrix4[];
    }
  >();
  const dummy = new THREE.Object3D();
  function put(
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy = sx,
    sz = sx,
    rz = 0,
    ry = 0,
  ) {
    const key = geo.uuid + mat.uuid;
    if (!batches.has(key))
      batches.set(key, { geometry: geo, mat, transforms: [] });
    dummy.position.set(x, y, z);
    dummy.scale.set(sx, sy, sz);
    dummy.rotation.set(0, ry, rz);
    dummy.updateMatrix();
    batches.get(key)!.transforms.push(dummy.matrix.clone());
  }
  function rock(x: number, z: number, size: number, height: number) {
    for (let j = 0; j < 3; j++)
      put(
        stone,
        j === 1 ? palette.rose : j === 2 ? palette.cap : palette.sandstone,
        x + j * 0.08,
        height * (0.22 + j * 0.26),
        z,
        size * (1 - j * 0.16),
        height * 0.32,
        size * (0.8 - j * 0.1),
        0.07 * j,
        x,
      );
    collision.addEllipse(x, z, size, size * 0.8);
  }
  // Overlapping rocks form a closed, scalloped canyon rim. The sole gap
  // is the shell doorway; a rear wall beyond its travel trigger seals it.
  for (let i = 0; i < 100; i++) {
    const a = (i * Math.PI * 2) / 100;
    const p = desertBoundary(a);
    if (p.z > 18.5 && Math.abs(p.x + 10) < 2.35) continue;
    rock(
      p.x,
      p.z,
      1.05 + (i % 3) * 0.08,
      p.z > 16 ? 0.9 + (i % 3) * 0.13 : 1.65 + (i % 4) * 0.3,
    );
  }
  for (const x of [-12, -10.7, -9.4, -8]) rock(x, 23, 1.1, 1.4);
  for (const [x, z, s, h] of [
    [-11, 7, 1.6, 2.3],
    [5, 2, 1.4, 2],
    [12, 13, 1.3, 1.8],
  ])
    rock(x, z, s, h);

  // A wind-carved arch on the horizon, beyond the playable boundary.
  for (const side of [-1, 1]) {
    rock(-1 + side * 2.1, -4, 1, 3.8);
    for (let i = 0; i < 4; i++) {
      const a = ((i / 3) * Math.PI) / 2;
      put(
        stone,
        palette.cap,
        -1 + side * Math.cos(a) * 2.1,
        3.3 + Math.sin(a) * 1.5,
        -4,
        0.7,
        0.6,
        0.75,
        side * a * 0.4,
      );
    }
  }

  for (const [x, z, h] of [
    [6.7, 15, 1.3],
    [4, 19, 0.9],
    [-12, 12, 1.1],
    [12, 9, 1.2],
    [-6, 4, 0.85],
  ]) {
    put(sphere, palette.green, x, h * 0.55, z, 0.25, h * 0.6, 0.24);
    for (const side of [-1, 1]) {
      put(
        sphere,
        palette.green,
        x + side * 0.28,
        h * 0.55,
        z,
        0.34,
        0.12,
        0.14,
      );
      put(
        sphere,
        palette.mint,
        x + side * 0.5,
        h * 0.72,
        z,
        0.13,
        h * 0.25,
        0.13,
      );
    }
    for (let j = 0; j < 5; j++) {
      const a = (j * Math.PI * 2) / 5;
      put(
        sphere,
        palette.flower,
        x + Math.cos(a) * 0.12,
        h * 1.13,
        z + Math.sin(a) * 0.12,
        0.1,
        0.055,
        0.1,
      );
    }
    put(sphere, palette.gold, x, h * 1.17, z, 0.07);
    collision.addEllipse(x, z, 0.65, 0.28);
  }

  // A sandstone sanctuary frames the existing portal without narrowing its approach.
  for (const side of [-1, 1]) {
    const x = DESERT_TEMPLE.x + side * 1.65;
    for (let j = 0; j < 4; j++)
      put(
        cylinder,
        j % 2 ? palette.cap : palette.sandstone,
        x,
        0.32 + j * 0.58,
        DESERT_TEMPLE.z - 0.65,
        0.46 - j * 0.03,
        0.6,
        0.46 - j * 0.03,
      );
    put(
      sphere,
      palette.teal,
      x,
      2.55,
      DESERT_TEMPLE.z - 0.65,
      0.18,
      0.25,
      0.18,
    );
    collision.addEllipse(x, DESERT_TEMPLE.z - 0.65, 0.48, 0.48);
  }
  put(
    stone,
    palette.cap,
    DESERT_TEMPLE.x,
    2.85,
    DESERT_TEMPLE.z - 0.65,
    2.1,
    0.42,
    0.65,
  );
  put(
    sphere,
    palette.gold,
    DESERT_TEMPLE.x,
    3,
    DESERT_TEMPLE.z,
    0.36,
    0.36,
    0.08,
  );
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    put(
      sphere,
      palette.gold,
      DESERT_TEMPLE.x + Math.sin(a) * 0.53,
      3 + Math.cos(a) * 0.53,
      DESERT_TEMPLE.z,
      0.045,
      0.13,
      0.04,
      -a,
    );
  }

  // Curved shore stones, reeds, and flowers that return when the oasis fills.
  for (let i = 0; i < 15; i++) {
    const a = (i * Math.PI * 2) / 15;
    put(
      stone,
      i % 3 ? palette.cap : palette.sandstone,
      DESERT_OASIS.x + Math.cos(a) * 2.65,
      0.045,
      DESERT_OASIS.z + Math.sin(a) * 2.06,
      0.25,
      0.13,
      0.19,
      0,
      a,
    );
  }
  for (let i = 0; i < 10; i++) {
    const a = 1.8 + i * 0.33;
    const x = DESERT_OASIS.x + Math.cos(a) * 2.55,
      z = DESERT_OASIS.z + Math.sin(a) * 1.9;
    for (let j = 0; j < 3; j++)
      put(
        sphere,
        palette.mint,
        x + j * 0.08,
        0.23,
        z,
        0.035,
        0.3,
        0.06,
        (j - 1) * 0.25,
      );
    const flower = new THREE.Mesh(sphere, palette.flower);
    flower.position.set(x, 0.5, z);
    flower.scale.set(0.12, 0.07, 0.12);
    oasis.add(flower);
  }
  for (let i = 0; i < 3; i++) {
    const ripple = new THREE.Mesh(ring, palette.cream);
    ripple.rotation.x = -Math.PI / 2;
    ripple.position.set(DESERT_OASIS.x - 0.3, 0.115, DESERT_OASIS.z);
    ripple.scale.set(0.4 + i * 0.36, 0.3 + i * 0.25, 0.15);
    oasis.add(ripple);
  }

  // A little archaeological corner around the treasure, with painted pottery.
  for (const [x, z, s] of [
    [9.4, 17.8, 0.5],
    [8.7, 18.3, 0.32],
    [6.9, 11.6, 0.3],
  ]) {
    put(sphere, palette.clay, x, s * 0.7, z, s * 0.6, s * 0.8, s * 0.6);
    put(cylinder, palette.cream, x, s * 1.3, z, s * 0.38, 0.09, s * 0.38);
    put(cylinder, palette.teal, x, s * 0.65, z, s * 0.61, 0.085, s * 0.61);
    collision.addEllipse(x, z, s * 0.6, s * 0.6);
  }
  // Small wind-polished pebbles and grasses leave the central routes open.
  for (let i = 0; i < 55; i++) {
    const x = Math.sin(i * 8.7) * 8,
      z = 1 + ((i * 3.71) % 21);
    if (
      Math.abs(x) < 2.3 ||
      (x < -3 && z < 11) ||
      (x > 2 && z < 11) ||
      (x < -3 && z > 15 && z < 19)
    )
      continue;
    put(
      stone,
      palette.cap,
      x,
      0.035,
      z,
      0.1 + (i % 3) * 0.045,
      0.06,
      0.09,
      0,
      i,
    );
    if (i % 3 === 0)
      for (let j = 0; j < 3; j++)
        put(
          sphere,
          palette.gold,
          x + j * 0.07,
          0.16,
          z + 0.15,
          0.024,
          0.2,
          0.045,
          (j - 1) * 0.4,
        );
  }
  // Tiny paired animal tracks curve toward the oasis.
  for (let i = 0; i < 14; i++)
    for (const side of [-1, 1])
      put(
        sphere,
        palette.sandstone,
        -1.8 - Math.sin(i * 0.13) * 0.7 + side * 0.09,
        -0.017,
        14.5 - i * 0.27 + side * 0.07,
        0.045,
        0.012,
        0.075,
      );
  const instances: THREE.InstancedMesh[] = [];
  for (const { geometry, mat, transforms } of batches.values()) {
    const instance = new THREE.InstancedMesh(geometry, mat, transforms.length);
    transforms.forEach((matrix, i) => instance.setMatrixAt(i, matrix));
    instance.castShadow = true;
    instance.receiveShadow = true;
    instance.computeBoundingSphere();
    root.add(instance);
    instances.push(instance);
  }
  return () => instances.forEach((instance) => instance.dispose());
}
