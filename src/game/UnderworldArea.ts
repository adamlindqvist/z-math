import * as THREE from "three";
import { type Area, type Passage, disposeTree } from "./Area";
import { CollisionSystem } from "./CollisionSystem";
import { material, mesh } from "./models";
import { UNDERWORLD_RETURN } from "./underworld/layout";
import { Ganondorf } from "./entities/Ganondorf";

/** A quiet cavern to explore: broad paths, luminous roots and no hazards. */
export class UnderworldArea implements Area {
  root = new THREE.Group();
  collision = new CollisionSystem(15, 19, -7);
  spawn = { x: 0, z: 4 };
  cameraMode = "follow" as const;
  rupees = [];
  environment = {
    background: "#081b20",
    sky: "#91c6cb",
    ground: "#24474b",
    ambientIntensity: 1.15,
    sun: "#a6e1d8",
    sunIntensity: 1.3,
    fog: { color: "#081b20", density: 0.027 },
  };
  private motes: THREE.InstancedMesh;
  private ganondorf = new Ganondorf();
  private dummy = new THREE.Object3D();
  private glow = new THREE.MeshStandardMaterial({
    color: "#95e7d6",
    emissive: "#49d7c0",
    emissiveIntensity: 1.4,
  });
  constructor() {
    this.root.name = "underworld";
    this.ganondorf.root.position.set(0, 0, -22);
    const bossScale = 1.4;
    this.ganondorf.root.scale.setScalar(bossScale);
    this.root.add(this.ganondorf.root);
    this.collision.addEllipse(0, -22, 0.85 * bossScale, 0.7 * bossScale);
    const stone = material("#284549"),
      bark = material("#365951");
    const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
    const floor = new THREE.PlaneGeometry(38, 46, 38, 46);
    floor.rotateX(-Math.PI / 2);
    floor.translate(0, -0.04, -7);
    const colors: number[] = [];
    const dark = new THREE.Color("#203b42"),
      light = new THREE.Color("#56817b");
    for (let i = 0; i < floor.attributes.position.count; i++) {
      const x = floor.attributes.position.getX(i),
        z = floor.attributes.position.getZ(i);
      const path = Math.exp(-Math.pow((x - Math.sin(z * 0.23) * 2.3) / 2.3, 2));
      const color = dark
        .clone()
        .lerp(light, 0.15 + path * 0.65 + Math.sin(x * 2 + z) * 0.06);
      colors.push(color.r, color.g, color.b);
    }
    floor.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    mesh(
      floor,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }),
      this.root,
    );
    // Low foreground walls preserve the camera's view; tall rear cliffs enclose the cavern.
    const walls = new THREE.InstancedMesh(rockGeometry, stone, 88);
    for (let i = 0; i < 88; i++) {
      const side = i % 4,
        n = Math.floor(i / 4);
      const x = side < 2 ? (side ? 15 : -15) : -15 + (n * 30) / 21;
      const z = side < 2 ? -26 + (n * 38) / 21 : side === 2 ? -26 : 12;
      const h = z > 8 ? 1.1 : 4.5 + Math.sin(i * 2) * 1.2;
      this.dummy.position.set(x, h * 0.45, z);
      this.dummy.scale.set(1.9, h * 0.65, 1.6);
      this.dummy.rotation.set(0.1, i * 1.7, 0.12);
      this.dummy.updateMatrix();
      walls.setMatrixAt(i, this.dummy.matrix);
      this.collision.addEllipse(x, z, 1.5, 1.2);
    }
    walls.receiveShadow = true;
    this.root.add(walls);
    // Huge twisted roots frame open clearings, with tiered mushroom shelves.
    for (const [i, [x, z, height]] of [
      [-8, 1, 7],
      [8, -5, 8],
      [-7, -12, 9],
      [6, -19, 10],
      [-10, -22, 8],
    ].entries()) {
      const points = [
        new THREE.Vector3(x, 0, z),
        new THREE.Vector3(x + 0.6, height * 0.35, z - 0.2),
        new THREE.Vector3(x - 0.9, height * 0.7, z),
        new THREE.Vector3(x + 0.2, height, z - 1),
      ];
      mesh(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3(points),
          14,
          0.65,
          7,
          false,
        ),
        bark,
        this.root,
      );
      this.collision.addEllipse(x, z, 1.1, 1.1);
      for (let j = 0; j < 4; j++) {
        const a = (j * Math.PI) / 2 + i;
        const end = new THREE.Vector3(
          x + Math.cos(a) * 2,
          0.03,
          z + Math.sin(a) * 2,
        );
        const root = new THREE.CatmullRomCurve3([
          new THREE.Vector3(x, 0.7, z),
          new THREE.Vector3(x + Math.cos(a), 0.18, z + Math.sin(a)),
          end,
        ]);
        mesh(new THREE.TubeGeometry(root, 6, 0.17, 5, false), bark, this.root);
      }
      for (let j = 0; j < 3; j++) {
        const shelf = mesh(
          new THREE.SphereGeometry(1, 12, 6),
          j === 1 ? this.glow : material("#477d7b"),
          this.root,
          x + (j % 2 ? -0.7 : 0.7),
          1.9 + j * 1.35,
          z,
        );
        shelf.scale.set(1.15, 0.14, 0.85);
      }
      const boulder = mesh(rockGeometry, stone, this.root, x, 0.35, z);
      boulder.scale.set(1.1, 0.6, 1.1);
    }
    // Small blue grasses and luminous mushrooms share geometry and draw calls.
    const grass = new THREE.InstancedMesh(
      new THREE.ConeGeometry(0.055, 0.48, 3),
      material("#518aab"),
      260,
    );
    const caps = new THREE.InstancedMesh(
      new THREE.SphereGeometry(1, 8, 5),
      this.glow,
      65,
    );
    for (let i = 0; i < 260; i++) {
      const x = Math.sin(i * 7.31) * 11,
        z = -23 + ((i * 3.17) % 32);
      this.dummy.position.set(x, 0.2, z);
      this.dummy.rotation.set(0, i, Math.sin(i) * 0.2);
      this.dummy.scale.setScalar(0.6 + (i % 4) * 0.2);
      this.dummy.updateMatrix();
      grass.setMatrixAt(i, this.dummy.matrix);
      if (i < 65) {
        this.dummy.position.y = 0.28;
        this.dummy.scale.set(0.18, 0.1, 0.18);
        this.dummy.updateMatrix();
        caps.setMatrixAt(i, this.dummy.matrix);
      }
    }
    this.root.add(grass, caps);
    // A golden root arch is the only exit and can be walked through from either side.
    const arch = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.2, 0, 7.4),
      new THREE.Vector3(-1.1, 2.2, 7.4),
      new THREE.Vector3(0, 2.9, 7.4),
      new THREE.Vector3(1.1, 2.2, 7.4),
      new THREE.Vector3(1.2, 0, 7.4),
    ]);
    const gold = new THREE.MeshStandardMaterial({
      color: "#ffe3a0",
      emissive: "#d8a753",
      emissiveIntensity: 0.9,
    });
    mesh(new THREE.TubeGeometry(arch, 18, 0.17, 7, false), gold, this.root);
    for (const x of [-1.2, 1.2]) this.collision.add(x, 7.4, 0.18);
    const portal = mesh(
      new THREE.CircleGeometry(1, 24),
      new THREE.MeshBasicMaterial({
        color: "#ffe8ac",
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      this.root,
      0,
      1.3,
      7.4,
    );
    portal.scale.set(1, 1.35, 1);
    // An upward arrow communicates the return without needing to read.
    mesh(new THREE.ConeGeometry(0.25, 0.4, 3), gold, this.root, 0, 2.05, 7.4);
    mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.6, 6),
      gold,
      this.root,
      0,
      1.65,
      7.4,
    );
    const pool = mesh(
      new THREE.CircleGeometry(1.9, 32),
      material("#547d75"),
      this.root,
      0,
      0.005,
      4,
    );
    pool.rotation.x = -Math.PI / 2;
    const landing = mesh(
      new THREE.TorusGeometry(1.8, 0.035, 4, 40),
      this.glow,
      this.root,
      0,
      0.035,
      4,
    );
    landing.rotation.x = Math.PI / 2;
    this.motes = new THREE.InstancedMesh(
      new THREE.OctahedronGeometry(0.045),
      new THREE.MeshBasicMaterial({
        color: "#e4f2f3",
        transparent: true,
        opacity: 0.8,
      }),
      96,
    );
    this.motes.boundingSphere = new THREE.Sphere(
      new THREE.Vector3(0, 2.5, -7),
      25,
    );
    this.root.add(this.motes);
    this.update(0, 0);
  }
  passages(): Passage[] {
    return [{ ...UNDERWORLD_RETURN, destination: { world: "desert" } }];
  }
  interactions() {
    return [];
  }
  update(_dt: number, time: number) {
    this.ganondorf.update(time);
    this.glow.emissiveIntensity = 1.2 + Math.sin(time * 0.8) * 0.15;
    for (let i = 0; i < this.motes.count; i++) {
      // Each speck falls steadily, then reappears above the cavern floor.
      const fall = (time * (0.7 + (i % 5) * 0.12) + i * 0.73) % 5;
      this.dummy.position.set(
        Math.sin(i * 6.7) * 11 + Math.sin(time * 0.2 + i) * 0.2,
        5.1 - fall,
        -23 + ((i * 3.3) % 32),
      );
      this.dummy.scale.set(0.65, 1.5, 0.65);
      this.dummy.updateMatrix();
      this.motes.setMatrixAt(i, this.dummy.matrix);
    }
    this.motes.instanceMatrix.needsUpdate = true;
  }
  dispose() {
    this.root.traverse((o) => {
      if (o instanceof THREE.InstancedMesh) o.dispose();
    });
    disposeTree(this.root);
  }
}
