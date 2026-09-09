import * as THREE from "three";
export const material = (color: THREE.ColorRepresentation, roughness = 0.8) =>
  new THREE.MeshStandardMaterial({ color, roughness });
export function mesh(
  geometry: THREE.BufferGeometry,
  mat: THREE.Material,
  parent: THREE.Object3D,
  x = 0,
  y = 0,
  z = 0,
) {
  const m = new THREE.Mesh(geometry, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
export function ball(
  parent: THREE.Object3D,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  sx: number,
  sy = sx,
  sz = sx,
) {
  const m = mesh(new THREE.SphereGeometry(1, 12, 8), mat, parent, x, y, z);
  m.scale.set(sx, sy, sz);
  return m;
}
export function box(
  parent: THREE.Object3D,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
) {
  return mesh(new THREE.BoxGeometry(w, h, d), mat, parent, x, y, z);
}
// Shallow solid silhouettes keep accessories readable without textures.
export function silhouette(
  parent: THREE.Object3D,
  mat: THREE.Material,
  points: [number, number][],
  depth = 0.04,
) {
  const shape = new THREE.Shape();
  points.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
  shape.closePath();
  return mesh(
    new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
      steps: 1,
    }),
    mat,
    parent,
  );
}

export function character(role: "hero" | "princess") {
  const princess = role === "princess";
  const root = new THREE.Group();
  root.name = role;
  const coat = material(princess ? "#df8fbd" : "#36964a"),
    skin = material("#ffd0a0"),
    hair = material("#f5cc49"),
    dark = material("#263036"),
    leather = material("#805033"),
    gold = material("#efbd45", 0.4),
    cream = material("#fff1d4"),
    pink = material("#eea18b");
  const body = mesh(
    new THREE.CylinderGeometry(
      princess ? 0.23 : 0.27,
      princess ? 0.48 : 0.36,
      princess ? 0.87 : 0.57,
      12,
    ),
    coat,
    root,
    0,
    princess ? 0.49 : 0.65,
  );
  if (princess) {
    ball(root, hair, 0, 1.13, -0.17, 0.4, 0.51, 0.24);
    mesh(new THREE.CylinderGeometry(0.45, 0.49, 0.09, 12), gold, root, 0, 0.1);
    const panel = silhouette(root, cream, [
      [-0.12, 0.87],
      [-0.27, 0.16],
      [0.27, 0.16],
      [0.12, 0.87],
    ]);
    panel.position.z = 0.29;
    panel.rotation.x = 0.2;
    box(root, gold, 0, 0.79, 0.26, 0.43, 0.07, 0.12);
    ball(root, material("#628acf", 0.35), 0, 0.88, 0.29, 0.065, 0.09, 0.035);
  }
  ball(root, skin, 0, 1.22, 0, 0.36, 0.38, 0.33);
  for (const side of [-1, 1]) {
    const ear = silhouette(
      root,
      skin,
      [
        [side * 0.29, 1.29],
        [side * 0.53, 1.39],
        [side * 0.37, 1.12],
      ],
      0.09,
    );
    ear.position.z = -0.02;
  }
  ball(root, hair, 0, 1.47, -0.035, 0.37, 0.2, 0.32);
  const fringe = ball(root, hair, -0.12, 1.48, 0.22, 0.26, 0.12, 0.15);
  fringe.rotation.z = 0.2;
  const sideFringe = ball(root, hair, 0.23, 1.4, 0.16, 0.13, 0.22, 0.17);
  sideFringe.rotation.z = 0.4;
  for (const side of [-1, 1]) {
    ball(
      root,
      hair,
      side * 0.31,
      princess ? 1.05 : 1.19,
      0.025,
      0.09,
      princess ? 0.34 : 0.2,
      0.15,
    );
    ball(root, dark, side * 0.135, 1.24, 0.305, 0.055, 0.095, 0.025);
    ball(root, cream, side * 0.135 - 0.012, 1.275, 0.327, 0.014, 0.022, 0.009);
    ball(root, pink, side * 0.22, 1.12, 0.275, 0.054, 0.027, 0.018);
    ball(root, coat, side * 0.31, 0.82, 0, 0.14, 0.16, 0.15);
    ball(
      root,
      princess ? cream : leather,
      side * 0.37,
      0.68,
      0.02,
      0.09,
      0.17,
      0.1,
    );
    ball(root, skin, side * 0.4, 0.57, 0.05, 0.095);
  }
  ball(root, skin, 0, 1.14, 0.335, 0.045);
  const smile = mesh(
    new THREE.TorusGeometry(0.045, 0.009, 4, 8, Math.PI),
    material("#ab6851"),
    root,
    0,
    1.075,
    0.307,
  );
  smile.rotation.z = Math.PI;
  const left = ball(root, leather, -0.17, 0.18, 0.07, 0.14, 0.18, 0.22);
  const right = ball(root, leather, 0.17, 0.18, 0.07, 0.14, 0.18, 0.22);
  if (princess) {
    mesh(
      new THREE.CylinderGeometry(0.26, 0.28, 0.095, 12),
      gold,
      root,
      0,
      1.61,
    );
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      mesh(
        new THREE.ConeGeometry(0.075, 0.2, 4),
        gold,
        root,
        Math.sin(angle) * 0.235,
        1.74,
        Math.cos(angle) * 0.235,
      );
    }
    ball(root, material("#ba559e", 0.3), 0, 1.65, 0.272, 0.055, 0.065, 0.025);
    for (const side of [-1, 1])
      ball(root, gold, side * 0.38, 1.14, 0.07, 0.035, 0.06, 0.035);
  } else {
    const baseHat = new THREE.Group();
    baseHat.name = "base-hat";
    root.add(baseHat);
    const hatMaterial = coat.clone();
    ball(baseHat, hatMaterial, 0, 1.49, -0.14, 0.35, 0.23, 0.31);
    const hat = mesh(
      new THREE.ConeGeometry(0.3, 0.75, 12),
      hatMaterial,
      baseHat,
      0,
      1.31,
      -0.4,
    );
    hat.rotation.x = -2.35;
    mesh(
      new THREE.CylinderGeometry(0.325, 0.34, 0.115, 12),
      leather,
      root,
      0,
      0.52,
    );
    box(root, gold, 0, 0.52, 0.329, 0.19, 0.15, 0.045);
    box(root, leather, 0, 0.52, 0.356, 0.115, 0.085, 0.018);
    const shield = new THREE.Group();
    shield.name = "shield";
    shield.position.set(-0.4, 0.62, 0.2);
    shield.rotation.set(-0.08, -0.18, -0.12);
    root.add(shield);
    const outline: [number, number][] = [
      [0, 0.39],
      [-0.29, 0.21],
      [-0.24, -0.16],
      [0, -0.43],
      [0.24, -0.16],
      [0.29, 0.21],
    ];
    silhouette(shield, material("#dce2df", 0.35), outline, 0.065);
    const inset = silhouette(
      shield,
      material("#3c589d"),
      outline.map(([x, y]) => [x * 0.8, y * 0.8]),
    );
    inset.position.z = 0.068;
    for (const [x, y] of [
      [0, 0.17],
      [-0.075, 0.04],
      [0.075, 0.04],
    ]) {
      const triangle = silhouette(
        shield,
        gold,
        [
          [x, y + 0.09],
          [x - 0.075, y - 0.04],
          [x + 0.075, y - 0.04],
        ],
        0.012,
      );
      triangle.position.z = 0.112;
    }
    const crest = silhouette(
      shield,
      material("#dc6159"),
      [
        [0, -0.09],
        [-0.15, -0.05],
        [-0.1, -0.18],
        [0, -0.29],
        [0.1, -0.18],
        [0.15, -0.05],
      ],
      0.012,
    );
    crest.position.z = 0.113;
    const sword = new THREE.Group();
    sword.name = "sword";
    sword.position.set(0.43, 0.56, 0.08);
    sword.rotation.z = -0.48;
    root.add(sword);
    mesh(new THREE.CylinderGeometry(0.037, 0.037, 0.2, 8), leather, sword);
    box(sword, gold, 0, 0.13, 0, 0.28, 0.06, 0.09);
    const blade = silhouette(
      sword,
      material("#e5ebe4", 0.3),
      [
        [-0.065, 0.16],
        [-0.065, 0.65],
        [0, 0.77],
        [0.065, 0.65],
        [0.065, 0.16],
      ],
      0.04,
    );
    blade.position.z = -0.02;
    box(sword, cream, 0, 0.41, 0.026, 0.012, 0.49, 0.008);
    ball(sword, gold, 0, -0.115, 0, 0.055);
    // Separate variants keep the original equipment's shared materials untouched.
    const fireShield = new THREE.Group();
    fireShield.name = "fire-shield";
    fireShield.position.copy(shield.position);
    fireShield.rotation.copy(shield.rotation);
    root.add(fireShield);
    silhouette(fireShield, material("#b4492e"), outline, 0.065);
    const fireInset = silhouette(
      fireShield,
      material("#493637"),
      outline.map(([x, y]) => [x * 0.8, y * 0.8]),
    );
    fireInset.position.z = 0.068;
    flame(fireShield, 0, -0.26, 0.1, 0.55);
    const fireSword = new THREE.Group();
    fireSword.name = "fire-sword";
    fireSword.position.copy(sword.position);
    fireSword.rotation.copy(sword.rotation);
    root.add(fireSword);
    mesh(
      new THREE.CylinderGeometry(0.037, 0.037, 0.2, 8),
      material("#743b30"),
      fireSword,
    );
    box(fireSword, material("#dc682e"), 0, 0.13, 0, 0.3, 0.06, 0.09);
    const fireBlade = silhouette(
      fireSword,
      material("#ffc277", 0.3),
      [
        [-0.065, 0.16],
        [-0.085, 0.6],
        [0, 0.81],
        [0.085, 0.6],
        [0.065, 0.16],
      ],
      0.04,
    );
    fireBlade.position.z = -0.02;
    flame(fireSword, 0, 0.21, 0.025, 0.28);
    ball(fireSword, material("#ed722c"), 0, -0.115, 0, 0.055);
    // Starter gear reuses the hand anchors so it sits in the grip, not the body.
    const woodShield = woodenShield(root);
    woodShield.name = "wood-shield";
    woodShield.position.copy(shield.position);
    woodShield.rotation.copy(shield.rotation);
    const woodSword = woodenSword(root);
    woodSword.name = "wood-sword";
    woodSword.position.copy(sword.position);
    woodSword.rotation.copy(sword.rotation);
  }
  return { root, body, left, right, coat };
}

