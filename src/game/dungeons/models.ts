import * as THREE from "three";
import { box, ball, material, mesh, flame, silhouette } from "../models";
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
  sand: { stone: "#d9b276", floor: "#e9cd93", tiles: ["#f4dfa9", "#e7c78b"], band: "#af793f", water: "#e9cd93", foam: "#fff0ba", gate: "#ac753e", track: "#b7915f", block: "#b68c53", accent: "#ffe38a", opening: "#b58642" },
  stone: {
    stone: "#c2b69e",
    floor: "#c9bea7",
    tiles: ["#e0d6bf", "#d5cab2"],
    band: "#a69678",
    water: "#c9bea7",
    foam: "#efe4cb",
    gate: "#88785f",
    track: "#9e9078",
    block: "#766e5f",
    accent: "#ffe0a0",
    opening: "#493e32",
  },
  fire: {
    stone: "#635052",
    floor: "#403b43",
    tiles: ["#75686a", "#82716e"],
    band: "#b57a4a",
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
export function waterDecoration(parent: THREE.Group, theme: "water") {
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
// A carved diamond rosette, deliberately distinct from the three puzzle symbols.
function stoneRosette(parent: THREE.Group, trim: THREE.Material, inset: THREE.Material) {
  box(parent, trim, 0, 0, 0, 0.46, 0.46, 0.045).rotation.z = Math.PI / 4;
  box(parent, inset, 0, 0, 0.03, 0.28, 0.28, 0.035).rotation.z = Math.PI / 4;
  ball(parent, trim, 0, 0, 0.065, 0.065, 0.065, 0.025);
}

// Low relief stays along the existing walls, clear of doors and puzzle tracks.
function stoneDecoration(parent: THREE.Group) {
  const group = new THREE.Group();
  group.name = "stone-decoration";
  parent.add(group);
  const stone = material(THEMES.stone.stone);
  const trim = material(THEMES.stone.band);
  const pale = material(THEMES.stone.tiles[0]);
  const green = material("#879576");
  const moss = material("#7d8962");
  const glow = material("#ffe0a0");
  glow.emissive.set("#ffd28a");
  glow.emissiveIntensity = 0.45;
  for (const side of [-1, 1]) {
    // A contrasting mosaic border frames the floor without crossing the tracks.
    box(group, trim, side * 5.62, 0.027, 0, 0.32, 0.025, 10.6);
    for (let z = -4.8; z <= 4.8; z += 0.8) {
      const tile = box(group, green, side * 5.62, 0.047, z, 0.16, 0.018, 0.16);
      tile.rotation.y = Math.PI / 4;
    }
    for (const z of [-3.8, 0, 3.8]) {
      box(group, stone, side * 5.83, 0.51, z, 0.2, 1.02, 0.42);
      box(group, trim, side * 5.8, 1.02, z, 0.26, 0.14, 0.58);
      box(group, pale, side * 5.8, 0.12, z, 0.26, 0.2, 0.56);
    }
    for (const z of [-2, 2]) {
      const panel = new THREE.Group();
      panel.position.set(side * 5.78, 0.52, z);
      panel.rotation.y = -side * Math.PI / 2;
      group.add(panel);
      box(panel, trim, 0, 0, 0, 1.18, 0.66, 0.045);
      box(panel, pale, 0, 0, 0.035, 1.04, 0.54, 0.025);
      const relief = new THREE.Group();
      relief.position.z = 0.075;
      panel.add(relief);
      stoneRosette(relief, trim, green);
      // Small enclosed amber lamps, without additional lights or flame motifs.
      box(panel, trim, 0, 0.47, 0.04, 0.3, 0.08, 0.2);
      ball(panel, glow, 0, 0.65, 0.06, 0.11, 0.16, 0.1);
      box(panel, trim, 0, 0.82, 0.04, 0.26, 0.07, 0.2);
    }
    for (const z of [-4.8, 2.9]) {
      ball(group, moss, side * 5.77, 0.08, z, 0.13, 0.045, 0.3);
      ball(group, moss, side * 5.8, 0.18, z + 0.12, 0.04, 0.15, 0.16);
    }
    // Masonry joints and alternating inlays on the end walls leave both exits clear.
    for (const x of [-4.5, -3, 3, 4.5]) {
      box(group, trim, x, 0.34, side * 5.6, 0.035, 0.52, 0.025);
      box(group, green, x + 0.35, 0.53, side * 5.58, 0.42, 0.11, 0.035);
      box(group, trim, x, 0.029, side * 5.5, 1.3, 0.03, 0.26);
      box(group, pale, x, 0.049, side * 5.5, 0.2, 0.015, 0.16);
    }
  }
  return group;
}
export function roomDecoration(parent: THREE.Group, theme: DungeonTheme, leftOpening = false, roomId = "light") {
  if (theme === "sand") {
    const group = new THREE.Group(); group.name = "sand-decoration"; parent.add(group);
    const stone = material(THEMES.sand.stone), band = material(THEMES.sand.band), gold = material(THEMES.sand.accent);
    for (const side of [-1, 1]) for (const z of [-3, 0, 3]) {
      box(group, stone, side * 5.1, 0.9, z, 0.45, 1.8, 0.6);
      box(group, band, side * 5.1, 1.8, z, 0.65, 0.15, 0.75);
      const relief = new THREE.Group(); relief.position.set(side * 5.25, 1.1, z); relief.rotation.y = -side * Math.PI / 2; group.add(relief);
      sunMotif(relief, gold, 0, 0, 0, 0.25);
    }
    return group;
  }
  if (theme === "stone") return stoneDecoration(parent);
  if (theme === "water") return waterDecoration(parent, theme);
  return fireDecoration(parent, leftOpening, roomId);
}
function fireDecoration(parent: THREE.Group, leftOpening: boolean, roomId: string) {
  const group = new THREE.Group();
  group.name = "fire-decoration";
  parent.add(group);
  const lava = material("#ed4c12");
  lava.emissive.set("#ff4208");
  lava.emissiveIntensity = 0.7;
  const rim = material("#39343d");
  const hot = material("#ffc05b");
  hot.emissive.set("#ff9a28");
  hot.emissiveIntensity = 0.8;
  // Jagged, pale currents and cooled crust break up the straight temple channels.
  const channel = (x: number, z: number, length: number, width: number, rotation: number) => {
    const bed = new THREE.Group();
    bed.position.set(x, 0, z);
    bed.rotation.y = rotation;
    group.add(bed);
    box(bed, rim, 0, 0.025, 0, length, 0.04, width + 0.08);
    box(bed, lava, 0, 0.055, 0, length, 0.03, width);
    const current = new THREE.Shape();
    const count = Math.ceil(length / 0.35);
    for (let i = 0; i <= count; i++) {
      const px = -length / 2 + length * i / count;
      const pz = Math.sin(i * 2.3) * width * 0.18;
      if (i === 0) current.moveTo(px, pz);
      else current.lineTo(px, pz);
    }
    for (let i = count; i >= 0; i--)
      current.lineTo(-length / 2 + length * i / count, Math.sin(i * 2.3) * width * 0.18 + width * 0.16);
    current.closePath();
    const glow = mesh(new THREE.ShapeGeometry(current), hot, bed, 0, 0.073, 0);
    glow.rotation.x = -Math.PI / 2;
    const crust = new THREE.Shape();
    crust.moveTo(-0.18, 0);
    crust.lineTo(-0.1, 0.12);
    crust.lineTo(0.07, 0.16);
    crust.lineTo(0.2, 0);
    crust.closePath();
    const crustGeometry = new THREE.ShapeGeometry(crust);
    for (let i = 0; i < Math.floor(length / 0.65); i++) {
      const side = i % 2 ? -1 : 1;
      const flake = mesh(crustGeometry, rim, bed, -length / 2 + 0.3 + i * 0.65, 0.076, side * width / 2);
      flake.rotation.set(-Math.PI / 2, 0, side === 1 ? 0 : Math.PI);
    }
  };
  for (const x of [-5.65, 5.65]) {
    const segments = x < 0 && leftOpening ? [{ z: -3.35, length: 4.1 }, { z: 3.35, length: 4.1 }] : [{ z: 0, length: 10.8 }];
    for (const { z, length } of segments) {
      channel(x, z, length, 0.46, Math.PI / 2);
    }
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
      channel(x, z, 4.4, 0.3, 0);
    }
  // A few hairline fissures in the outer paving, away from tracks and doorways.
  const fissure = new THREE.Shape();
  fissure.moveTo(0, 0);
  fissure.lineTo(0.16, 0.2);
  fissure.lineTo(0.06, 0.39);
  fissure.lineTo(0.27, 0.7);
  fissure.lineTo(0.11, 0.38);
  fissure.lineTo(0.21, 0.19);
  fissure.closePath();
  const fissureGeometry = new THREE.ShapeGeometry(fissure);
  for (const side of [-1, 1])
    for (const z of [-3, 2.3]) {
      const crack = mesh(fissureGeometry, lava, group, side * 5.38, 0.025, z);
      crack.rotation.set(-Math.PI / 2, 0, side * Math.PI / 2);
    }
  fireTempleWalls(group, roomId, lava);
  // Small reliefs do not need additional shadow-map draws on iPad.
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) object.castShadow = false;
  });
  return group;
}

