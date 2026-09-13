import { WATER_ENTRY } from "./layout";
import * as THREE from "three";
import { portal, wave } from "../dungeons/models";
import { SeaModels } from "./scenery";
import type { CollisionSystem, Obstacle } from "../CollisionSystem";

export function basaltMouth(
  root: THREE.Group,
  collision: CollisionSystem,
  m: SeaModels,
) {
  const group = new THREE.Group();
  group.name = "submerged-volcano-mouth";
  group.position.set(WATER_ENTRY.x, 0, WATER_ENTRY.z);
  group.rotation.y = WATER_ENTRY.rotation;
  root.add(group);
  const dark = new THREE.MeshStandardMaterial({
    color: "#33444c",
    roughness: 1,
  });
  for (let i = 0; i < 9; i++) {
    const a = (i / 8) * Math.PI;
    const stone = m.put(
      group,
      m.stone,
      dark,
      Math.cos(a) * 1.4,
      Math.sin(a) * 1.65 + 0.35,
      0,
      0.55,
      0.65,
      0.65,
    );
    stone.rotation.z = a;
    stone.castShadow = true;
  }
  for (const side of [-1, 1]) {
    collision.add(WATER_ENTRY.x, WATER_ENTRY.z - side * 1.5, 0.6, 0.45);
    // Deep shoulders join the arch to the surrounding reef instead of forming a freestanding hoop.
    for (let i = 0; i < 3; i++) {
      const x = side * (1.85 + i * 0.65),
        z = -0.7 - i * 0.25;
      const rock = m.put(
        group,
        m.stone,
        dark,
        x,
        0.75,
        z,
        0.9,
        1.5 + i * 0.15,
        1.1,
      );
      rock.castShadow = true;
      collision.addEllipse(WATER_ENTRY.x + z, WATER_ENTRY.z - x, 0.85, 0.75);
    }
  }
  m.put(group, m.stone, dark, 0, 2.55, -0.85, 1.5, 0.8, 1.3).castShadow = true;
  const opening = new THREE.Shape();
  opening.moveTo(-0.95, 0);
  opening.lineTo(-0.95, 0.85);
  opening.absarc(0, 0.85, 0.95, Math.PI, 0, true);
  opening.lineTo(0.95, 0);
  opening.closePath();
  const surface = new THREE.Mesh(
    new THREE.ShapeGeometry(opening),
    new THREE.MeshBasicMaterial({ color: "#443e42", side: THREE.DoubleSide }),
  );
  surface.position.z = -0.08;
  group.add(surface);
  const ember = new THREE.MeshStandardMaterial({
    color: "#e9a36e",
    emissive: "#cc652e",
    emissiveIntensity: 0.5,
  });
  for (let i = 0; i < 4; i++)
    m.limb(
      group,
      ember,
      [-0.45 + i * 0.3, 0.07, 0.04],
      [-0.34 + i * 0.28, 0.2, 0.05],
      0.024,
    );
  m.coral(group, -2.1, 0.3, 0.75, 0, m.palette.violet);
}

