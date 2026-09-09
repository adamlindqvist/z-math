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
    if (room === "hall") {
      for (const x of [-2.9, 2.9])
        box(this.root, stone, x, 1.3, -4.35, 3.8, 2.6, 0.3);
      for (const x of [-4.75, 4.75])
        for (const z of [-2.7, 2.7])
          box(this.root, stone, x, 0.65, z, 0.3, 1.3, 3.4);
    } else {
      box(this.root, stone, 0, 1.3, -4.35, 9.6, 2.6, 0.3);
      for (const x of [-4.75, 4.75])
        box(this.root, stone, x, 0.65, 0, 0.3, 1.3, 8.8);
    }
    // Cutaway front wall and low portal keep the player visible from above.
    for (const x of [-2.9, 2.9])
      box(this.root, stone, x, 0.2, 4.35, 3.8, 0.4, 0.3);
    box(this.root, material("#a84d50"), 0, 0.015, 1.5, 2, 0.03, 4);
    this.door(0, 4.2, "Utgång", false, 0, true);
    if (room === "hall") {
      this.door(4.65, 0, "Butik", false, -Math.PI / 2, false, "\u{1F6D2}");
      this.door(-4.65, 0, "Bibliotek", true, Math.PI / 2, false, "\u{1F4DA}");
      this.door(0, -4.2, "Kungssal", true, 0, false, "\u{1F451}");
      this.targets.push(
        {
          x: -4,
          z: 0,
          target: { kind: "castleDoor", id: "library", label: "Titta" },
        },
        {
          x: 0,
          z: -3.5,
          target: { kind: "castleDoor", id: "throne", label: "Titta" },
        },
      );
      this.flames = furnishHall(this.root, this.collision);
      // A few rupees lie on the red runner so the hall rewards a look around.
      this.rupees = [
        new Collectible("castle-1", 1.5, 0),
        new Collectible("castle-2", 2.5, 0),
        new Collectible("castle-3", 3.5, 0),
      ];
      this.root.add(...this.rupees.map((rupee) => rupee.root));
    } else {
      this.sign("\u{1F6D2}", 0, 2.35, -3.85);
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
      this.root.add(bosse.root);
      const target = { kind: "shop" as const, label: "Handla" };
      bosse.root.userData.target = target;
      this.targets.push({ x: 0, z: -1.15, target });
      box(this.root, trim, 0, 0.45, -1.95, 1.8, 0.9, 0.65);
      this.collision.add(0, -2.1, 1, 0.65);
      SHOP_IDS.forEach((id, i) => {
        const x = i < 2 ? -2.9 : 2.9,
          z = i % 2 === 0 ? -2.3 : 0.2;
        box(this.root, trim, x, 0.35, z, 1.15, 0.7, 0.7);
        box(this.root, trim, x, 0.92, z - 0.32, 1.15, 1.2, 0.1);
        box(this.root, trim, x, 0.72, z, 1.25, 0.08, 0.75);
        this.collision.add(x, z, 0.58, 0.35);
        const model = shopModel(id);
        model.position.set(x, 1.25, z);
        model.userData.target = {
          kind: "shop",
          itemId: id,
          label: "Titta på varan",
        };
        this.root.add(model);
        this.targets.push({ x, z: z + 0.35, target: model.userData.target });
      });
      for (const x of [-3.8, 3.8]) {
        box(this.root, trim, x, 1.15, -4, 0.08, 2.3, 0.08);
        ball(this.root, material("#ffdb83"), x, 2.1, -3.9, 0.22, 0.3, 0.2);
      }
      box(this.root, trim, -4, 0.25, 2, 0.6, 0.5, 0.6);
      this.collision.add(-4, 2, 0.3);
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
          {
            x: 4.1,
            z: 0,
            rotation: -Math.PI / 2,
            destination: { castle: "shop" },
          },
        ]
      : [{ x: 0, z: 3.65, destination: { castle: "hall" } }];
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
      Math.hypot(position.x, position.z + 1.15) < 2.6
    )
      gameStore.greetShop();
  }
  dispose() {
    this.textures.forEach((t) => t.dispose());
    disposeTree(this.root);
  }
}
export class ShopScene extends CastleArea {
  constructor() {
    super("shop");
  }
}
