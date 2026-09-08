import * as THREE from "three";
import { box, ball, material, mesh, flame } from "../models";
import type { DungeonTheme, SymbolKind } from "./definitions";
// Raised geometric symbols work without fonts, textures or colour recognition.
export function symbol(
  kind: SymbolKind,
  parent: THREE.Group,
  x: number,
  y: number,
  z: number,
  scale = 1,
) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.scale.setScalar(scale);
  parent.add(g);
  const ink = material(
    kind === "sun" ? "#e6aa36" : kind === "leaf" ? "#4e8659" : "#7876aa",
  );
  if (kind === "sun") {
    const disc = mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.045, 12),
      ink,
      g,
      0,
      0.02,
      0,
    );
    disc.castShadow = false;
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const ray = box(
        g,
        ink,
        Math.cos(a) * 0.29,
        0.02,
        Math.sin(a) * 0.29,
        0.12,
        0.045,
        0.055,
      );
      ray.rotation.y = -a;
    }
  } else if (kind === "leaf") {
    const leaf = ball(g, ink, 0, 0.035, 0, 0.25, 0.07, 0.37);
    leaf.rotation.y = -0.4;
    const stem = box(g, material("#d5e7bc"), 0, 0.11, 0, 0.035, 0.025, 0.52);
    stem.rotation.y = -0.4;
  } else {
    const shape = new THREE.Shape();
    shape.moveTo(0.16, -0.3);
    shape.bezierCurveTo(-0.5, -0.3, -0.5, 0.3, 0.16, 0.3);
    shape.bezierCurveTo(-0.15, 0.15, -0.15, -0.15, 0.16, -0.3);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.035,
      bevelEnabled: false,
      curveSegments: 8,
    });
    geo.rotateX(-Math.PI / 2);
    mesh(geo, ink, g, 0.08, 0.025, 0);
  }
  return g;
}
// Palette shared by the entrance and every room. No textures or extra lights.
export const THEMES = {
  fire: {
    stone: "#635052",
    floor: "#ba8063",
    tiles: ["#daa77d", "#cf966e"],
    band: "#e67c37",
    water: "#f36b25",
    foam: "#ffe3a0",
    gate: "#a54830",
    track: "#805547",
    block: "#69545b",
    accent: "#ffbc57",
    opening: "#9d3629",
  },
  water: {
    stone: "#91adbe",
    floor: "#aed9dd",
    tiles: ["#d0f0ed", "#bde5e7"],
    band: "#299da9",
    water: "#48b7d5",
    foam: "#dbfbff",
    gate: "#397caa",
    track: "#6f9cae",
    block: "#789daf",
    accent: "#94ddff",
    opening: "#2267a5",
  },
} satisfies Record<DungeonTheme, Record<string, string | string[]>>;