export function waterTemple(
  root: THREE.Group,
  collision: CollisionSystem,
  m: SeaModels,
) {
  const g = new THREE.Group();
  g.name = "sunken-wave-temple";
  g.position.set(5, 0, 6);
  root.add(g);
  portal(g, 0, 0, "water", true);
  const stone = new THREE.MeshStandardMaterial({
    color: "#82b3b5",
    roughness: 0.9,
  });
  const trim = new THREE.MeshStandardMaterial({
    color: "#b6d9cd",
    roughness: 0.85,
  });
  const box = new THREE.BoxGeometry(1, 1, 1);
  for (const side of [-1, 1]) {
    const x = side * 1.65;
    m.put(g, box, stone, x, 1.05, -0.5, 0.7, 2.1, 1);
    m.put(g, box, trim, x, 2.1, -0.5, 0.95, 0.22, 1.15);
    m.put(g, box, trim, x, 0.12, -0.5, 0.95, 0.24, 1.2);
    for (const dx of [-0.18, 0.18])
      m.put(g, box, trim, x + dx, 1.1, 0.015, 0.06, 1.65, 0.07);
    collision.add(5 + x, 5.5, 0.42, 0.58);
    collision.add(5 + side * 0.95, 6, 0.25, 0.28);
    m.coral(
      g,
      x + side * 0.28,
      -0.6,
      0.55,
      side + 1,
      side < 0 ? m.palette.pink : m.palette.orange,
    ).position.y = 2.24;
  }
  m.put(g, box, stone, 0, 2.35, -0.5, 4.3, 0.35, 1.1);
  m.put(g, box, trim, 0, 2.57, -0.5, 4.5, 0.12, 1.2);
  wave(g, trim, 0, 2.4, 0.08, 1.2);
  // A rounded shell crest and fallen masonry make this a submerged ruin.
  const crest = m.shell(g, 0, -0.38, 2.1);
  crest.position.y = 2.8;
  crest.rotation.x = Math.PI / 2;
  m.rock(root, 8.1, 8.6, 0.85, 0.6, 0.5);
  collision.addEllipse(8.1, 8.6, 0.75, 0.45);
  const column = m.put(root, m.branch, stone, 7.9, 0.3, 10.4, 0.32, 2.1, 0.32);
  column.rotation.z = 1.3;
  collision.addEllipse(7.9, 10.4, 1.1, 0.4);
}

