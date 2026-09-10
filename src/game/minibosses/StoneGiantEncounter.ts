import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import fontData from "three/examples/fonts/helvetiker_bold.typeface.json";
import { box, material, mesh } from "../models";
import { disposeTree, type Interaction } from "../Area";
import { Chest } from "../entities/Chest";
import { gameStore, type GameState } from "../../store/gameStore";
import {
  MINIBOSSES,
  RUNE_STONES,
  STONE_GIANT_CENTER as CENTER,
  STONE_GIANT_ARENA_RADIUS,
  minibossDefeated,
} from "./definitions";
import { FEEDBACK_SECONDS, type MinibossEncounter } from "./state";

const font = new FontLoader().parse(fontData);
const definition = MINIBOSSES.stone_giant;
const runeTarget = (value: number) => ({
  kind: "runeStone" as const,
  boss: "stone_giant" as const,
  value,
  label: `Välj ${value}`,
});
const chestTarget = {
  kind: "chest" as const,
  id: definition.chest,
  label: "Öppna",
};

/** Geometry text needs no canvas, downloaded font, texture or per-frame React update. */
function numberFace(
  value: number,
  size: number,
  parent: THREE.Group,
  ink: THREE.Material,
) {
  const geometry = new THREE.ShapeGeometry(
    font.generateShapes(String(value), size),
  );
  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox!;
  geometry.translate(
    -(bounds.max.x + bounds.min.x) / 2,
    -(bounds.max.y + bounds.min.y) / 2,
    0,
  );
  const digit = mesh(geometry, ink, parent, 0, 0.1, 0.045);
  digit.name = `rune-number-${value}`;
  digit.castShadow = false;
  digit.receiveShadow = false;
  return digit;
}
/** A shallow, irregular rock with a flat carved face; the rune belongs to it. */
function stoneFace(
  parent: THREE.Group,
  radius: number,
  surface: THREE.Material,
) {
  const face = new THREE.Group();
  parent.add(face);
  const outline = new THREE.Shape();
  const corners = [
    [-0.78, -0.74],
    [-1, 0.12],
    [-0.61, 0.88],
    [0.2, 1],
    [0.91, 0.51],
    [0.85, -0.48],
    [0.14, -0.92],
  ];
  corners.forEach(([x, y], i) =>
    i
      ? outline.lineTo(x * radius, y * radius)
      : outline.moveTo(x * radius, y * radius),
  );
  outline.closePath();
  const geometry = new THREE.ExtrudeGeometry(outline, {
    depth: 0.48,
    bevelEnabled: true,
    bevelSegments: 1,
    steps: 1,
    bevelSize: 0.045,
    bevelThickness: 0.02,
  });
  geometry.translate(0, 0, -0.48);
  mesh(geometry, surface, face).name = "carved-rock";
  return face;
}