/** Shallow architectural details stay inside the existing perimeter decoration. */
function fireTempleWalls(parent: THREE.Group, roomId: string, lava: THREE.Material) {
  const basalt = material("#423d46"),
    cutStone = material("#75616a"),
    copper = material("#c88b53"),
    recess = material("#302e37");
  const columnGeometry = new THREE.CylinderGeometry(0.18, 0.22, 1, 6);

  // Symmetrical bays and masonry joints make this a built temple inside a volcano.
  // The middle bay is left empty for the side entrance and final exit.
  for (const side of [-1, 1]) {
    for (const z of [-3.65, 3.65]) {
      const bay = new THREE.Group();
      bay.position.set(side * 5.79, 0, z);
      bay.rotation.y = -side * Math.PI / 2;
      parent.add(bay);
      box(bay, basalt, 0, 0.79, 0, 1.75, 1.5, 0.16);
      box(bay, recess, 0, 0.85, 0.095, 1.23, 0.95, 0.04);
      for (const x of [-0.78, 0.78]) {
        box(bay, cutStone, x, 0.77, 0.1, 0.19, 1.48, 0.2);
        for (const y of [0.14, 1.47])
          box(bay, copper, x, y, 0.12, 0.25, 0.1, 0.23);
      }
      box(bay, copper, 0, 1.57, 0.08, 1.93, 0.13, 0.24);
      box(bay, cutStone, 0, 0.26, 0.13, 1.45, 0.14, 0.22);

      if (roomId === "stones") {
        // A narrow lava spill between cooled, hexagonal basalt ribs.
        box(bay, lava, 0, 0.64, 0.14, 0.15, 0.95, 0.035);
        for (const [x, height] of [[-0.4, 0.66], [-0.22, 0.93], [0.25, 0.81], [0.43, 0.54]]) {
          const rib = mesh(columnGeometry, cutStone, bay, x, 0.32 + height / 2, 0.18);
          rib.scale.set(0.57, height, 0.57);
        }
      } else if (roomId === "treasure") {
        // A framed fire crest and stepped plinth echo the temple's door lintels.
        const crest = mesh(new THREE.TorusGeometry(0.38, 0.035, 4, 12), copper, bay, 0, 0.87, 0.15);
        crest.scale.y = 1.12;
        flame(bay, 0, 0.49, 0.19, 0.69);
        box(bay, copper, 0, 0.38, 0.15, 0.73, 0.08, 0.13);
      } else {
        const mountain = silhouette(bay, cutStone, [
          [-0.52, 0.43], [-0.18, 1.1], [0.16, 1.1], [0.52, 0.43],
        ]);
        mountain.position.z = 0.13;
        const flow = silhouette(bay, lava, [
          [-0.12, 1.09], [0.1, 1.09], [0.04, 0.85], [0.18, 0.55],
          [0.01, 0.55], [-0.07, 0.84],
        ]);
        flow.position.z = 0.18;
        flame(bay, 0, 1.12, 0.17, 0.27);
      }
    }
    // Broken basalt edges beside the channels; never across a doorway.
    for (const z of [-4.95, -1.75, 1.75, 4.95]) {
      const rock = mesh(columnGeometry, basalt, parent, side * 5.65, 0.15, z);
      rock.scale.set(0.85, 0.3, 1.3);
      rock.rotation.y = z;
    }
  }
  for (const z of [-5.61, 5.61])
    for (const x of [-4.6, -2.7, 2.7, 4.6]) {
      box(parent, cutStone, x, 0.38, z, 0.035, 0.56, 0.025);
      box(parent, copper, x, 0.58, z, 0.55, 0.055, 0.035);
    }
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
  else if (theme === "fire") flame(g, 0, 1.73, 0.36, 0.42);
  else if (theme === "sand") {
    sunMotif(g, foam, 0, 1.95, 0.37, 0.25);
    for (const side of [-1, 1]) {
      box(g, band, side * 0.95, 0.1, 0, 0.7, 0.2, 0.75);
      for (const y of [0.6, 1, 1.4]) box(g, foam, side * 0.95, y, 0.29, 0.45, 0.035, 0.03);
    }
    if (filled) for (let i = 0; i < 3; i++) box(g, stone, 0, 2.25 + i * 0.16, 0, 2.6 - i * 0.55, 0.16, 0.75);
  }
  else {
    const details = new THREE.Group();
    details.name = "stone-portal-decoration";
    g.add(details);
    box(details, band, 0, 2.18, 0, 2.6, 0.12, 0.72);
    const moss = material("#7d8962");
    const green = material("#879576");
    for (const side of [-1, 1]) {
      // Recessed column fluting and stacked masonry add depth to the plain frame.
      for (const offset of [-0.12, 0.12])
        box(details, band, side * 0.95 + offset, 1.02, 0.282, 0.035, 1.08, 0.025);
      for (const y of [0.55, 1.25])
        box(details, foam, side * 0.95, y, 0.3, 0.45, 0.045, 0.035);
    }
    if (filled) {
      const facade = new THREE.Group();
      facade.name = "stone-entrance-pediment";
      details.add(facade);
      const triangle = new THREE.Shape();
      triangle.moveTo(-1.3, 0);
      triangle.lineTo(0, 0.78);
      triangle.lineTo(1.3, 0);
      triangle.closePath();
      mesh(new THREE.ExtrudeGeometry(triangle, { depth: 0.55, bevelEnabled: false }), stone, facade, 0, 2.24, -0.27);
      for (const side of [-1, 1]) {
        const coping = box(facade, band, side * 0.65, 2.66, 0, 1.55, 0.12, 0.65);
        coping.rotation.z = -side * Math.atan2(0.78, 1.3);
        // Ivy hugs the outer face of each existing pillar.
        for (let i = 0; i < 4; i++) {
          const leaf = ball(facade, moss, side * (1.1 + (i % 2) * 0.045), 0.42 + i * 0.22, 0.32, 0.09, 0.15, 0.035);
          leaf.rotation.z = side * (i % 2 ? 0.5 : -0.4);
        }
      }
      const crest = new THREE.Group();
      crest.position.set(0, 2.55, 0.32);
      crest.scale.setScalar(0.75);
      facade.add(crest);
      stoneRosette(crest, band, green);
      for (const x of [-0.72, -0.36, 0, 0.36, 0.72])
        box(facade, foam, x, 1.97, 0.34, 0.13, 0.13, 0.035).rotation.z = Math.PI / 4;
    }
    for (const side of [-1, 1]) {
      box(details, band, side * 0.95, 0.1, 0, 0.6, 0.2, 0.65);
      ball(details, moss, side * 1.09, 0.23, 0.29, 0.09, 0.14, 0.035);
    }
  }
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
    if (theme === "sand") { sunMotif(g, foam, 0, 0.9, 0.08, 0.38); return g; }
    if (theme === "fire") {
      flame(g, 0, 0.2, 0.08, 1.3);
      for (const side of [-1, 1]) flame(g, side * 0.95, 1.76, 0, 0.42);
      return g;
    }
    if (theme === "stone") {
      const shimmer = new THREE.Group();
      shimmer.name = "stone-portal-shimmer";
      g.add(shimmer);
      // A soft radial glow reads as a portal, without textures or extra lights.
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.68), new THREE.ShaderMaterial({
        vertexShader: `varying vec2 portalUv;
          void main() {
            portalUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `varying vec2 portalUv;
          void main() {
            float radius = length((portalUv - vec2(0.5, 0.47)) * vec2(2.1, 1.7));
            float light = 1.0 - smoothstep(0.05, 0.95, radius);
            vec3 color = mix(vec3(0.12, 0.105, 0.07), vec3(0.92, 0.69, 0.29), light);
            gl_FragColor = vec4(color, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
        side: THREE.DoubleSide,
      }));
      glow.position.set(0, 0.89, 0.055);
      glow.castShadow = false;
      shimmer.add(glow);
      const light = new THREE.MeshBasicMaterial({ color: "#fff1bd" });
      const gold = new THREE.MeshBasicMaterial({ color: "#e8c778" });
      const crest = new THREE.Group();
      crest.position.set(0, 0.97, 0.12);
      shimmer.add(crest);
      // An open diamond echoes the facade rosette without resembling a solid door.
      for (const side of [-1, 1]) {
        for (const top of [-1, 1]) {
          const edge = box(crest, light, side * 0.16, top * 0.16, 0, 0.45, 0.025, 0.018);
          edge.rotation.z = -side * top * Math.PI / 4;
        }
      }
      box(crest, gold, 0, 0, 0.01, 0.15, 0.15, 0.02).rotation.z = Math.PI / 4;
      for (const [sx, sy, size] of [[-0.43, 1.43, 0.055], [0.38, 1.27, 0.04], [-0.36, 0.53, 0.04], [0.4, 0.36, 0.06], [0.12, 1.58, 0.035]]) {
        box(shimmer, light, sx, sy, 0.1, size * 0.45, size * 2, 0.01);
        box(shimmer, light, sx, sy, 0.1, size * 1.5, size * 0.45, 0.01);
      }
      return g;
    }
    const waterDetails = new THREE.Group();
    waterDetails.name = "water-portal-decoration";
    g.add(waterDetails);
    const bubbleGeometry = new THREE.TorusGeometry(1, 0.16, 4, 12);
    const bubbleMaterial = new THREE.MeshBasicMaterial({ color: palette.foam });
    for (const [bx, by, radius] of [
      [-0.43, 1.4, 0.1],
      [0.3, 1.22, 0.14],
      [-0.18, 0.9, 0.08],
      [0.43, 0.53, 0.08],
      [-0.4, 0.35, 0.12],
    ]) {
      const bubble = mesh(bubbleGeometry, bubbleMaterial, waterDetails, bx, by, 0.07);
      bubble.scale.setScalar(radius);
      bubble.castShadow = false;
    }
    wave(waterDetails, foam, 0, 0.18, 0.08, 1);
  }
  return g;
}

function sunMotif(parent: THREE.Group, mat: THREE.Material, x: number, y: number, z: number, radius: number) {
  const sun = new THREE.Group(); sun.position.set(x, y, z); parent.add(sun);
  const disk = mesh(new THREE.CircleGeometry(radius * 0.6, 12), mat, sun); disk.castShadow = false;
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    box(sun, mat, Math.sin(a) * radius, Math.cos(a) * radius, 0, 0.045, radius * 0.55, 0.025).rotation.z = -a;
  }
}
