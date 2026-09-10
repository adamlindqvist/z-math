import * as THREE from "three";
import {
  type Area,
  type Interaction,
  type Passage,
  disposeTree,
} from "../Area";
import { CollisionSystem } from "../CollisionSystem";
import { box, ball, material, character } from "../models";
import { gameStore, type GameState } from "../../store/gameStore";
import { SHOP_IDS } from "../../items/shop";
import { shopModel } from "./models";
import { gladeDistance } from "../gladeLayout";
import { furnishHall } from "./hall";
import { Collectible } from "../entities/Collectible";
export const CASTLE_ENTRANCE = {
  x: gladeDistance(-7),
  z: gladeDistance(-2) + 1.35,
};
export class CastleArea implements Area {
  root = new THREE.Group();
  collision = new CollisionSystem(4.6, 4.2);
  spawn = { x: 0, z: 2.5 };
  cameraMode = "room" as const;
  rupees: Collectible[] = [];
  protected targets: Interaction[] = [];
  private textures: THREE.Texture[] = [];
  private flames: THREE.Mesh[] = [];
  constructor(public room: "hall" | "shop" = "hall") {
    const stone = material("#d7c8aa"),
      trim = material("#a78d6a");
    box(this.root, material("#ead9b9"), 0, -0.15, 0, 9.6, 0.3, 8.8);
    // Wall segments leave real openings, aligned with the doorway frames.
    // The front wall and hall exit are cut away for visibility from above.
    if (room === "hall") {
      for (const x of [-2.9, 2.9])
        box(this.root, stone, x, 1.3, -4.35, 3.8, 2.6, 0.3);
      for (const x of [-4.75, 4.75])
        for (const z of [-2.7, 2.7])
          box(this.root, stone, x, 0.65, z, 0.3, 1.3, 3.4);
      box(this.root, stone, -2.9, 0.2, 4.35, 3.8, 0.4, 0.3);
      box(this.root, stone, 2.9, 0.2, 4.35, 3.8, 0.4, 0.3);
      box(this.root, material("#a84d50"), 0, 0.015, 1.5, 2, 0.03, 4);
      this.door(0, 4.2, "Utgång", false, 0, true);
    } else {
      // The shop is entered by walking right out of the hall, so its way back
      // sits on the left wall and the front wall stays closed.
      box(this.root, stone, 0, 1.3, -4.35, 9.6, 2.6, 0.3);
      box(this.root, stone, 4.75, 0.65, 0, 0.3, 1.3, 8.8);
      for (const z of [-2.7, 2.7])
        box(this.root, stone, -4.75, 0.65, z, 0.3, 1.3, 3.4);
      box(this.root, stone, 0, 0.2, 4.35, 9.6, 0.4, 0.3);
      box(this.root, material("#a84d50"), -1.5, 0.015, 0, 4.5, 0.03, 2);
      this.door(-4.2, 0, "Utgång", false, Math.PI / 2);
    }
    if (room === "hall") {
      this.door(4.65, 0, "Butik", false, -Math.PI / 2, false, "\u{1F6D2}");
      this.door(-4.65, 0, "Bibliotek", true, Math.PI / 2, false, "\u{1F4DA}");
      this.door(0, -4.2, "Kungasalen", false, 0, false, "\u{1F451}");
      this.targets.push({
        x: -4,
        z: 0,
        target: { kind: "castleDoor", id: "library", label: "Titta" },
      });
      this.flames = furnishHall(this.root, this.collision);
      // A few rupees lie on the red runner so the hall rewards a look around.
      this.rupees = [
        new Collectible("castle-1", 1.5, 0),
        new Collectible("castle-2", 2.5, 0),
        new Collectible("castle-3", 3.5, 0),
        new Collectible("castle-4", 0, -1),
        new Collectible("castle-5", 0, -2),
        new Collectible("castle-6", 0, -3),
      ];
      this.root.add(...this.rupees.map((rupee) => rupee.root));
    } else {
      this.sign("\u{1F6D2}", 0, 2.35, -3.85);
      const counter = new THREE.Group();
      counter.name = "shop-counter";
      counter.position.set(1.4, 0, 0);
      counter.rotation.y = -Math.PI / 2;
      this.root.add(counter);
      const bosse = character("hero");
      bosse.coat.color.set("#935b40");
      box(bosse.root, material("#f7e6bd"), 0, 0.7, 0.34, 0.46, 0.45, 0.05);
      ball(bosse.root, material("#d1af75"), 0, 1.07, 0.29, 0.19, 0.12, 0.1);
      bosse.root.position.set(0, 0, -2.45);
      bosse.root.scale.setScalar(1.15);
      bosse.root.traverse((o) => {
        if (o.name.includes("sword") || o.name.includes("shield"))
          o.visible = false;
      });
      counter.add(bosse.root);
      const target = { kind: "shop" as const, label: "Handla" };
      bosse.root.userData.target = target;
      this.targets.push({ x: 2.55, z: 0, target });
      box(counter, trim, 0, 0.45, -1.95, 1.8, 0.9, 0.65);
      this.collision.add(3.5, 0, 0.65, 1);
      // One row of goods leaves the center and front available for future
      // displays, with a direct aisle from the left entrance to the counter.
      const shelves = [
        { x: -2.75, z: -3.55, rotation: 0 },
        { x: -0.9, z: -3.55, rotation: 0 },
        { x: 0.95, z: -3.55, rotation: 0 },
        { x: 2.8, z: -3.55, rotation: 0 },
      ];
      SHOP_IDS.forEach((id, i) => {
        const { x, z, rotation } = shelves[i];
        const display = new THREE.Group();
        display.position.set(x, 0, z);
        display.rotation.y = rotation;
        this.root.add(display);
        box(display, trim, 0, 0.35, 0, 1.15, 0.7, 0.7);
        box(display, trim, 0, 0.92, -0.32, 1.15, 1.2, 0.1);
        box(display, trim, 0, 0.72, 0, 1.25, 0.08, 0.75);
        const sideFacing = rotation !== 0;
        this.collision.add(x, z, sideFacing ? 0.35 : 0.58, sideFacing ? 0.58 : 0.35);
        const model = shopModel(id);
        model.position.set(0, 1.25, 0);
        model.userData.target = {
          kind: "shop",
          itemId: id,
          label: "Titta på varan",
        };
        display.add(model);
        this.targets.push({
          x: x + Math.sin(rotation) * 0.35,
          z: z + Math.cos(rotation) * 0.35,
          target: model.userData.target,
        });
      });
      for (const x of [-3.8, 3.8]) {
        box(this.root, trim, x, 1.15, -4, 0.08, 2.3, 0.08);
        ball(this.root, material("#ffdb83"), x, 2.1, -3.9, 0.22, 0.3, 0.2);
      }
      box(this.root, trim, 3.9, 0.25, 2.6, 0.6, 0.5, 0.6);
      this.collision.add(3.9, 2.6, 0.3);

      // A few homely details, kept on existing furniture or against the wall.
      // The rug remains flat and the entrance and central walking space stay clear.
      const cream = material("#f2dfb5"),
        terracotta = material("#b86d4d"),
        leaves = material("#547d48"),
        cloth = material("#d1ac70"),
        wood = material("#805c40");
      for (const z of [-0.87, 0.87])
        box(this.root, cream, -1.5, 0.034, z, 4.22, 0.008, 0.045);
      for (const x of [-3.59, 0.59])
        box(this.root, cream, x, 0.034, 0, 0.045, 0.008, 1.78);

      // A short woven runner drapes over the front of Bosse's counter.
      box(counter, cloth, 0, 0.908, -1.94, 0.66, 0.016, 0.65);
      box(counter, cloth, 0, 0.77, -1.616, 0.66, 0.28, 0.018);
      box(counter, cream, 0, 0.655, -1.604, 0.57, 0.035, 0.008);

      // Turn the existing corner pedestal into a plant stand, with no new obstacle.
      ball(this.root, terracotta, 3.9, 0.68, 2.6, 0.22, 0.19, 0.22);
      box(this.root, leaves, 3.9, 0.98, 2.6, 0.035, 0.45, 0.035);
      for (const [dx, dy, dz, tilt] of [
        [-0.14, 1.03, 0, -0.7],
        [0.14, 1.13, 0.02, 0.7],
        [-0.05, 1.25, -0.05, -0.2],
      ]) {
        const leaf = ball(this.root, leaves, 3.9 + dx, dy, 2.6 + dz, 0.1, 0.22, 0.065);
        leaf.rotation.z = tilt;
      }

      // A small framed landscape above the clothing display.
      box(this.root, wood, -2.75, 2.04, -4.13, 1.05, 0.72, 0.07);
      box(this.root, material("#b8d8d5"), -2.75, 2.04, -4.087, 0.9, 0.57, 0.02);
      ball(this.root, cloth, -2.52, 2.17, -4.07, 0.09, 0.09, 0.012);
      ball(this.root, leaves, -2.9, 1.82, -4.065, 0.3, 0.13, 0.016);
      ball(this.root, material("#829c65"), -2.59, 1.82, -4.06, 0.28, 0.1, 0.016);
    }
  }
  private sign(
    symbol: string,
    x: number,
    y: number,
    z: number,
    parent = this.root,
  ) {
    // Picture signs only: a five-year-old reads the symbol, not words.
    // React carries the readable and spoken labels.
    if (
      typeof document === "undefined" ||
      typeof CanvasRenderingContext2D === "undefined"
    )
      return;
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fff0cc";
    ctx.fillRect(0, 0, 256, 256);
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    // Emoji metrics vary per glyph, so measure once and scale it to fit
    // inside the plaque instead of trusting a fixed font size.
    const fit = 200;
    ctx.font = "100px sans-serif";
    let m = ctx.measureText(symbol);
    const height =
      (m.actualBoundingBoxAscent || 100) + (m.actualBoundingBoxDescent || 0);
    ctx.font = `${Math.round(100 * Math.min(fit / (m.width || 100), fit / height))}px sans-serif`;
    m = ctx.measureText(symbol);
    ctx.fillStyle = "#354a36";
    ctx.fillText(
      symbol,
      128,
      128 +
        ((m.actualBoundingBoxAscent || 0) - (m.actualBoundingBoxDescent || 0)) /
          2,
    );
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.textures.push(texture);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 0.7),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
    );
    // Tilted toward the camera and standing clear of the stone so no part of
    // the picture disappears into a lintel or wall.
    mesh.position.set(x, y, z);
    mesh.rotation.x = -Math.PI / 4;
    parent.add(mesh);
  }
  private door(
    x: number,
    z: number,
    label: string,
    locked: boolean,
    rotation = 0,
    low = false,
    symbol?: string,
  ) {
    const frame = new THREE.Group();
    frame.name = `castle-door-${label}`;
    frame.position.set(x, 0, z);
    frame.rotation.y = rotation;
    this.root.add(frame);
    const stone = material("#d7c8aa"),
      trim = material("#a78d6a");
    for (const side of [-1, 1]) {
      box(frame, stone, side * 0.95, 0.85, 0, 0.5, 1.7, 0.55);
      box(frame, trim, side * 0.95, 1.7, 0, 0.56, 0.12, 0.62);
      this.collision.add(
        x + Math.cos(rotation) * side * 0.95,
        z - Math.sin(rotation) * side * 0.95,
        Math.abs(Math.cos(rotation)) * 0.25 +
          Math.abs(Math.sin(rotation)) * 0.275,
        Math.abs(Math.sin(rotation)) * 0.25 +
          Math.abs(Math.cos(rotation)) * 0.275,
      );
    }
    box(frame, stone, 0, 1.93, 0, 2.45, 0.45, 0.65);
    box(frame, material("#ead9b9"), 0, 0.025, 0, 1.4, 0.05, 1.1);
    if (low) frame.scale.y = 0.22;
    else if (symbol) this.sign(symbol, 0, 2.45, 0.47, frame);
    if (locked) {
      const panel = box(
        frame,
        material("#8c7563"),
        0,
        0.85,
        0.08,
        1.4,
        1.7,
        0.16,
      );
      panel.name = "closed-door";
      ball(frame, material("#f2ca61"), 0.35, 0.8, 0.19, 0.1);
      this.collision.add(
        x + Math.sin(rotation) * 0.08,
        z + Math.cos(rotation) * 0.08,
        Math.abs(Math.cos(rotation)) * 0.7 +
          Math.abs(Math.sin(rotation)) * 0.08,
        Math.abs(Math.sin(rotation)) * 0.7 +
          Math.abs(Math.cos(rotation)) * 0.08,
      );
    }
  }
  passages(): Passage[] {
    return this.room === "hall"
      ? [
          { x: 0, z: 3.65, destination: null },
          { x: 0, z: -3.65, destination: { castle: "throne" } },
          {
            x: 4.1,
            z: 0,
            rotation: -Math.PI / 2,
            destination: { castle: "shop" },
          },
        ]
      : [
          {
            x: -3.65,
            z: 0,
            rotation: Math.PI / 2,
            destination: { castle: "hall" },
          },
        ];
  }
  interactions(_state: GameState, _position: THREE.Vector3) {
    return this.targets;
  }
  update(_dt: number, time: number, position?: THREE.Vector3) {
    // Candles, torches and the fire breathe a little so the hall feels alive.
    for (const flame of this.flames) {
      const { phase, size } = flame.userData as { phase: number; size: number };
      const pulse =
        Math.sin(time * 6 + phase) * 0.5 + Math.sin(time * 11 + phase) * 0.5;
      flame.scale.y = size * (1 + pulse * 0.12);
      (flame.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.9 + pulse * 0.25;
    }
    const collected = gameStore.getState().collected;
    for (const rupee of this.rupees)
      rupee.update(time, collected.includes(rupee.id));
    if (
      this.room === "shop" &&
      position &&
      Math.hypot(position.x - 2.55, position.z) < 2.6
    )
      gameStore.greetShop();
  }
  dispose() {
    this.textures.forEach((t) => t.dispose());
    disposeTree(this.root);
  }
}
export class ShopScene extends CastleArea {
  // Entering from the hall means stepping in through the left doorway.
  spawn = { x: -3, z: 0 };
  constructor() {
    super("shop");
  }
}
