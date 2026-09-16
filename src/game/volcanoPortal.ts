import * as THREE from "three";
import { box, mesh, material, silhouette } from "./models";
import { gladePosition } from "./gladeLayout";
import type { CollisionSystem } from "./CollisionSystem";

export const VOLCANO_ENTRANCE = gladePosition(6, 24);
export const VOLCANO_INNER_ENTRANCE = { x: 0, z: -4.8 };
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
  const stone = material(returning ? "#9caa8d" : "#514957");
  const edge = material(returning ? "#d4c9a5" : "#887782");
  const dark = material(returning ? "#647854" : "#302f3d");
  const leaf = material("#78ad57");
  // Curved, shallow leaves read as foliage from the elevated game camera.
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, -0.16);
  leafShape.bezierCurveTo(-0.18, -0.05, -0.13, 0.12, 0, 0.19);
  leafShape.bezierCurveTo(0.13, 0.12, 0.18, -0.05, 0, -0.16);
  const leafGeometry = returning
    ? new THREE.ExtrudeGeometry(leafShape, {
        depth: 0.025,
        bevelEnabled: true,
        bevelThickness: 0.012,
        bevelSize: 0.012,
        bevelSegments: 1,
        curveSegments: 6,
        steps: 1,
      })
    : null;
  const accent = new THREE.MeshStandardMaterial({
    color: returning ? "#dcf7a5" : "#ffc16c",
    emissive: returning ? "#91c768" : "#ff702e",
    emissiveIntensity: 0.5,
    roughness: 0.65,
  });
  // Keep the original pillar footprint and clear passage on both sides.
  const blocks = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.55, 0.43, 0.65),
    stone,
    10,
  );
  const transform = new THREE.Object3D();
  blocks.castShadow = blocks.receiveShadow = true;
  group.add(blocks);
  for (const [column, side] of [-1, 1].entries()) {
    collision.add(position.x + side * 0.95, position.z, 0.275, 0.325);
    box(group, dark, side * 0.95, 1.15, 0, 0.51, 2.3, 0.59);
    for (let i = 0; i < 5; i++) {
      transform.position.set(side * 0.95, 0.23 + i * 0.46, 0);
      transform.rotation.set(0, (i % 2 ? 1 : -1) * 0.025, 0);
      transform.updateMatrix();
      blocks.setMatrixAt(column * 5 + i, transform.matrix);
    }
    for (const y of [0.12, 2.2])
      box(group, edge, side * 0.95, y, 0, 0.55, 0.17, 0.65);
    // Decorations face both approaches, including the return world's arrival side.
    for (const face of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        if (returning) {
          const sprig = mesh(
            leafGeometry!,
            leaf,
            group,
            side * (0.93 + (i % 2 ? 0.1 : -0.1)),
            0.6 + i * 0.47,
            face * 0.36,
          );
          if (face === -1) sprig.rotation.y = Math.PI;
          sprig.rotation.z = side * (i % 2 ? -0.6 : 0.6);
        } else {
          const crack = box(
            group,
            accent,
            side * (0.93 + (i % 2 ? 0.06 : -0.06)),
            0.6 + i * 0.47,
            face * 0.332,
            0.035,
            0.25,
            0.015,
          );
          crack.rotation.z = side * (i % 2 ? -0.55 : 0.55);
        }
      }
      if (returning) {
        const flower = mesh(
          new THREE.IcosahedronGeometry(0.105, 0),
          material("#f4cf8b"),
          group,
          side * 0.96,
          1.8,
          face * 0.37,
        );
        flower.scale.z = 0.45;
      }
    }
    const crown = mesh(
      leafGeometry ?? new THREE.OctahedronGeometry(0.22),
      returning ? leaf : accent,
      group,
      side * 0.96,
      2.72,
      0,
    );
    crown.scale.set(returning ? 1.15 : 0.65, returning ? 1.15 : 1.5, 0.75);
    crown.rotation.z = side * -0.2;
  }
  box(group, dark, 0, 2.4, 0, 2.5, 0.45, 0.75);
  for (let i = -2; i <= 2; i++)
    box(
      group,
      i === 0 ? edge : stone,
      i * 0.49,
      2.4,
      0,
      0.47,
      i === 0 ? 0.55 : 0.42,
      0.77,
    );
  box(group, edge, 0, 2.66, 0, 2.5, 0.09, 0.75);
  // A shallow threshold marks the doorway without adding a step or an obstacle.
  box(group, stone, 0, 0.025, 0, 1.35, 0.05, 0.72);
  for (const face of [-1, 1]) {
    const medallion = mesh(
      new THREE.CylinderGeometry(0.37, 0.37, 0.07, 10),
      dark,
      group,
      0,
      2.46,
      face * 0.43,
    );
    medallion.rotation.x = Math.PI / 2;
  }
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
  for (const face of [-1, 1]) {
    const symbol = silhouette(
      group,
      accent,
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
    symbol.position.set(0, 2.46, face * 0.48);
    symbol.scale.setScalar(0.85);
    if (face === -1) symbol.rotation.y = Math.PI;
  }
  const shimmer = mesh(
    new THREE.PlaneGeometry(1.3, 2.1),
    new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        tint: { value: new THREE.Color(returning ? "#e3ffc1" : "#ffe0a1") },
      },
      vertexShader: `varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying vec2 vUv;
      uniform float time;
      uniform vec3 tint;
      void main() {
        float edge = pow(abs(vUv.x - 0.5) * 2.0, 3.0);
        float wave = pow(0.5 + 0.5 * sin(vUv.y * 19.0 - time * 1.3 + sin(vUv.x * 9.0)), 8.0);
        float fade = smoothstep(0.0, 0.12, vUv.y) * smoothstep(0.0, 0.12, 1.0 - vUv.y);
        gl_FragColor = vec4(tint, (edge * 0.3 + wave * 0.12) * fade);
      }`,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    group,
    0,
    1.1,
    0.012,
  );
  shimmer.castShadow = shimmer.receiveShadow = false;
  return {
    update(active: boolean, time: number) {
      opening.visible = shimmer.visible = active;
      (shimmer.material as THREE.ShaderMaterial).uniforms.time.value = time;
      accent.emissiveIntensity = active
        ? 0.55 + Math.sin(time * 1.5) * 0.12
        : 0.08;
      glow.opacity = 0.43 + Math.sin(time * 1.5) * 0.08;
    },
  };
}