export function shellGate(
  root: THREE.Group,
  collision: CollisionSystem,
  m: SeaModels,
) {
  const group = new THREE.Group();
  group.name = "great-shell-gate";
  root.add(group);
  const shell = new THREE.MeshStandardMaterial({
    color: "#d9b6b7",
    roughness: 0.7,
  });
  const lining = new THREE.MeshStandardMaterial({
    color: "#f4d8bd",
    roughness: 0.55,
  });
  const doors: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    m.rock(root, side * 2.9, -0.7, 0.7, 1.7, 0.7);
    collision.addEllipse(side * 2.9, -0.7, 0.65, 0.65);
    const door = new THREE.Group();
    door.userData.side = side;
    door.position.x = side * 1.75;
    const panel = new THREE.Group();
    panel.position.x = -side * 1.75;
    door.add(panel);
    // Hinged leaves turn into clear side bays, remaining attached to their supports.
    m.put(group, m.branch, lining, side * 1.75, 1.45, -0.06, 0.11, 2.9, 0.11);
    collision.add(side * 1.75, 0, 0.14, 0.18);
    group.add(door);
    doors.push(door);
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.12);
    shape.lineTo(0, 2.95);
    shape.bezierCurveTo(side * 0.35, 3.25, side * 1.7, 2.55, side * 1.65, 1.8);
    shape.bezierCurveTo(side * 1.95, 1.3, side * 1.25, 0.3, 0, 0.12);
    shape.closePath();
    const plate = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.16,
        bevelEnabled: true,
        bevelSize: 0.08,
        bevelThickness: 0.06,
        bevelSegments: 1,
      }),
      shell,
    );
    panel.add(plate);
    for (let i = 0; i < 6; i++) {
      const angle = 0.08 + i * 0.22,
        length = 2.8 - i * 0.16;
      const end = [
        side * Math.sin(angle) * length * 0.65,
        0.16 + Math.cos(angle) * length,
        0.2,
      ];
      m.limb(panel, lining, [side * 0.05, 0.18, 0.23], end, 0.04);
    }
  }
  const inside = new THREE.Mesh(
    new THREE.PlaneGeometry(2.8, 2.6),
    new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      vertexShader: `varying vec2 uvPortal; void main(){uvPortal=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `varying vec2 uvPortal; void main(){
        vec2 p=(uvPortal-vec2(0.5,0.42))*vec2(2.0,1.5);
        float glow=1.0-smoothstep(0.15,0.95,length(p));
        gl_FragColor=vec4(0.95,0.80,0.51,glow*0.4);
      }`,
    }),
  );
  inside.position.set(0, 1.15, -0.2);
  group.add(inside);
  const pearl = m.put(group, m.sphere, m.palette.pearl, 0, 0.28, 0.35, 0.2);
  let previousProgress = -1;
  let obstacles: Obstacle[] = [];
  return {
    group,
    update(progress: number) {
      if (progress === previousProgress) return obstacles;
      previousProgress = progress;
      doors.forEach((door) => {
        const side = door.userData.side as number;
        door.rotation.y = (side * progress * Math.PI) / 2;
      });
      pearl.scale.setScalar(0.2 * (1 - progress));
      inside.visible = progress > 0;
      group.updateMatrixWorld(true);
      obstacles = doors.map((door) => {
        const bounds = new THREE.Box3().setFromObject(door);
        return {
          x: (bounds.min.x + bounds.max.x) / 2,
          z: (bounds.min.z + bounds.max.z) / 2,
          halfX: (bounds.max.x - bounds.min.x) / 2,
          halfZ: (bounds.max.z - bounds.min.z) / 2,
        };
      });
      return obstacles;
    },
  };
}

export function seaLife(root: THREE.Group, m: SeaModels) {
  const fishes: {
    root: THREE.Group;
    tail: THREE.Mesh;
    shoal: number;
    phase: number;
  }[] = [];
  const tailGeometry = new THREE.ConeGeometry(0.15, 0.25, 3);
  const eye = new THREE.MeshBasicMaterial({ color: "#163c52" });
  for (let shoal = 0; shoal < 3; shoal++)
    for (let i = 0; i < 4; i++) {
      const fish = new THREE.Group();
      root.add(fish);
      const color = [m.palette.orange, m.palette.teal, m.palette.pink][shoal];
      m.put(fish, m.sphere, color, 0, 0, 0, 0.24, 0.12, 0.08);
      const tail = m.put(fish, tailGeometry, color, -0.29, 0, 0);
      tail.rotation.z = -Math.PI / 2;
      for (const z of [-0.065, 0.065])
        m.put(fish, m.sphere, eye, 0.13, 0.025, z, 0.022);
      fishes.push({ root: fish, tail, shoal, phase: i * 0.3 });
    }
  const bubbles = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 6, 4),
    new THREE.MeshBasicMaterial({
      color: "#b7e8e9",
      transparent: true,
      opacity: 0.26,
      depthWrite: false,
    }),
    20,
  );
  root.add(bubbles);
  const transform = new THREE.Object3D();
  return (time: number) => {
    for (const f of fishes) {
      const a = time * 0.19 + f.phase;
      f.root.position.set(
        (f.shoal - 1) * 6 + Math.cos(a) * 1.7,
        1.25 + f.shoal * 0.25 + Math.sin(a * 1.3) * 0.3,
        5 + f.shoal * 6 + Math.sin(a) * 1.2,
      );
      f.root.rotation.y = Math.atan2(-Math.cos(a) * 1.2, -Math.sin(a) * 1.7);
      f.tail.rotation.y = Math.sin(time * 6 + f.phase) * 0.28;
    }
    for (let i = 0; i < 20; i++) {
      const y = (time * 0.24 + i * 0.43) % 5;
      transform.position.set(
        Math.sin(i * 7.1) * 7.5 + Math.sin(time * 0.5 + i) * 0.1,
        y,
        2 + ((i * 7.3) % 20),
      );
      transform.scale.setScalar(0.028 + (i % 4) * 0.014);
      transform.updateMatrix();
      bubbles.setMatrixAt(i, transform.matrix);
    }
    bubbles.instanceMatrix.needsUpdate = true;
  };
}
