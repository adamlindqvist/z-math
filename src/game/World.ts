import { Bokoblin } from "./entities/Bokoblin";
import { buildSouthGlade } from "./SouthGlade";
import { type Area, disposeTree } from "./Area";
import { DUNGEONS } from "./dungeons/definitions";
import { portal } from "./dungeons/models";
import * as THREE from "three";
import { ball, box, material, mesh, silhouette } from "./models";
import { CollisionSystem } from "./CollisionSystem";
import { Chest } from "./entities/Chest";
import { NPC } from "./entities/NPC";
import { Collectible } from "./entities/Collectible";
import { gameStore } from "../store/gameStore";
export class World implements Area {
  spawn = { x: -6.2, z: 2.9 };
  cameraMode = "glade" as const;
  interactions() {
    const state = gameStore.getState();
    return [
      ...(!state.bridgeUnlocked
        ? [{ target: "bokoblin" as const, x: 0, z: 7.9 }]
        : [
            {
              target: {
                kind: "chest" as const,
                id: "south" as const,
                label: state.chests.south ? "Titta i kistan" : "Öppna",
              },
              x: 3.5,
              z: 23,
            },
          ]),
      {
        target: "npc" as const,
        x: this.npc.root.position.x,
        z: this.npc.root.position.z,
      },
      {
        target: {
          kind: "chest" as const,
          id: "glade" as const,
          label: "Öppna",
        },
        x: this.chest.root.position.x,
        z: this.chest.root.position.z,
      },
    ];
  }
  passages() {
    return DUNGEONS.map((d) => ({
      x: d.entrance.x,
      z: d.entrance.z,
      destination: { dungeon: d.id, room: d.rooms[0].id },
    }));
  }
  dispose() {
    disposeTree(this.root);
  }
  root = new THREE.Group();
  collision = new CollisionSystem(11.1, 17.55, 9.45);
  bokoblin = new Bokoblin(gameStore.getState().bridgeUnlocked);
  southChest = new Chest(gameStore.getState().chests.south);
  chest = new Chest(gameStore.getState().chests.glade);
  npc = new NPC();
  rupees = [
    new Collectible("path-1", -4.6, 3),
    new Collectible("path-2", -1.3, 2.6),
    new Collectible("path-3", 1.8, 0.6),
    new Collectible("path-4", 4.1, -1.8),
  ];
  water: THREE.Mesh;
  private sparkles: {
    object: THREE.Group;
    velocity: THREE.Vector3;
    life: number;
  }[] = [];
  private burstShown = { ...gameStore.getState().chests };
  constructor() {
    buildSouthGlade(this.root, this.collision);
    this.southChest.root.position.set(3.5, 0, 23);
    this.root.add(this.southChest.root, this.bokoblin.root);
    this.collision.dynamic = gameStore.getState().bridgeUnlocked
      ? []
      : [{ x: 0, z: 7.9, halfX: 1.5, halfZ: 0.35 }];
    const grass = material("#94bd64"),
      earth = material("#b28c5b"),
      soil = material("#8b7050"),
      path = material("#ead0a0");
    // A bevelled, solid base gives the landscape a handmade model appearance.
    const shape = new THREE.Shape();
    shape.moveTo(-10.5, -8);
    shape.lineTo(10.5, -8);
    shape.quadraticCurveTo(11.5, -8, 11.5, -7);
    shape.lineTo(11.5, 7);
    shape.quadraticCurveTo(11.5, 8, 10.5, 8);
    shape.lineTo(-10.5, 8);
    shape.quadraticCurveTo(-11.5, 8, -11.5, 7);
    shape.lineTo(-11.5, -7);
    shape.quadraticCurveTo(-11.5, -8, -10.5, -8);
    const baseGeometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.75,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.25,
      bevelThickness: 0.2,
    });
    baseGeometry.rotateX(-Math.PI / 2);
    mesh(baseGeometry, earth, this.root, 0, -1.0);
    const grassGeometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.1,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.18,
      bevelThickness: 0.08,
    });
    grassGeometry.rotateX(-Math.PI / 2);
    mesh(grassGeometry, grass, this.root, 0, -0.13);
    box(this.root, soil, 0, -0.95, 0, 21, 0.3, 14.7);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-7, 0.08, -0.5),
      new THREE.Vector3(-6, 0.08, 2.7),
      new THREE.Vector3(-3, 0.08, 3.1),
      new THREE.Vector3(0, 0.08, 2),
      new THREE.Vector3(2, 0.08, 0.4),
      new THREE.Vector3(4, 0.08, -1.6),
      new THREE.Vector3(5.6, 0.08, -3.8),
    ]);
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
    const pathMesh = mesh(pathGeometry, path, this.root);
    pathMesh.castShadow = false;
    // A compact castle stays inside the original building's collision footprint.
    const castle = new THREE.Group();
    castle.name = "castle";
    castle.position.set(-7, 0, -2);
    this.root.add(castle);
    const stone = material("#c4c6c4"),
      trim = material("#e1dfd2"),
      mortar = material("#a2aaa8"),
      roof = material("#667aa5"),
      gold = material("#e9bc5b"),
      banner = material("#b375ad"),
      window = material("#4b6573");
    box(castle, stone, 0, 1.25, 0, 2.5, 2.5, 2.3);
    box(castle, mortar, 0, 0.13, 0, 3.15, 0.26, 2.75);
    box(castle, trim, 0, 2.42, 0, 2.6, 0.16, 2.4);
    for (let row = 0; row < 5; row++) {
      const y = 0.4 + row * 0.41;
      box(castle, mortar, 0, y, 1.156, 2.5, 0.025, 0.012);
      box(castle, mortar, 1.256, y, 0, 0.012, 0.025, 2.3);
      for (let col = 0; col < 3; col++) {
        const offset = -0.85 + col * 0.78 + (row % 2) * 0.3;
        box(castle, mortar, offset, y + 0.2, 1.156, 0.025, 0.38, 0.012);
        box(castle, mortar, 1.256, y + 0.2, offset, 0.012, 0.38, 0.025);
      }
    }
    for (const side of [-1, 1]) {
      for (let i = 0; i < 5; i++) {
        box(castle, trim, -1.1 + i * 0.55, 2.68, side * 1.08, 0.3, 0.42, 0.28);
        box(castle, trim, side * 1.1, 2.68, -0.55 + i * 0.28, 0.28, 0.42, 0.17);
      }
      // Round corner towers and open battlements.
      mesh(
        new THREE.CylinderGeometry(0.39, 0.43, 3.05, 12),
        stone,
        castle,
        side * 1.13,
        1.525,
        0.94,
      );
      mesh(
        new THREE.CylinderGeometry(0.45, 0.4, 0.18, 12),
        trim,
        castle,
        side * 1.13,
        3.03,
        0.94,
      );
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const merlon = box(
          castle,
          trim,
          side * 1.13 + Math.cos(angle) * 0.35,
          3.24,
          0.94 + Math.sin(angle) * 0.35,
          0.2,
          0.32,
          0.19,
        );
        merlon.rotation.y = -angle;
      }
      box(castle, window, side * 1.13, 2.14, 1.338, 0.13, 0.52, 0.025);
      const pennant = silhouette(castle, banner, [
        [-0.17, 0],
        [-0.17, -0.58],
        [0, -0.73],
        [0.17, -0.58],
        [0.17, 0],
      ]);
      pennant.position.set(side * 0.78, 2.23, 1.18);
      box(castle, gold, side * 0.78, 2.24, 1.21, 0.42, 0.055, 0.07);
    }
    // Rounded arch with a wooden, iron-banded gate.
    const arch = new THREE.Shape();
    arch.moveTo(-0.54, 0.16);
    arch.lineTo(-0.54, 1.22);
    arch.absarc(0, 1.22, 0.54, Math.PI, 0, true);
    arch.lineTo(0.54, 0.16);
    arch.closePath();
    mesh(
      new THREE.ExtrudeGeometry(arch, {
        depth: 0.07,
        bevelEnabled: false,
        curveSegments: 8,
      }),
      trim,
      castle,
      0,
      0,
      1.16,
    );
    const gate = mesh(
      new THREE.ShapeGeometry(arch, 8),
      material("#80563b"),
      castle,
      0,
      0.035,
      1.24,
    );
    gate.scale.set(0.78, 0.89, 1);
    for (const x of [-0.25, 0, 0.25])
      box(castle, mortar, x, 0.65, 1.25, 0.025, 1.06, 0.02);
    for (const y of [0.42, 0.98])
      box(castle, material("#434b51"), 0, y, 1.27, 0.8, 0.065, 0.035);
    ball(castle, gold, 0.22, 0.73, 1.29, 0.055);
    // Rear keep, steep slate roof and a royal flag above the battlements.
    box(castle, stone, 0, 2.7, -0.34, 1.3, 1.35, 1.3);
    box(castle, trim, 0, 3.31, -0.34, 1.4, 0.14, 1.4);
    const spire = mesh(
      new THREE.ConeGeometry(1.1, 1.05, 4),
      roof,
      castle,
      0,
      3.88,
      -0.34,
    );
    spire.rotation.y = Math.PI / 4;
    box(castle, window, 0, 2.98, 0.321, 0.25, 0.46, 0.025);
    mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.67, 6),
      gold,
      castle,
      0,
      4.6,
      -0.34,
    );
    const flag = silhouette(
      castle,
      banner,
      [
        [0, 0],
        [0.64, -0.04],
        [0.48, -0.2],
        [0.64, -0.36],
        [0, -0.32],
      ],
      0.025,
    );
    flag.position.set(0, 4.91, -0.34);
    this.collision.add(-7, -2, 1.6, 1.4);
    const trunk = material("#8e7250");
    const greens = ["#5c9460", "#6fa45e", "#80ab60"];
    const treePositions = [
      [-9, -5, 1.1],
      [-5.3, -5.5, 1.2],
      [-2.6, -6, 1],
      [0, -6.5, 1.15],
      [3, -6.6, 1],
      [8, -5.8, 1.3],
      [9.3, -2.8, 1.1],
      [-9.3, 1.7, 1],
      [-9.4, 5.5, 1.1],
      [-6.8, 6.5, 0.9],
      [-2.8, 6.5, 1.1],
      [2.6, 6.5, 1],
      [9, 5.8, 1.1],
      [10, 0, 0.8],
    ];
    treePositions.forEach(([x, z, s], i) => {
      const t = new THREE.Group();
      t.position.set(x, 0, z);
      t.scale.setScalar(s);
      this.root.add(t);
      mesh(new THREE.CylinderGeometry(0.17, 0.27, 1.65, 7), trunk, t, 0, 0.8);
      const leaf = material(greens[i % 3]);
      ball(t, leaf, 0, 2, 0, 0.99, 1.03, 0.95);
      ball(t, leaf, -0.5, 1.85, 0.08, 0.58, 0.7, 0.65);
      ball(t, leaf, 0.5, 2, 0.02, 0.6, 0.75, 0.65);
      ball(t, leaf, 0.1, 2.6, 0, 0.66, 0.65, 0.65);
      this.collision.add(x, z, 0.26 * s);
    });
    const rocks = [
      [-10, 3.5, 0.5],
      [-1.1, -4.4, 0.65],
      [7.9, -0.5, 0.45],
      [0.5, 5.7, 0.4],
      [8, 6.7, 0.5],
      [-4.3, -5.6, 0.4],
    ];
    rocks.forEach(([x, z, s]) => {
      const rock = mesh(
        new THREE.DodecahedronGeometry(s, 0),
        material("#a5aea2"),
        this.root,
        x,
        s * 0.6,
        z,
      );
      rock.scale.set(1.25, 0.8, 0.9);
      rock.rotation.set(0.2, x, 0.1);
      this.collision.add(x, z, s * 0.85);
    });
    [
      [-4, -1.4],
      [1, -4.9],
      [7.5, -4.5],
      [-8, 4.7],
      [2.5, 4.8],
      [9, 3.8],
    ].forEach(([x, z], i) => {
      const bush = material("#71994f");
      ball(this.root, bush, x, 0.38, z, 0.62, 0.5, 0.6);
      ball(this.root, bush, x + 0.38, 0.28, z + 0.1, 0.37);
      this.collision.add(x, z, 0.55, 0.45);
      for (let j = 0; j < 3; j++)
        ball(
          this.root,
          material(i % 2 ? "#d88973" : "#eebd78"),
          x - 0.25 + j * 0.22,
          0.73,
          z + 0.1,
          0.065,
        );
    });
    // Pond with a sandy rim, shallow turquoise water and lily pads.
    const shore = mesh(
      new THREE.CylinderGeometry(1, 1, 0.12, 32),
      material("#d9cba0"),
      this.root,
      6.7,
      0.025,
      3.1,
    );
    shore.scale.set(2.25, 1, 1.7);
    this.water = mesh(
      new THREE.CylinderGeometry(1, 1, 0.06, 40),
      material("#75bdb9", 0.22),
      this.root,
      6.7,
      0.1,
      3.1,
    );
    this.water.scale.set(2.05, 1, 1.5);
    this.water.castShadow = false;
    this.collision.addEllipse(6.7, 3.1, 2.2, 1.65);
    for (const [x, z] of [
      [5.7, 3.3],
      [7.5, 2.8],
      [7.1, 4],
    ]) {
      const lily = mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 0.08, 12),
        material("#6caa75"),
        this.root,
        x,
        0.15,
        z,
      );
      lily.castShadow = false;
      ball(this.root, material("#fff0d5"), x, 0.2, z, 0.065, 0.07, 0.065);
    }
    const fence = material("#eee1b8");
    for (let i = 0; i < 5; i++) {
      box(this.root, fence, -10 + i * 0.7, 0.43, -0.05, 0.13, 0.86, 0.13);
    }
    box(this.root, fence, -8.6, 0.5, -0.05, 2.9, 0.13, 0.12);
    this.collision.add(-8.6, -0.05, 1.5, 0.08);
    // Small stepping stones and a sign establish the route.
    const sign = new THREE.Group();
    sign.position.set(-0.7, 0, 0.6);
    this.root.add(sign);
    box(sign, trunk, 0, 0.45, 0, 0.1, 0.9, 0.1);
    box(sign, material("#d3aa70"), 0, 0.89, 0, 0.7, 0.36, 0.11);
    const arrow = box(
      sign,
      material("#775d3a"),
      0,
      0.89,
      0.061,
      0.35,
      0.045,
      0.025,
    );
    arrow.rotation.z = 0.2;
    for (const r of [-0.65, 0.65]) {
      const tip = box(
        sign,
        material("#775d3a"),
        0.14,
        0.91 + r * 0.07,
        0.065,
        0.16,
        0.04,
        0.025,
      );
      tip.rotation.z = r;
    }
    DUNGEONS.forEach((d) => {
      portal(this.root, d.entrance.x, d.entrance.z, d.theme, true);
      for (const side of [-1, 1])
        this.collision.add(
          d.entrance.x + side * 0.95,
          d.entrance.z,
          0.25,
          0.28,
        );
      for (let i = 0; i < 4; i++)
        box(
          this.root,
          path,
          d.entrance.x,
          0.05,
          d.entrance.z + 0.9 + i * 0.72,
          1.1,
          0.06,
          0.5,
        );
    });
    // Deterministic scattered flowers and grass, never on the main path.
    let seed = 19;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const stem = material("#6c984f"),
      petals = [material("#fff4d1"), material("#e8aaa1"), material("#d8c4e5")];
    for (let i = 0; i < 145; i++) {
      const x = random() * 21 - 10.5,
        z = random() * 14.7 - 7.35;
      if (
        !this.collision.free(x, z, 0.3) ||
        points.some((p) => Math.hypot(p.x - x, p.z - z) < 1.1)
      )
        continue;
      if (i % 3 === 0) {
        mesh(
          new THREE.CylinderGeometry(0.018, 0.022, 0.2, 4),
          stem,
          this.root,
          x,
          0.1,
          z,
        );
        const petal = petals[i % petals.length];
        for (let j = 0; j < 4; j++)
          ball(
            this.root,
            petal,
            x + Math.cos((j * Math.PI) / 2) * 0.055,
            0.22,
            z + Math.sin((j * Math.PI) / 2) * 0.055,
            0.055,
            0.08,
            0.055,
          );
        ball(this.root, material("#e8bf5e"), x, 0.24, z, 0.03);
      } else {
        const tuft = mesh(
          new THREE.ConeGeometry(0.06, 0.19, 3),
          stem,
          this.root,
          x,
          0.075,
          z,
        );
        tuft.rotation.z = 0.2;
      }
    }
    // The treasure has its own little stone clearing.
    const clearing = mesh(
      new THREE.CylinderGeometry(1.35, 1.4, 0.06, 16),
      material("#c5c493"),
      this.root,
      5.6,
      0.03,
      -3.7,
    );
    clearing.castShadow = false;
    this.root.add(
      this.chest.root,
      this.npc.root,
      ...this.rupees.map((rupee) => rupee.root),
    );
    this.collision.add(5.6, -3.7, 0.56, 0.41);
    this.collision.add(-3.5, 1.3, 0.3);
  }
  update(dt: number, time: number) {
    const state = gameStore.getState();
    this.collision.dynamic = state.bridgeUnlocked
      ? []
      : [{ x: 0, z: 7.9, halfX: 1.5, halfZ: 0.35 }];
    this.bokoblin.update(dt, state.bridgeUnlocked, !!state.overlay);
    this.southChest.update(
      dt,
      state.chests.south &&
        !(state.activeChest === "south" && state.overlay === "quiz"),
    );
    this.chest.update(dt, state.chests.glade && state.feedback !== "correct");
    this.npc.update(time);
    this.rupees.forEach((rupee) =>
      rupee.update(time, state.collected.includes(rupee.id)),
    );
    for (const id of ["glade", "south"] as const) {
      if (!state.chests[id]) this.burstShown[id] = false;
      if (!state.chests[id] || state.overlay || this.burstShown[id]) continue;
      this.burstShown[id] = true;
      const position = (id === "glade" ? this.chest : this.southChest).root
        .position;
      for (let i = 0; i < 9; i++) {
        const c = new Collectible("reward", position.x, position.z);
        c.root.position.y = 0.8;
        this.root.add(c.root);
        const angle = (i / 9) * Math.PI * 2;
        this.sparkles.push({
          object: c.root,
          velocity: new THREE.Vector3(
            Math.cos(angle) * 1.2,
            3.2 + (i % 3) * 0.3,
            Math.sin(angle) * 1.2,
          ),
          life: 1.5,
        });
      }
    }
    this.sparkles = this.sparkles.filter((p) => {
      p.life -= dt;
      p.velocity.y -= dt * 4;
      p.object.position.addScaledVector(p.velocity, dt);
      p.object.rotation.y += dt * 6;
      p.object.scale.setScalar(Math.min(1, p.life * 2));
      if (p.life <= 0) {
        this.root.remove(p.object);
        p.object.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            o.geometry.dispose();
            (o.material as THREE.Material).dispose();
          }
        });
        return false;
      }
      return true;
    });
  }
}
