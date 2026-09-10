import * as THREE from "three";
import { scatterDetail, type ScatterOptions } from "./gladeScenery";
import { ball, box, flame, material, mesh } from "./models";
import type { CollisionSystem } from "./CollisionSystem";

// Two crossed sheets read as a solid flame from the overhead camera, and one
// shared template keeps every copy on the same geometries and materials.
function flameTemplate() {
  const template = new THREE.Group();
  for (const turn of [0, Math.PI / 2])
    flame(template, 0, 0, 0, 1).rotation.y = turn;
  return template;
}

// Fire-themed ground detail built on the same scatter as the glade flowers,
// so the volcano floor feels as alive as the meadow without blocking movement.
export function volcanoGround(
  root: THREE.Group,
  collision: CollisionSystem,
  points: THREE.Vector3[],
  glow: THREE.Material,
  options: ScatterOptions & { exclude?: (x: number, z: number) => boolean },
) {
  const soot = material("#3b3238"),
    ash = material("#cfb8a0"),
    basalt = material("#514b5b");
  const tuftGeometry = new THREE.ConeGeometry(0.06, 0.19, 3),
    chipGeometry = new THREE.DodecahedronGeometry(1, 0);
  const template = flameTemplate();
  const group = new THREE.Group();
  group.name = "volcano-ground";
  root.add(group);
  scatterDetail(collision, points, options, (x, z, i, random) => {
    if (options.exclude?.(x, z)) return;
    const angle = random() * Math.PI * 2;
    // Cracks are the loudest detail, so only one place in ten gets one.
    switch (i % 10) {
      case 0:
      case 5: {
        const fire = template.clone();
        fire.position.set(x, 0.01, z);
        fire.rotation.y = angle;
        fire.scale.setScalar(0.22 + random() * 0.08);
        group.add(fire);
        break;
      }
      case 1: {
        // A short bent fissure: a soot sliver under each arm grounds the glow
        // without leaving a dark blob behind when an arm has to be trimmed.
        let turn = angle;
        let head = new THREE.Vector2(x, z);
        for (let j = 0; j < 2; j++) {
          turn += j ? (random() < 0.5 ? -0.6 : 0.6) : 0;
          const wanted = 0.16 + random() * 0.14;
          // The scatter only clears the start point, so shrink the arm until
          // its tip is clear rather than letting it crawl up a boulder.
          const length = [1, 0.6, 0.35]
            .map((f) => wanted * f)
            .find((l) =>
              collision.free(
                head.x + Math.cos(turn) * l,
                head.y - Math.sin(turn) * l,
                0.05,
              ),
            );
          if (!length) break;
          const cx = head.x + (Math.cos(turn) * length) / 2,
            cz = head.y - (Math.sin(turn) * length) / 2;
          // A Y-rotated box runs along +X, so the arm points that way too.
          for (const [w, d, y, m] of [
            [length + 0.07, 0.075, 0.006, soot],
            [length, 0.026, 0.011, glow],
          ] as const) {
            const part = box(group, m, cx, y, cz, w, 0.014, d);
            part.name = "volcano-ground-crack";
            part.rotation.y = turn;
            part.castShadow = false;
          }
          head = new THREE.Vector2(
            head.x + Math.cos(turn) * length,
            head.y - Math.sin(turn) * length,
          );
        }
        break;
      }
      case 2:
      case 7: {
        const tuft = mesh(tuftGeometry, soot, group, x, 0.075, z);
        tuft.rotation.set(0, angle, random() < 0.5 ? -0.25 : 0.25);
        break;
      }
      case 3:
      case 8: {
        const spark = ball(group, glow, x, 0.11, z, 0.055);
        const flake = mesh(chipGeometry, basalt, group, x, 0.035, z);
        flake.scale.set(0.12, 0.05, 0.1);
        flake.rotation.y = angle;
        break;
      }
      default: {
        const heap = mesh(
          chipGeometry,
          i % 2 ? ash : basalt,
          group,
          x,
          0.03,
          z,
        );
        heap.scale.set(0.14, 0.045, 0.12);
        heap.rotation.y = angle;
      }
    }
  });
}