export class StoneGiantEncounter {
  root = new THREE.Group();
  chest = new Chest(
    gameStore.getState().chests[definition.chest],
    minibossDefeated(gameStore.getState().minibosses, "stone_giant"),
  );
  private boss = new THREE.Group();
  private body = new THREE.Group();
  private rune: THREE.Group;
  private digits: THREE.Mesh[] = [];
  private backRune: THREE.Group;
  private backDigits: THREE.Mesh[] = [];
  private armor: {
    mesh: THREE.Mesh;
    home: THREE.Vector3;
    rotation: THREE.Euler;
  }[] = [];
  private core: THREE.Mesh;
  private fissures: { mesh: THREE.Mesh; phase: number }[] = [];
  private cracks = material("#ffad44");
  private ring: THREE.Mesh;
  private stones: {
    root: THREE.Group;
    glow: THREE.MeshStandardMaterial;
    plate: THREE.Group;
    crown: THREE.Mesh;
    home: THREE.Vector3;
  }[] = [];
  private sparks: THREE.Mesh[] = [];
  private encounter: MinibossEncounter | null = null;
  private elapsed = 0;
  private clock = 0;
  private resetId = gameStore.getState().resetId;
  constructor() {
    this.root.name = "stone-giant-arena";
    this.root.position.set(CENTER.x, 0, CENTER.z);
    const basalt = material("#393541"),
      edge = material("#ad7044"),
      ink = new THREE.MeshBasicMaterial({
        color: "#fff0b6",
        side: THREE.DoubleSide,
      });
    this.cracks.emissive.set("#ff6619");
    this.cracks.emissiveIntensity = 1;
    const floor = mesh(
      new THREE.CircleGeometry(STONE_GIANT_ARENA_RADIUS, 48),
      material("#554952"),
      this.root,
      0,
      0.045,
    );
    floor.rotation.x = -Math.PI / 2;
    floor.castShadow = false;
    const border = mesh(
      new THREE.RingGeometry(
        STONE_GIANT_ARENA_RADIUS - 0.11,
        STONE_GIANT_ARENA_RADIUS,
        48,
      ),
      edge,
      this.root,
      0,
      0.055,
    );
    border.rotation.x = -Math.PI / 2;
    border.castShadow = false;
    this.root.add(this.boss);
    this.boss.add(this.body);
    const stone = material("#77717b"),
      darkStone = material("#55505e");
    this.core = mesh(
      new THREE.DodecahedronGeometry(0.72, 0),
      this.cracks,
      this.body,
      0,
      1.45,
    );
    this.boss.name = "stone-giant";
    const blocks = [
      [-0.48, 0.38, 0, 0.62, 0.65, 0.7],
      [0.48, 0.38, 0, 0.62, 0.65, 0.7],
      [-0.4, 1.24, 0, 0.73, 0.86, 0.85],
      [0.4, 1.24, 0, 0.73, 0.86, 0.85],
      [-0.42, 1.92, 0, 0.76, 0.6, 0.92],
      [0.42, 1.92, 0, 0.76, 0.6, 0.92],
      [-1.03, 1.87, 0, 0.57, 0.7, 0.72],
      [1.03, 1.87, 0, 0.57, 0.7, 0.72],
      [-1.13, 1.18, 0.12, 0.55, 0.65, 0.62],
      [1.13, 1.18, 0.12, 0.55, 0.65, 0.62],
      [0, 2.62, 0, 0.95, 0.8, 0.8],
    ];
    for (const [i, [x, y, z, w, h, d]] of blocks.entries()) {
      const geometry = new THREE.DodecahedronGeometry(1, 0);
      const vertices = geometry.getAttribute("position");
      // Coordinate-based variation preserves shared corners and flat rock faces.
      for (let v = 0; v < vertices.count; v++) {
        const px = vertices.getX(v),
          py = vertices.getY(v),
          pz = vertices.getZ(v);
        const uneven =
          1 + 0.12 * Math.sin(px * 3.7 + py * 5.1 + pz * 2.9 + i * 1.8);
        vertices.setXYZ(v, px * uneven, py * uneven, pz * uneven);
      }
      geometry.rotateX(Math.sin(i * 2.3) * 0.17);
      geometry.rotateY(i * 0.73);
      geometry.scale(w * 0.62, h * 0.62, d * 0.62);
      geometry.computeVertexNormals();
      const part = mesh(
        geometry,
        i % 3 ? stone : darkStone,
        this.body,
        x,
        y,
        z,
      );
      part.name = `giant-rock-${i}`;
      part.rotation.z = Math.sin(i * 1.9) * 0.12;
      this.armor.push({
        mesh: part,
        home: part.position.clone(),
        rotation: part.rotation.clone(),
      });
    }
    const head = this.armor[this.armor.length - 1].mesh;
    for (const side of [-1, 1]) {
      box(head, ink, side * 0.23, 0.03, 0.53, 0.13, 0.13, 0.04);
      const brow = box(head, basalt, side * 0.23, 0.16, 0.55, 0.23, 0.07, 0.04);
      brow.rotation.z = side * 0.18;
    }
    this.rune = stoneFace(this.body, 0.66, darkStone);
    this.rune.name = "giant-rune";
    this.rune.position.set(0, 1.72, 0.59);
    this.rune.rotation.x = -0.28;
    const runeInk = material("#d8a268");
    runeInk.emissive.set("#cf7226");
    runeInk.emissiveIntensity = 0.35;
    this.digits = definition.phases.map((value) =>
      numberFace(value, 0.55, this.rune, runeInk),
    );
    this.backRune = stoneFace(this.body, 0.66, darkStone);
    this.backRune.name = "giant-back-rune";
    this.backRune.position.set(0, 1.72, -0.79);
    this.backRune.rotation.set(-0.28, Math.PI, 0, "YXZ");
    this.backDigits = definition.phases.map((value) =>
      numberFace(value, 0.55, this.backRune, runeInk),
    );
    // Broken seams run around the carved rune, with new branches in phase two.
    const paths = [
      {
        phase: 1,
        points: [
          [-0.28, 0.54],
          [-0.4, 0.3],
          [-0.32, 0.08],
          [-0.44, -0.18],
          [-0.32, -0.48],
        ],
      },
      {
        phase: 1,
        points: [
          [0.37, 0.4],
          [0.29, 0.18],
          [0.4, -0.08],
          [0.28, -0.32],
          [0.14, -0.53],
        ],
      },
      {
        phase: 2,
        points: [
          [-0.4, 0.3],
          [-0.17, 0.4],
          [0, 0.54],
        ],
      },
      {
        phase: 2,
        points: [
          [-0.44, -0.18],
          [-0.18, -0.29],
          [0.04, -0.23],
          [0.28, -0.32],
        ],
      },
      {
        phase: 2,
        points: [
          [0.4, -0.08],
          [0.52, 0.05],
          [0.59, 0.19],
        ],
      },
    ];
    for (const path of paths)
      for (let i = 1; i < path.points.length; i++) {
        const [x, y] = path.points[i - 1],
          [nx, ny] = path.points[i];
        const seam = box(
          this.rune,
          this.cracks,
          (x + nx) / 2,
          (y + ny) / 2,
          0.04,
          0.025,
          Math.hypot(nx - x, ny - y) + 0.012,
          0.012,
        );
        seam.rotation.z = -Math.atan2(nx - x, ny - y);
        seam.name = `armor-crack-phase-${path.phase}`;
        seam.castShadow = false;
        this.fissures.push({ mesh: seam, phase: path.phase });
      }
    this.ring = mesh(
      new THREE.RingGeometry(0.8, 0.88, 40),
      new THREE.MeshBasicMaterial({
        color: "#ffdb82",
        transparent: true,
        opacity: 0,
      }),
      this.root,
      0,
      0.09,
    );
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.castShadow = false;
    for (const { value, x, z } of RUNE_STONES) {
      const root = new THREE.Group();
      root.name = `rune-stone-${value}`;
      root.position.set(x - CENTER.x, 0, z - CENTER.z);
      root.userData.target = runeTarget(value);
      this.root.add(root);
      mesh(
        new THREE.CylinderGeometry(0.58, 0.67, 0.28, 7),
        basalt,
        root,
        0,
        0.18,
      );
      const glow = material("#e8ae64");
      glow.emissive.set("#e57025");
      const plate = stoneFace(root, 0.61, darkStone);
      plate.rotation.set(-0.65, 0.53, 0, "YXZ");
      plate.position.set(0, 0.82, 0.1);
      numberFace(value, 0.46, plate, glow).position.y = 0.12;
      for (let i = 0; i < value; i++) {
        const dot = mesh(
          new THREE.CircleGeometry(0.032, 10),
          glow,
          plate,
          ((i % 3) - (Math.min(value, 3) - 1) / 2) * 0.12,
          -0.25 - Math.floor(i / 3) * 0.1,
          0.046,
        );
        dot.name = "rune-dot";
        dot.castShadow = false;
      }
      const crown = mesh(
        new THREE.TorusGeometry(0.72, 0.06, 6, 24),
        glow,
        root,
        0,
        0.3,
      );
      crown.rotation.x = -Math.PI / 2;
      this.stones.push({
        root,
        glow,
        plate,
        crown,
        home: root.position.clone(),
      });
    }
    const sparkGeometry = new THREE.SphereGeometry(0.095, 8, 6);
    for (let i = 0; i < 14; i++) {
      const spark = mesh(sparkGeometry, ink, this.root);
      spark.visible = false;
      spark.castShadow = false;
      this.sparks.push(spark);
    }
    this.chest.root.position.set(0, 0, 0);
    this.chest.root.userData.target = chestTarget;
    this.root.add(this.chest.root);
    this.render(gameStore.getState());
  }
  interactions(state: GameState): Interaction[] {
    if (minibossDefeated(state.minibosses, "stone_giant") && !state.encounter)
      return [{ ...CENTER, target: chestTarget }];
    if (state.encounter?.status !== "choosing") return [];
    return RUNE_STONES.map(({ value, x, z }) => ({
      x,
      z,
      target: runeTarget(value),
    }));
  }
  update(dt: number, player?: THREE.Vector3) {
    const state = gameStore.getState();
    if (this.resetId !== state.resetId) {
      this.resetId = state.resetId;
      this.encounter = null;
      this.elapsed = 0;
      this.chest.resetReveal(minibossDefeated(state.minibosses, "stone_giant"));
      this.chest.openAmount = state.chests[definition.chest] ? 1 : 0;
    }
    if (!state.overlay && !state.motion) {
      this.clock += dt;
      if (player)
        gameStore.updateMinibossPresence(
          "stone_giant",
          Math.hypot(player.x - CENTER.x, player.z - CENTER.z),
        );
      const current = gameStore.getState().encounter;
      if (current !== this.encounter) {
        this.encounter = current;
        this.elapsed = 0;
      }
      this.elapsed += dt;
      if (
        current &&
        current.status !== "choosing" &&
        this.elapsed >= FEEDBACK_SECONDS[current.status]
      ) {
        gameStore.finishMinibossFeedback(current);
        this.encounter = gameStore.getState().encounter;
        this.elapsed = 0;
      }
      if (player && current && current.status !== "collapsing") {
        const angle = Math.atan2(player.x - CENTER.x, player.z - CENTER.z);
        this.body.rotation.y +=
          Math.atan2(
            Math.sin(angle - this.body.rotation.y),
            Math.cos(angle - this.body.rotation.y),
          ) * Math.min(1, dt * 2);
      }
    }
    const next = gameStore.getState();
    this.render(next);
    this.chest.update(
      state.overlay || state.motion ? 0 : dt,
      next.chests[definition.chest],
      minibossDefeated(next.minibosses, "stone_giant") && !next.encounter,
    );
  }
  private render(state: GameState) {
    const encounter = state.encounter;
    const status = encounter?.status;
    const defeated = minibossDefeated(state.minibosses, "stone_giant");
    this.boss.visible = !defeated || !!encounter;
    const phase = encounter?.phase ?? Math.min(state.minibosses.stone_giant, 2);
    const success = status === "success";
    const collapse =
      status === "collapsing" ? Math.min(1, this.elapsed / 2) : 0;
    const damage =
      phase +
      (success ? Math.min(1, this.elapsed / 1.5) : collapse > 0 ? 1 : 0);
    this.core.visible = damage > 0;
    this.core.name = "exposed-lava";
    this.core.scale
      .set(0.9 + damage * 0.13, 1.25, 0.65 + damage * 0.1)
      .multiplyScalar(1 - collapse);
    for (const fissure of this.fissures) {
      const opened = Math.min(1, Math.max(0, damage - fissure.phase + 1));
      fissure.mesh.visible = opened > 0;
      fissure.mesh.scale.x = opened * (damage >= 2 ? 2.8 : 1.2);
    }
    this.core.position.y = 1.45 * (1 - collapse);
    this.core.position.z = -0.12;
    this.cracks.emissiveIntensity = 0.5 + damage * 1.1 + collapse * 3;
    for (const digits of [this.digits, this.backDigits]) {
      digits.forEach((digit, i) => {
        digit.visible = i === phase && (!defeated || !!encounter);
      });
    }
    this.rune.visible = collapse < 0.55 && (!defeated || !!encounter);
    this.backRune.visible = this.rune.visible;
    const patrol =
      !encounter && !defeated
        ? 1
        : status === "intro"
          ? Math.max(0, 1 - this.elapsed / 0.8)
          : 0;
    this.boss.position.set(
      Math.sin(this.clock * 0.45) * 1.4 * patrol,
      0,
      Math.cos(this.clock * 0.45) * 1.1 * patrol,
    );
    if (!encounter && !defeated) {
      this.body.rotation.y = Math.atan2(
        1.4 * Math.cos(this.clock * 0.45),
        -1.1 * Math.sin(this.clock * 0.45),
      );
    }
    this.body.position.y = collapse
      ? 0
      : Math.sin(this.clock * (2 + phase * 1.8)) * (0.025 + phase * 0.035) +
        Math.abs(Math.sin(this.clock * 3.8)) * 0.045 * patrol;
    this.body.position.x = collapse
      ? Math.sin(this.elapsed * 60) * 0.06 * (1 - collapse)
      : 0;
    this.armor.forEach(({ mesh: part, home, rotation }, i) => {
      part.position.copy(home);
      part.rotation.copy(rotation);
      if (i < 2 && patrol > 0) {
        const step = this.clock * 3.8 + i * Math.PI;
        part.position.y += Math.max(0, Math.sin(step)) * 0.12 * patrol;
        part.position.z += Math.cos(step) * 0.1 * patrol;
      }
      part.position.x += Math.sign(home.x) * damage * 0.14;
      part.rotation.z += Math.sign(home.x) * damage * 0.08;
      if (success)
        part.rotation.x +=
          Math.sin(Math.min(1, this.elapsed / 1.5) * Math.PI) * 0.16;
      if (i === 6 || i === 7)
        part.rotation.x += Math.sin(this.clock * (2 + phase)) * phase * 0.07;
      part.scale.setScalar(1 - damage * 0.055);
      if (collapse > 0.35) {
        const t = Math.min(1, (collapse - 0.35) / 0.65);
        const angle = i * 2.4;
        part.position.x += Math.cos(angle) * t * 1.8;
        part.position.z += Math.sin(angle) * t * 1.8;
        part.position.y = THREE.MathUtils.lerp(home.y, 0.18, t * t);
        part.rotation.x += t * (i % 2 ? 1.4 : -0.8);
        part.rotation.z += t * Math.cos(angle);
        part.scale.multiplyScalar(1 - t * 0.35);
      }
    });
    const pulse =
      status === "intro"
        ? Math.min(1, this.elapsed / 0.8)
        : (this.clock % 4) / 4;
    this.ring.visible = !!encounter && !collapse;
    this.ring.scale.setScalar(1 + pulse * 2.1);
    (this.ring.material as THREE.MeshBasicMaterial).opacity = (1 - pulse) * 0.5;
    this.stones.forEach((stone, i) => {
      const selected = encounter?.selected.includes(i + 1) ?? false;
      const activated = selected && (success || status === "collapsing");
      stone.root.position.copy(stone.home);
      stone.root.position.y = selected ? 0.1 : 0;
      if (selected && status === "failure")
        stone.root.position.x += Math.sin(this.elapsed * 25) * 0.07;
      for (const child of stone.plate.children) {
        if (child.name !== "carved-rock")
          child.visible = !defeated || !!encounter;
      }
      stone.glow.color.set(
        activated ? "#bdffe2" : selected ? "#ffe39d" : "#ca945c",
      );
      stone.glow.emissive.set(activated ? "#37d9bc" : "#ff8b29");
      stone.glow.emissiveIntensity = selected
        ? status === "failure"
          ? 0.4 + Math.sin(this.elapsed * 12) * 0.25
          : 1.6
        : 0.22;
      stone.crown.visible = selected;
      stone.crown.position.y = activated ? 0.65 : 0.3;
    });
    const destination = new THREE.Vector3();
    if (success) {
      this.root.updateMatrixWorld(true);
      this.rune.getWorldPosition(destination);
      this.root.worldToLocal(destination);
    }
    this.sparks.forEach((spark, i) => {
      spark.visible = success;
      if (!success || !encounter) return;
      const stone = this.stones[encounter.selected[i % 2] - 1];
      const t = (this.elapsed / 0.8 + Math.floor(i / 2) / 7) % 1;
      stone.plate.getWorldPosition(spark.position);
      this.root.worldToLocal(spark.position);
      spark.position.lerp(destination, t);
      spark.position.y += Math.sin(t * Math.PI) * 0.65;
      spark.scale.setScalar(0.6 + Math.sin(t * Math.PI));
    });
  }
  dispose() {
    disposeTree(this.root);
  }
}
