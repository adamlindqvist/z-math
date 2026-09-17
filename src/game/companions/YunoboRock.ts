import * as THREE from "three";
import { ball, box, material, mesh, flame } from "../models";
import { gameStore, type GameState } from "../../store/gameStore";
import { hasYunobo, YUNOBO_ROCK } from "./definitions";
import { RockBurst } from "./RockBurst";
import type { Interaction } from "../Area";

export class YunoboRock {
  root = new THREE.Group();
  private stone = new THREE.Group();
  private flowers = new THREE.Group();
  private emblem: THREE.Group;
  private bloom = 1;
  private wasHelping = false;
  private burst = new RockBurst();
  constructor() {
    this.root.name = "yunobo-rock";
    this.stone.userData.target = { kind: "yunoboRock", label: "Hjälp, Yunobo!" };
    this.root.position.set(YUNOBO_ROCK.x, 0, YUNOBO_ROCK.z);
    this.root.add(this.stone, this.flowers, this.burst.root);
    const rock = material("#8a6c60"), crack = material("#ffcd76");
    crack.emissive.set("#f9a64e");
    crack.emissiveIntensity = 0.3;
    const geometry = new THREE.IcosahedronGeometry(1, 2);
    const positions = geometry.getAttribute("position");
    // Coordinate-based distortion keeps shared corners together without seams.
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
      const roughness = 1 + 0.12 * Math.sin(x * 4 + y * 3 - z * 2)
        + 0.08 * Math.cos(y * 5 + z * 3) + 0.025 * Math.sin(x * 19 + y * 13 + z * 7);
      positions.setXYZ(i, x * roughness, y * roughness, z * roughness);
    }
    geometry.computeVertexNormals();
    rock.flatShading = true;
    // Broad bulges are part of one continuous surface, rather than attached stones.
    geometry.scale(2.8, 1.85, 0.8);
    geometry.rotateZ(0.07);
    geometry.translate(0, 1.55, 0);
    mesh(geometry, rock, this.stone);
    const colors: number[] = [];
    const tint = new THREE.Color();
    for (let i = 0; i < positions.count; i += 3) {
      const shade = 0.94 + 0.06 * Math.sin(positions.getX(i) * 3 + positions.getY(i) * 4);
      tint.setRGB(shade, shade, shade);
      for (let corner = 0; corner < 3; corner++) colors.push(tint.r, tint.g, tint.b);
    }
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    rock.vertexColors = true;
    // Project narrow ribbons onto the actual facets, including the curved lower edge.
    const surface = new THREE.Mesh(geometry, rock);
    const ray = new THREE.Raycaster();
    const direction = new THREE.Vector3(0, 0, -1);
    const project = (x: number, y: number, offset: number) => {
      ray.set(new THREE.Vector3(x, y, 5), direction);
      const hit = ray.intersectObject(surface, false)[0];
      return hit ? [x, y, hit.point.z + offset] : null;
    };
    const dark = material("#47372f");
    const fissure = (points: number[][]) => {
      for (const [mat, width, offset] of [[dark, 0.085, 0.008], [crack, 0.022, 0.012]] as const) {
        const vertices: number[] = [];
        for (let i = 1; i < points.length; i++) {
          const [ax, ay] = points[i - 1], [bx, by] = points[i];
          const length = Math.hypot(bx - ax, by - ay);
          const nx = -(by - ay) / length * width / 2, ny = (bx - ax) / length * width / 2;
          const steps = Math.ceil(length / 0.025);
          for (let step = 0; step < steps; step++) {
            const x0 = ax + (bx - ax) * step / steps, y0 = ay + (by - ay) * step / steps;
            const x1 = ax + (bx - ax) * (step + 1) / steps, y1 = ay + (by - ay) * (step + 1) / steps;
            const a = project(x0 - nx, y0 - ny, offset), b = project(x1 - nx, y1 - ny, offset);
            const c = project(x1 + nx, y1 + ny, offset), d = project(x0 + nx, y0 + ny, offset);
            if (a && b && c && d) vertices.push(...a, ...b, ...c, ...a, ...c, ...d);
          }
        }
        const ribbon = new THREE.BufferGeometry();
        ribbon.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
        ribbon.computeVertexNormals();
        const detail = mesh(ribbon, mat, this.stone);
        detail.castShadow = false;
      }
    };
    fissure([[0.2, 2.95], [-0.22, 2.45], [0.12, 2], [-0.25, 1.45], [0.07, 1], [-0.16, 0.5]]);
    fissure([[-0.22, 2.45], [-0.85, 2.2], [-1.1, 1.85]]);
    fissure([[-0.25, 1.45], [0.65, 1.65], [1.12, 1.28]]);
    this.emblem = flame(this.stone, 0, 3.6, 0, 0.6);
    const petals = material("#ffce7e"), center = material("#fff4c6"), stem = material("#6dba89");
    petals.emissive.set("#ff9e47"); petals.emissiveIntensity = 0.55;
    center.emissive.set("#fff0a2"); center.emissiveIntensity = 0.65;
    for (let i = 0; i < 5; i++) {
      const x = (i % 2 ? -1 : 1) * (1.9 + i * 0.08), z = Math.cos(i * 2.4) * 0.35;
      const y = 0.36 + i % 2 * 0.18;
      box(this.flowers, stem, x, y / 2, z, 0.045, y, 0.045);
      for (let j = 0; j < 5; j++) {
        const a = j / 5 * Math.PI * 2;
        ball(this.flowers, petals, x + Math.sin(a) * 0.13, y, z + Math.cos(a) * 0.13, 0.1, 0.05, 0.1);
      }
      ball(this.flowers, center, x, y + 0.04, z, 0.085, 0.05, 0.085);
    }
    this.update(0, 0);
  }
  dispose() { this.burst.dispose(); }
  interactions(state: GameState): Interaction[] {
    return hasYunobo(state.dungeons) && !state.yunobo.rockBroken ? [{
      x: YUNOBO_ROCK.x, z: YUNOBO_ROCK.z + 0.85,
      target: { kind: "yunoboRock", label: "Hjälp, Yunobo!" },
    }] : [];
  }
  get blocking() {
    const state = gameStore.getState();
    return !hasYunobo(state.dungeons) || !state.yunobo.rockBroken || state.yunoboHelping;
  }
  update(dt: number, time: number) {
    const state = gameStore.getState();
    this.root.visible = true;
    this.emblem.visible = hasYunobo(state.dungeons);
    const impact = this.wasHelping && !state.yunoboHelping && state.yunobo.rockBroken;
    if (impact) {
      this.bloom = 0;
      this.burst.start();
    }
    if (!state.overlay && !impact) this.burst.update(dt);
    this.wasHelping = state.yunoboHelping;
    if (!state.overlay) this.bloom = Math.min(1, this.bloom + dt * 1.6);
    this.stone.visible = !state.yunobo.rockBroken || state.yunoboHelping;
    this.flowers.visible = state.yunobo.rockBroken && !state.yunoboHelping;
    this.flowers.scale.setScalar(0.25 + this.bloom * 0.75);
    this.emblem.position.y = 3.6 + Math.sin(time * 2) * 0.08;
  }
}