// Starter gear, shared so the shop display and the hero show the same thing.
export function woodenShield(parent: THREE.Object3D) {
  const group = new THREE.Group();
  parent.add(group);
  const gold = material("#efbd45", 0.4);
  const round: [number, number][] = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return [Math.sin(a) * 0.3, Math.cos(a) * 0.34];
  });
  silhouette(group, material("#7d4f2c"), round, 0.06);
  const face = silhouette(
    group,
    material("#b4773e"),
    round.map(([x, y]) => [x * 0.84, y * 0.84]),
    0.03,
  );
  face.position.z = 0.06;
  box(group, gold, 0, 0, 0.105, 0.06, 0.5, 0.03);
  box(group, gold, 0, 0, 0.105, 0.42, 0.06, 0.03);
  return group;
}

export function woodenSword(parent: THREE.Object3D) {
  const group = new THREE.Group();
  parent.add(group);
  const grip = material("#8a5a30");
  mesh(
    new THREE.CylinderGeometry(0.037, 0.037, 0.2, 8),
    material("#64452e"),
    group,
  );
  box(group, grip, 0, 0.13, 0, 0.26, 0.06, 0.09);
  const blade = silhouette(
    group,
    material("#c08a4c", 0.7),
    [
      [-0.06, 0.16],
      [-0.06, 0.56],
      [0, 0.66],
      [0.06, 0.56],
      [0.06, 0.16],
    ],
    0.04,
  );
  blade.position.z = -0.02;
  ball(group, grip, 0, -0.115, 0, 0.05);
  return group;
}

// A small geometric flame shared by the temple and its equipment.
export function flame(
  parent: THREE.Group,
  x: number,
  y: number,
  z: number,
  scale = 1,
) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.scale.setScalar(scale);
  parent.add(group);
  const outer = material("#ff762c"),
    inner = material("#ffe09a");
  outer.emissive.set("#f85216");
  outer.emissiveIntensity = 0.45;
  inner.emissive.set("#ffb735");
  inner.emissiveIntensity = 0.4;
  silhouette(
    group,
    outer,
    [
      [0, 0],
      [-0.3, 0.18],
      [-0.32, 0.42],
      [-0.16, 0.72],
      [-0.09, 0.45],
      [0.07, 1],
      [0.32, 0.48],
      [0.3, 0.19],
    ],
    0.04,
  );
  const core = silhouette(
    group,
    inner,
    [
      [0, 0.08],
      [-0.14, 0.22],
      [-0.1, 0.4],
      [0.02, 0.61],
      [0.15, 0.26],
    ],
    0.02,
  );
  core.position.z = 0.045;
  return group;
}
