import * as THREE from "three";
import { pathDistance, WATER_PATHS, WATER_ENTRY } from "./layout";
import type { CollisionSystem } from "../CollisionSystem";

/** Each area owns one palette and a small set of reusable low-poly meshes. */
export class SeaModels {
  sphere = new THREE.IcosahedronGeometry(1, 1);
  branch = new THREE.CylinderGeometry(0.65, 1, 1, 6);
  stone = new THREE.DodecahedronGeometry(1, 0);
  ring = new THREE.TorusGeometry(1, 0.13, 5, 12);
  palette = {
    rock: new THREE.MeshStandardMaterial({ color: "#356773", roughness: 0.93 }),
    cap: new THREE.MeshStandardMaterial({ color: "#579098", roughness: 0.95 }),
    pink: new THREE.MeshStandardMaterial({ color: "#ed849d", roughness: 0.8 }),
    orange: new THREE.MeshStandardMaterial({
      color: "#efac75",
      roughness: 0.8,
    }),
    violet: new THREE.MeshStandardMaterial({
      color: "#998ed8",
      roughness: 0.8,
    }),
    teal: new THREE.MeshStandardMaterial({ color: "#51bdb2", roughness: 0.8 }),
    leaf: new THREE.MeshStandardMaterial({
      color: "#3daca0",
      side: THREE.DoubleSide,
      roughness: 0.85,
    }),
    ivory: new THREE.MeshStandardMaterial({ color: "#e9ddc1", roughness: 0.7 }),
    pearl: new THREE.MeshStandardMaterial({
      color: "#f6e7d6",
      emissive: "#6aaba9",
      emissiveIntensity: 0.3,
      roughness: 0.2,
    }),
  };
  put(
    parent: THREE.Object3D,
    geometry: THREE.BufferGeometry,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    sx = 1,
    sy = sx,
    sz = sx,
  ) {
    const m = new THREE.Mesh(geometry, mat);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    parent.add(m);
    return m;
  }
  limb(
    parent: THREE.Object3D,
    mat: THREE.Material,
    a: number[],
    b: number[],
    width: number,
  ) {
    const from = new THREE.Vector3(...a),
      to = new THREE.Vector3(...b),
      delta = to.sub(from);
    const m = this.put(
      parent,
      this.branch,
      mat,
      a[0] + delta.x / 2,
      a[1] + delta.y / 2,
      a[2] + delta.z / 2,
      width,
      delta.length(),
      width,
    );
    m.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      delta.normalize(),
    );
    return m;
  }
  rock(
    parent: THREE.Object3D,
    x: number,
    z: number,
    width: number,
    height: number,
    depth = width,
  ) {
    const m = this.put(
      parent,
      this.stone,
      this.palette.rock,
      x,
      height * 0.34 - 0.14,
      z,
      width,
      height,
      depth,
    );
    m.rotation.set(0.08 * Math.sin(x), x * 0.3, 0.13 * Math.cos(z));
    m.receiveShadow = true;
    m.castShadow = height > 1;
    this.put(
      parent,
      this.sphere,
      this.palette.cap,
      x - width * 0.12,
      height * 0.92 - 0.15,
      z,
      width * 0.66,
      height * 0.09,
      depth * 0.62,
    );
    return m;
  }
  coral(
    parent: THREE.Object3D,
    x: number,
    z: number,
    size: number,
    kind: number,
    mat: THREE.Material,
  ) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.scale.setScalar(size);
    g.rotation.y = x * 2.1 + z;
    parent.add(g);
    if (kind % 3 === 0) {
      // Broad, branching fans have recognisable silhouettes from the game camera.
      this.limb(g, mat, [0, 0, 0], [0, 1.1, 0], 0.08);
      for (const side of [-1, 1])
        for (let i = 0; i < 3; i++) {
          const a = [0, 0.2 + i * 0.22, 0],
            b = [side * (0.5 - i * 0.08), 0.55 + i * 0.28, 0.1];
          this.limb(g, mat, a, b, 0.065);
          this.limb(g, mat, b, [b[0] + side * 0.08, b[1] + 0.25, 0.05], 0.05);
        }
    } else if (kind % 3 === 1) {
      for (let i = 0; i < 6; i++) {
        const a = i * 2.4;
        this.put(
          g,
          this.sphere,
          mat,
          Math.cos(a) * 0.35,
          0.2 + i * 0.07,
          Math.sin(a) * 0.3,
          0.34,
          0.28,
          0.32,
        );
      }
    } else {
      for (let i = 0; i < 3; i++) {
        const h = 0.4 + i * 0.23,
          x = (i - 1) * 0.28;
        this.put(g, this.branch, mat, x, h / 2, i * 0.12, 0.16, h, 0.16);
        const lip = this.put(g, this.ring, mat, x, h, i * 0.12, 0.12);
        lip.rotation.x = Math.PI / 2;
      }
    }
    return g;
  }
  shell(parent: THREE.Object3D, x: number, z: number, scale = 1) {
    const g = new THREE.Group();
    g.position.set(x, 0.1, z);
    g.scale.setScalar(scale);
    parent.add(g);
    for (let i = -3; i <= 3; i++) {
      const rib = this.put(
        g,
        this.sphere,
        this.palette.ivory,
        i * 0.1,
        0.03,
        Math.abs(i) * 0.035,
        0.085,
        0.075,
        0.32 - Math.abs(i) * 0.026,
      );
      rib.rotation.y = i * -0.13;
    }
    return g;
  }
  star(parent: THREE.Object3D, x: number, z: number, size: number) {
    const g = new THREE.Group();
    g.position.set(x, 0.04, z);
    parent.add(g);
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5;
      const arm = this.put(
        g,
        this.sphere,
        this.palette.orange,
        Math.sin(a) * size * 0.23,
        0,
        Math.cos(a) * size * 0.23,
        size * 0.14,
        0.045,
        size * 0.38,
      );
      arm.rotation.y = a;
    }
  }
  /** Palette members not used by a particular random layout must also be released. */
  dispose() {
    for (const g of [this.sphere, this.branch, this.stone, this.ring])
      g.dispose();
    Object.values(this.palette).forEach((m) => m.dispose());
  }
}

