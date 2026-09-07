import * as THREE from "three";
import { box, ball, material, mesh } from "../models";
import type { SymbolKind } from "./definitions";
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
export function portal(
  parent: THREE.Group,
  x: number,
  z: number,
  filled = false,
) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  parent.add(g);
  const stone = material("#b4b8a1"),
    moss = material("#78965c");
  for (const side of [-1, 1]) {
    box(g, stone, side * 0.95, 0.85, 0, 0.5, 1.7, 0.55);
    box(g, moss, side * 0.95, 1.7, 0, 0.56, 0.12, 0.62);
  }
  box(g, stone, 0, 1.93, 0, 2.45, 0.45, 0.65);
  const seal = symbol("sun", g, 0, 1.95, 0.36, 0.65);
  seal.rotation.x = Math.PI / 2;
  box(g, material("#e2d5aa"), 0, 0.04, 0.3, 1.4, 0.08, 0.9);
  if (filled) {
    // Opaque, self-lit surface: the landscape cannot be seen through the portal.
    const surface = new THREE.Mesh(
      new THREE.PlaneGeometry(1.42, 1.7),
      new THREE.MeshBasicMaterial({ color: "#171a38", side: THREE.DoubleSide }),
    );
    surface.position.set(0, 0.89, 0.03);
    g.add(surface);
    const stars = [
      [-0.46, 1.52, 0.065],
      [0.15, 1.55, 0.04],
      [0.48, 1.3, 0.055],
      [-0.15, 1.19, 0.075],
      [0.28, 0.97, 0.045],
      [-0.5, 0.88, 0.035],
      [0.5, 0.63, 0.065],
      [-0.19, 0.64, 0.05],
      [0.1, 0.36, 0.07],
      [-0.48, 0.27, 0.045],
      [0.43, 0.18, 0.03],
    ];
    for (const [sx, sy, radius] of stars) {
      const shape = new THREE.Shape();
      for (let i = 0; i < 10; i++) {
        const angle = Math.PI / 2 + (i * Math.PI) / 5;
        const r = i % 2 === 0 ? radius : radius * 0.42;
        if (i === 0) shape.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
        else shape.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      shape.closePath();
      const star = new THREE.Mesh(
        new THREE.ShapeGeometry(shape),
        new THREE.MeshBasicMaterial({
          color: "#fff0b5",
          side: THREE.DoubleSide,
        }),
      );
      star.position.set(sx, sy, 0.07);
      g.add(star);
    }
  }
  return g;
}
