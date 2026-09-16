import * as THREE from "three";
import { material, mesh } from "../models";
import { UNDERWORLD_HOLE as hole } from "./layout";

/** The sand itself opens, exposing a deep shaft below the walking surface. */
export function buildUnderworldHole(
  root: THREE.Group,
  ground: THREE.Mesh,
  unlocked: boolean,
) {
  const original = Array.from(ground.geometry.index!.array);
  const positions = ground.geometry.attributes.position;
  const opened: number[] = [];
  for (let i = 0; i < original.length; i += 3) {
    const triangle = original.slice(i, i + 3);
    if (
      !triangle.some(
        (v) =>
          Math.hypot(positions.getX(v) - hole.x, positions.getZ(v) - hole.z) <
          hole.radius,
      )
    )
      opened.push(...triangle);
  }
  const shaft = new THREE.Group();
  shaft.name = "underworld-shaft";
  shaft.position.set(hole.x, 0, hole.z);
  root.add(shaft);
  const wall = new THREE.MeshStandardMaterial({
    color: "#54252d",
    emissive: "#7b1525",
    emissiveIntensity: 0.32,
    side: THREE.BackSide,
    roughness: 1,
  });
  mesh(
    new THREE.CylinderGeometry(2.6, 1.65, 6, 32, 1, true),
    wall,
    shaft,
    0,
    -3,
  );
  const darkness = mesh(
    new THREE.CircleGeometry(1.7, 32),
    new THREE.MeshBasicMaterial({ color: "#200611" }),
    shaft,
    0,
    -5.9,
  );
  darkness.rotation.x = -Math.PI / 2;
  const rim = material("#88504b");
  const lip = mesh(
    new THREE.RingGeometry(2.2, 3.1, 40),
    material("#e8be7c"),
    shaft,
    0,
    -0.015,
  );
  lip.rotation.x = -Math.PI / 2;
  const cover = mesh(
    new THREE.CylinderGeometry(2.25, 2.25, 0.15, 32),
    material("#e8be7c"),
    shaft,
    0,
    -0.1,
  );
  const stone = new THREE.DodecahedronGeometry(1, 0);
  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI) / 12;
    const rock = mesh(
      stone,
      rim,
      shaft,
      Math.cos(a) * 2.55,
      -0.08,
      Math.sin(a) * 2.55,
    );
    rock.scale.set(0.48, 0.19, 0.42);
    rock.rotation.y = a;
  }
  const glow = new THREE.MeshBasicMaterial({ color: "#f04456" });
  for (let i = 0; i < 3; i++) {
    const ring = mesh(
      new THREE.TorusGeometry(2.15 - i * 0.2, 0.025, 4, 32),
      glow,
      shaft,
      0,
      -0.8 - i * 1.1,
    );
    ring.rotation.x = Math.PI / 2;
  }
  // Broken red seams follow the narrowing shaft walls up to the opening.
  for (let i = 0; i < 9; i++) {
    const angle = (i / 9) * Math.PI * 2;
    const points = Array.from({ length: 9 }, (_, j) => {
      const y = -5.5 + j * 0.68;
      const radius = 2.6 + (y / 6) * 0.95 - 0.035;
      const a = angle + Math.sin(j * 2.4 + i) * 0.07;
      return new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius);
    });
    mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points),
        24,
        0.035,
        4,
        false,
      ),
      glow,
      shaft,
    );
  }

  // Soft camera-facing wisps need no textures or additional lights on iPad.
  const smokeGeometry = new THREE.PlaneGeometry(1, 1);
  const smoke = Array.from({ length: 14 }, (_, i) => {
    const smokeMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { opacity: { value: 0 }, phase: { value: i * 1.7 } },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec4 center = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          vec2 size = vec2(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz));
          center.xy += position.xy * size;
          gl_Position = projectionMatrix * center;
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float opacity;
        uniform float phase;
        void main() {
          vec2 p = (vUv - 0.5) * 2.0;
          float ripple = sin(p.x * 8.0 + phase) * sin(p.y * 6.0 - phase) * 0.08;
          float density = 1.0 - smoothstep(0.12, 0.95, length(p) + ripple);
          vec3 color = mix(vec3(0.30, 0.015, 0.045), vec3(0.8, 0.06, 0.12), density);
          gl_FragColor = vec4(color, density * density * opacity);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });
    const puff = new THREE.Mesh(smokeGeometry, smokeMaterial);
    puff.name = "rising-red-smoke";
    // Billboarding happens in the shader, outside the plane's local bounds.
    puff.frustumCulled = false;
    shaft.add(puff);
    return puff;
  });
  let elapsed = 0;
  let amount = unlocked ? 1 : 0;
  let cut = false;
  return (dt: number, open: boolean) => {
    if (open !== cut) {
      ground.geometry.setIndex(open ? opened : original);
      cut = open;
    }
    elapsed = open ? elapsed + dt : 0;
    smoke.forEach((puff, i) => {
      const life = (elapsed * (0.13 + (i % 3) * 0.015) + i / smoke.length) % 1;
      const angle = i * 2.4 + life * 0.45;
      const radius = 0.8 + (i % 4) * 0.3 + life * 0.4;
      puff.position.set(
        Math.cos(angle) * radius,
        -0.3 + life * 3.8,
        Math.sin(angle) * radius,
      );
      puff.scale.set(1.1 + life * 1.6, 1.4 + life * 1.9, 1);
      puff.material.uniforms.opacity.value =
        Math.sin(life * Math.PI) * 0.38 * amount;
      puff.material.uniforms.phase.value = i * 1.7 + elapsed * 0.3;
    });
    // Lower the sand cover as the newly revealed chasm settles.
    amount = open ? Math.min(1, amount + dt * 0.65) : 0;
    shaft.visible = open;
    cover.visible = amount < 1;
    cover.position.y = -0.1 - amount * amount * 5.8;
    return amount === 1;
  };
}