export function seabed(root: THREE.Group) {
  // One heightfield owns both the paths and the surrounding seabed. Branches
  // blend by nearest distance, so junctions never stack coplanar triangles.
  const curves = WATER_PATHS.flatMap((points) => {
    const curve = new THREE.CatmullRomCurve3(
      points.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    );
    const pointsOnCurve = curve.getPoints(Math.ceil(curve.getLength() * 5));
    return pointsOnCurve.slice(1).map((b, i) => ({ a: pointsOnCurve[i], b }));
  });
  // Detail is concentrated in the playable area; distant fog needs few vertices.
  const xs = [
    -75,
    -40,
    -25,
    -18,
    ...Array.from({ length: 141 }, (_, i) => -14 + i * 0.2),
    18,
    25,
    40,
    75,
  ];
  const zs = [
    -64,
    -40,
    -20,
    -8,
    ...Array.from({ length: 161 }, (_, i) => -4 + i * 0.2),
    32,
    40,
    55,
    86,
  ];
  const positions: number[] = [],
    colors: number[] = [],
    indices: number[] = [];
  const base = new THREE.Color("#438b94"),
    edge = new THREE.Color("#83b5b0"),
    center = new THREE.Color("#a2c9c0"),
    color = new THREE.Color();
  for (let iz = 0; iz < zs.length; iz++)
    for (let ix = 0; ix < xs.length; ix++) {
      const x = xs[ix],
        z = zs[iz];
      let distanceSquared = Infinity;
      if (x > -12 && x < 9 && z > -2 && z < 24)
        for (const { a, b } of curves) {
          const dx = b.x - a.x,
            dz = b.z - a.z;
          const t = THREE.MathUtils.clamp(
            ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz),
            0,
            1,
          );
          distanceSquared = Math.min(
            distanceSquared,
            (x - a.x - t * dx) ** 2 + (z - a.z - t * dz) ** 2,
          );
        }
      const distance = Math.sqrt(distanceSquared);
      const blend = 1 - THREE.MathUtils.smoothstep(distance, 0.9, 1.35);
      const middle = 1 - THREE.MathUtils.smoothstep(distance, 0, 1.1);
      const bedHeight =
        -0.16 -
        (1 + Math.sin(x * 0.36) * Math.cos(z * 0.31)) * 0.18 -
        Math.max(0, Math.hypot(x * 0.8, z - 11) - 20) * 0.035;
      positions.push(x, THREE.MathUtils.lerp(bedHeight, 0.015, blend), z);
      color.copy(base).lerp(edge, blend).lerp(center, middle);
      colors.push(color.r, color.g, color.b);
      if (ix < xs.length - 1 && iz < zs.length - 1) {
        const a = iz * xs.length + ix,
          b = a + 1,
          c = a + xs.length,
          d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const floor = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }),
  );
  floor.receiveShadow = true;
  floor.name = "continuous-seabed";
  root.add(floor);
  // A single transparent sheet of slow light interference, not a water surface.
  const light = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { time: { value: 0 } },
    vertexShader: `varying vec2 bed; void main(){bed=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `varying vec2 bed; uniform float time;
      void main(){vec2 p=bed*1.55; float a=sin(p.x+sin(p.y*0.8+time*0.22)); float b=sin(p.y+sin(p.x*0.7-time*0.18));
      float edge=pow(max(0.0,1.0-abs(a+b)*1.7),12.0); float fade=1.0-smoothstep(18.0,35.0,length(bed));
      gl_FragColor=vec4(0.60,0.94,0.87,edge*fade*0.14);}`,
  });
  const caustics = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), light);
  caustics.rotation.x = -Math.PI / 2;
  caustics.position.set(0, 0.045, 11);
  caustics.name = "seabed-light";
  root.add(caustics);
  return light;
}

export function reefScenery(
  root: THREE.Group,
  collision: CollisionSystem,
  models: SeaModels,
) {
  // Uneven, overlapping reef shoulders hide the world limits; their fronts are solid.
  for (const side of [-1, 1])
    for (let i = 0; i < 11; i++) {
      const z = -3 + i * 2.8,
        x = side * (10.4 + Math.sin(i * 1.9) * 1.05);
      // The volcano mouth owns this gap in the western reef wall.
      if (side === -1 && Math.abs(z - WATER_ENTRY.z) < 3) continue;
      const width = 1.6 + (i % 3) * 0.38,
        height = 1.3 + (i % 4) * 0.48;
      models.rock(root, x, z, width, height, 2.05);
      collision.addEllipse(x, z, width * 0.82, 1.7);
      models.coral(
        root,
        x + side * 0.4,
        z + 0.3,
        0.9,
        i,
        i % 2 ? models.palette.teal : models.palette.violet,
      ).position.y = height * 0.95;
      models.rock(root, x + side * 3, z - 0.7, 2.6, height + 0.8, 2.4);
    }
  for (const z of [-3.7, 25.7])
    for (const x of [-8, -4, 3.8, 8]) {
      models.rock(root, x, z, 2.4, 1.7 + Math.abs(x) * 0.07, 1.9);
      collision.addEllipse(x, z, 2, 1.5);
    }
  // Close the southern rim; only the northern shell gate is a passage.
  models.rock(root, -1.1, 25.6, 2.4, 2, 1.9);
  collision.addEllipse(-1.1, 25.6, 2, 1.5);
  models.rock(root, 1.5, 25.9, 2.3, 2.2, 2);
  collision.addEllipse(1.5, 25.9, 1.9, 1.6);
  const seaweed: THREE.Group[] = [];
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0, 0);
  bladeShape.bezierCurveTo(-0.24, 0.5, 0.28, 0.9, 0.04, 1.6);
  bladeShape.bezierCurveTo(0.55, 0.9, 0, 0.5, 0.15, 0);
  bladeShape.closePath();
  const blade = new THREE.ShapeGeometry(bladeShape);
  let seed = 941;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  let count = 0;
  for (let i = 0; i < 140 && count < 36; i++) {
    const x = -8.3 + random() * 16.6,
      z = 1.8 + random() * 21;
    if (
      pathDistance(x, z) < 1.6 ||
      !collision.free(x, z, 0.75) ||
      Math.hypot(x + 6, z - 8) < 3 ||
      Math.hypot(x - 5, z - 6) < 3.1
    )
      continue;
    const scale = 0.4 + random() * 0.65;
    const mat = [
      models.palette.pink,
      models.palette.orange,
      models.palette.violet,
      models.palette.teal,
    ][count % 4];
    if (count % 4 === 0) {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.rotation.y = random() * 6;
      root.add(g);
      for (let j = 0; j < 3; j++) {
        const leaf = models.put(
          g,
          blade,
          models.palette.leaf,
          j * 0.2,
          0,
          j * 0.11,
          scale,
          scale * (1 + j * 0.25),
          scale,
        );
        leaf.rotation.y = j * 0.8;
      }
      seaweed.push(g);
    } else models.coral(root, x, z, scale, count, mat);
    if (count % 3 === 0) models.shell(root, x + 0.5, z + 0.5, 0.65);
    if (count % 5 === 0) models.star(root, x - 0.5, z + 0.4, 0.6);
    count++;
  }
  // Pebbles are instanced: varied little details without hundreds of draw calls.
  const pebbles = new THREE.InstancedMesh(
    models.stone,
    models.palette.cap,
    130,
  );
  const transform = new THREE.Object3D();
  for (let i = 0; i < 130; i++) {
    const x = -9 + random() * 18,
      z = random() * 24;
    transform.position.set(x, -0.025, z);
    transform.rotation.set(random(), random() * 6, 0);
    const r = pathDistance(x, z) < 0.9 ? 0.025 : 0.08 + random() * 0.1;
    transform.scale.set(r * 1.5, r * 0.45, r);
    transform.updateMatrix();
    pebbles.setMatrixAt(i, transform.matrix);
  }
  root.add(pebbles);
  return seaweed;
}