// A flat ribbon with two rounded crests, distinct from the puzzle symbols.
export function wave(
  parent: THREE.Group,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  scale = 1,
) {
  const shape = new THREE.Shape();
  shape.moveTo(-0.6, 0);
  shape.bezierCurveTo(-0.4, 0.3, -0.2, -0.2, 0, 0.06);
  shape.bezierCurveTo(0.2, 0.3, 0.4, -0.2, 0.6, 0.06);
  shape.lineTo(0.6, -0.06);
  shape.bezierCurveTo(0.4, -0.32, 0.2, 0.18, 0, -0.06);
  shape.bezierCurveTo(-0.2, -0.32, -0.4, 0.18, -0.6, -0.12);
  shape.closePath();
  const ribbon = mesh(new THREE.ShapeGeometry(shape, 8), mat, parent, x, y, z);
  ribbon.scale.setScalar(scale);
  ribbon.castShadow = false;
  return ribbon;
}
export function waterDecoration(parent: THREE.Group, theme: DungeonTheme) {
  const palette = THEMES[theme];
  const water = material(palette.water, 0.35),
    foam = material(palette.foam);
  const decoration = new THREE.Group();
  decoration.name = "water-decoration";
  parent.add(decoration);
  // Shallow, non-colliding strips outside the stone tracks; gaps at both doors.
  for (const x of [-5.65, 5.65]) {
    box(decoration, water, x, 0.035, 0, 0.3, 0.03, 10.8);
    for (const z of [-3, 0, 3]) {
      const ripple = wave(decoration, foam, x, 0.057, z, 0.55);
      ripple.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
    }
  }
  for (const z of [-5.48, 5.48])
    for (const x of [-3.6, 3.6]) {
      box(decoration, water, x, 0.035, z, 4.4, 0.03, 0.25);
      const ripple = wave(decoration, foam, x, 0.057, z, 0.8);
      ripple.rotation.x = -Math.PI / 2;
    }
  for (const x of [-5.79, 5.79])
    for (const z of [-2.6, 2.6]) {
      const drop = new THREE.Group();
      drop.position.set(x, 0.52, z);
      decoration.add(drop);
      ball(drop, foam, 0, 0, 0, 0.045, 0.14, 0.12);
      mesh(new THREE.ConeGeometry(0.12, 0.23, 8), foam, drop, 0, 0.16).scale.x =
        0.38;
    }
  return decoration;
}
export function roomDecoration(parent: THREE.Group, theme: DungeonTheme) {
  if (theme === "water") return waterDecoration(parent, theme);
  const group = new THREE.Group();
  group.name = "fire-decoration";
  parent.add(group);
  const lava = material("#f96b22");
  lava.emissive.set("#f95113");
  lava.emissiveIntensity = 0.55;
  const rim = material("#664c47");
  for (const x of [-5.65, 5.65]) {
    box(group, rim, x, 0.015, 0, 0.48, 0.04, 10.8);
    box(group, lava, x, 0.045, 0, 0.3, 0.03, 10.8);
    for (const z of [-2.6, 2.6]) {
      mesh(
        new THREE.CylinderGeometry(0.17, 0.1, 0.18, 8),
        rim,
        group,
        x,
        0.22,
        z,
      );
      flame(group, x, 0.32, z, 0.48);
    }
  }
  for (const z of [-5.48, 5.48])
    for (const x of [-3.6, 3.6]) {
      box(group, rim, x, 0.015, z, 4.4, 0.04, 0.32);
      box(group, lava, x, 0.045, z, 4.4, 0.03, 0.25);
    }
  return group;
}
export function portal(
  parent: THREE.Group,
  x: number,
  z: number,
  theme: DungeonTheme,
  filled = false,
) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  parent.add(g);
  const palette = THEMES[theme];
  const stone = material(palette.stone),
    band = material(palette.band),
    foam = material(palette.foam);
  for (const side of [-1, 1]) {
    box(g, stone, side * 0.95, 0.85, 0, 0.5, 1.7, 0.55);
    box(g, band, side * 0.95, 1.7, 0, 0.56, 0.12, 0.62);
    box(g, band, side * 0.95, 0.35, 0.29, 0.5, 0.12, 0.035);
  }
  box(g, stone, 0, 1.93, 0, 2.45, 0.45, 0.65);
  if (theme === "water") wave(g, foam, 0, 1.96, 0.36, 0.8);
  else flame(g, 0, 1.73, 0.36, 0.42);
  box(g, material(palette.tiles[0]), 0, 0.04, 0.3, 1.4, 0.08, 0.9);
  if (filled) {
    const surface = new THREE.Mesh(
      new THREE.PlaneGeometry(1.42, 1.7),
      new THREE.MeshBasicMaterial({
        color: palette.opening,
        side: THREE.DoubleSide,
      }),
    );
    surface.position.set(0, 0.89, 0.03);
    g.add(surface);
    if (theme === "fire") {
      flame(g, 0, 0.2, 0.08, 1.3);
      for (const side of [-1, 1]) flame(g, side * 0.95, 1.76, 0, 0.42);
      return g;
    }
    const bubbleGeometry = new THREE.TorusGeometry(1, 0.16, 4, 12);
    const bubbleMaterial = new THREE.MeshBasicMaterial({ color: palette.foam });
    for (const [bx, by, radius] of [
      [-0.43, 1.4, 0.1],
      [0.3, 1.22, 0.14],
      [-0.18, 0.9, 0.08],
      [0.43, 0.53, 0.08],
      [-0.4, 0.35, 0.12],
    ]) {
      const bubble = mesh(bubbleGeometry, bubbleMaterial, g, bx, by, 0.07);
      bubble.scale.setScalar(radius);
      bubble.castShadow = false;
    }
    wave(g, foam, 0, 0.18, 0.08, 1);
  }
  return g;
}
