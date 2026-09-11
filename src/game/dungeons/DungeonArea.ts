import * as THREE from "three";
import { type Area, type Interaction, type Passage, disposeTree } from "../Area";
import { CollisionSystem } from "../CollisionSystem";
import { Chest } from "../entities/Chest";
import { box, material, ball } from "../models";
import { gameStore, type GameState } from "../../store/gameStore";
import {
  roomSolved,
  pushedPosition,
  type DungeonDefinition,
  type RoomDefinition,
} from "./definitions";
import { portal, symbol, THEMES, roomDecoration } from "./models";
export class DungeonArea implements Area {
  root = new THREE.Group();
  collision = new CollisionSystem(6.2, 6);
  spawn = { x: 0, z: 4.7 };
  cameraMode = "room" as const;
  rupees = [];
  private stones: THREE.Group[] = [];
  private tiles: { mesh: THREE.Mesh; stone: number }[] = [];
  private gate: THREE.Mesh;
  private back = { x: 0, z: 5.35, rotation: 0 };
  private forward = { x: 0, z: -5.35, rotation: 0 };
  private lamps: THREE.Mesh[] = [];
  private chest?: Chest;
  private motionTime = 0;
  private activeMotion: GameState["motion"] = null;
  constructor(
    readonly dungeon: DungeonDefinition,
    readonly room: RoomDefinition,
  ) {
    const index = dungeon.rooms.indexOf(room);
    const leftExit = dungeon.id === "fire" && (index === 0 || index === dungeon.rooms.length - 1);
    if (leftExit) {
      const left = { x: -5.35, z: 0, rotation: Math.PI / 2 };
      if (index === 0) {
        this.back = left;
        this.spawn = { x: -3.95, z: 0 };
      } else this.forward = left;
    }
    const palette = THEMES[dungeon.theme];
    const stone = material(palette.stone),
      floor = material(palette.floor),
      band = material(palette.band);
    const floorTiles = palette.tiles.map((color) => material(color));
    const accent = material(palette.accent);
    accent.emissive.set(palette.accent);
    accent.emissiveIntensity = 0.25;
    box(this.root, floor, 0, -0.2, 0, 12.4, 0.4, 12);
    for (let x = -5; x <= 5; x += 2)
      for (let z = -5; z <= 5; z += 2)
        box(
          this.root,
          floorTiles[(x + z) % 4 === 0 ? 0 : 1],
          x,
          0.005,
          z,
          1.94,
          0.025,
          1.94,
        );
    for (const x of [-6, 6]) {
      const segments = x < 0 && leftExit ? [{ z: -3.65, length: 4.7 }, { z: 3.65, length: 4.7 }] : [{ z: 0, length: 12 }];
      for (const { z, length } of segments) {
        box(this.root, stone, x, 0.45, z, 0.35, 0.9, length);
        box(this.root, band, x, 0.92, z, 0.4, 0.08, length);
        this.collision.add(x, z, 0.18, length / 2);
      }
    }
    for (const z of [-5.8, 5.8])
      for (const x of [-3.6, 3.6]) {
        box(this.root, stone, x, 0.35, z, 4.7, 0.7, 0.35);
        box(this.root, band, x, 0.72, z, 4.7, 0.08, 0.4);
        this.collision.add(x, z, 2.35, 0.18);
      }
    // Close the old opening when a hub exit moves to the left wall.
    if (leftExit) {
      const z = index === 0 ? 5.8 : -5.8;
      box(this.root, stone, 0, 0.35, z, 2.5, 0.7, 0.35);
      box(this.root, band, 0, 0.72, z, 2.5, 0.08, 0.4);
      this.collision.add(0, z, 1.25, 0.18);
    }
    roomDecoration(this.root, dungeon.theme, leftExit, room.id);
    for (const [i, pose] of [this.back, this.forward].entries()) {
      const doorway = portal(this.root, pose.x, pose.z, dungeon.theme);
      doorway.name = i === 0 ? "room-back-door" : "room-forward-door";
      doorway.rotation.y = pose.rotation;
      if (i === 0 && pose.rotation === 0) doorway.scale.y = 0.22;
      for (const side of [-1, 1]) this.collision.add(
        pose.x + Math.cos(pose.rotation) * side * 0.95,
        pose.z - Math.sin(pose.rotation) * side * 0.95,
        pose.rotation ? 0.28 : 0.25,
        pose.rotation ? 0.25 : 0.28,
      );
    }
    this.gate = box(
      this.root,
      material(palette.gate),
      this.forward.x,
      0.8,
      this.forward.z,
      1.4,
      1.6,
      0.18,
    );
    this.gate.rotation.y = this.forward.rotation;
    for (const x of [-5.2, 5.2])
      for (const z of [-4.4, 4.4]) {
        box(this.root, stone, x, 0.5, z, 0.65, 1, 0.65);
        ball(this.root, accent, x, 1.1, z, 0.2);
        this.collision.add(x, z, 0.34);
      }
    if (room.challenge) {
      if (room.challenge.reward > 0) {
        box(this.root, band, 0, 0.025, 0, 2.4, 0.04, 1.8);
        this.chest = new Chest(false);
        this.chest.root.position.set(0, 0, 0);
        this.root.add(this.chest.root);
        this.collision.add(0, 0, 0.56, 0.41);
      } else {
        box(this.root, stone, 0, 0.4, 0, 1.4, 0.8, 0.8);
        symbol("sun", this.root, 0, 0.85, 0, 1.2);
        this.collision.add(0, 0, 0.7, 0.4);
      }
      for (let i = 0; i < room.challenge.required; i++)
        this.lamps.push(
          ball(
            this.root,
            material("#979d87"),
            this.forward.x + Math.cos(this.forward.rotation) * (i - (room.challenge.required - 1) / 2) * 0.4,
            2.3,
            this.forward.z - Math.sin(this.forward.rotation) * (i - (room.challenge.required - 1) / 2) * 0.4,
            0.17,
          ),
        );
    }
    room.stones?.forEach((s, i) => {
      const track = material(palette.track);
      s.points.forEach(({ x, z }, slot) => {
        const next = s.points[slot + 1];
        if (next)
          box(
            this.root,
            track,
            (x + next.x) / 2,
            0.04,
            (z + next.z) / 2,
            Math.abs(next.x - x) + 1.1,
            0.06,
            Math.abs(next.z - z) + 1.1,
          );
        const tile = box(
          this.root,
          material("#f1e9ce"),
          x,
          0.1,
          z,
          1.2,
          0.1,
          1.1,
        );
        if (s.tiles[slot]) symbol(s.tiles[slot]!, this.root, x, 0.17, z, 1.15);
        if (slot === s.goal) this.tiles.push({ mesh: tile, stone: i });
      });
      const g = new THREE.Group();
      box(g, material(palette.block), 0, 0.42, 0, 0.92, 0.78, 0.92);
      box(g, material("#e7e1c5"), 0, 0.83, 0, 0.84, 0.06, 0.84);
      symbol(s.symbol, g, 0, 0.9, 0, 1.05);
      this.root.add(g);
      this.stones.push(g);
    });
    this.update(0, 0);
  }
  passages(state: GameState) {
    const index = this.dungeon.rooms.indexOf(this.room);
    const exit = this.dungeon.entranceWorld ? { world: this.dungeon.entranceWorld } : null;
    const passages: Passage[] = [
      {
        ...this.back,
        destination: index
          ? { dungeon: this.dungeon.id, room: this.dungeon.rooms[index - 1].id }
          : exit,
      },
    ];
    if (roomSolved(this.room, state.dungeons[this.dungeon.id]))
      passages.push({
        ...this.forward,
        destination:
          index < this.dungeon.rooms.length - 1
            ? {
                dungeon: this.dungeon.id,
                room: this.dungeon.rooms[index + 1].id,
              }
            : exit,
      });
    return passages;
  }
  interactions(state: GameState): Interaction[] {
    if (
      this.room.challenge &&
      !roomSolved(this.room, state.dungeons[this.dungeon.id])
    )
      return [
        {
          x: 0,
          z: 0,
          target: {
            kind: "challenge",
            id: this.room.challenge.id,
            label: this.chest ? "Öppna kistan" : "Öppna porten",
          },
        },
      ];
    return [];
  }
  pushHint(state: GameState, position: THREE.Vector3) {
    const p = state.dungeons[this.dungeon.id];
    if (state.motion || state.overlay || roomSolved(this.room, p)) return null;
    for (const [i, stone] of (this.room.stones ?? []).entries()) {
      const slot = p.stones[this.room.id][i];
      const { x, z } = stone.points[slot];
      for (const direction of [-1, 1] as const) {
        const next = pushedPosition(slot, direction, stone.points.length);
        if (next === null) continue;
        const destination = stone.points[next];
        const dx = Math.sign(destination.x - x),
          dz = Math.sign(destination.z - z);
        const behind = (x - position.x) * dx + (z - position.z) * dz;
        const sideways = Math.abs(
          (position.x - x) * dz - (position.z - z) * dx,
        );
        if (
          behind < 0.75 ||
          behind > 1.75 ||
          sideways > 0.55 ||
          !this.collision.free(destination.x, destination.z, 0.5) ||
          Math.hypot(position.x - destination.x, position.z - destination.z) <
            0.9
        )
          continue;
        return { x, z, index: i, direction, dx, dz };
      }
    }
    return null;
  }
  tryPush(position: THREE.Vector3, dx: number, dz: number) {
    const hint = this.pushHint(gameStore.getState(), position);
    if (!hint) return false;
    const forward = dx * hint.dx + dz * hint.dz;
    const sideways = Math.abs(dx * hint.dz - dz * hint.dx);
    if (forward <= 0 || sideways > forward * 0.65) return false;
    // Require contact on this step, from the side opposite the next track point.
    const distance =
      (hint.x - position.x - dx) * hint.dx +
      (hint.z - position.z - dz) * hint.dz;
    if (distance > 0.8) return false;
    return gameStore.pushStone(hint.index, hint.direction);
  }
  update(dt: number, _time: number) {
    const state = gameStore.getState(),
      p = state.dungeons[this.dungeon.id];
    const solved = roomSolved(this.room, p);
    this.gate.visible = !solved;
    this.collision.dynamic = solved
      ? []
      : [{ x: this.forward.x, z: this.forward.z, halfX: this.forward.rotation ? 0.12 : 0.7, halfZ: this.forward.rotation ? 0.7 : 0.12 }];
    this.lamps.forEach((l, i) =>
      (l.material as THREE.MeshStandardMaterial).color.set(
        i < p.answers[this.room.challenge!.id] ? "#ffe290" : "#979d87",
      ),
    );
    this.chest?.update(dt, solved);
    if (state.motion !== this.activeMotion) {
      this.activeMotion = state.motion;
      this.motionTime = 0;
    }
    if (!state.overlay) this.motionTime += dt;
    this.stones.forEach((g, i) => {
      const points = this.room.stones![i].points;
      const slot = p.stones[this.room.id][i];
      let { x, z } = points[slot];
      const motion = state.motion?.index === i ? state.motion : null;
      if (motion) {
        const t = Math.min(1, this.motionTime / 0.28);
        const eased = t * t * (3 - 2 * t);
        x = THREE.MathUtils.lerp(
          points[motion.from].x,
          points[motion.to].x,
          eased,
        );
        z = THREE.MathUtils.lerp(
          points[motion.from].z,
          points[motion.to].z,
          eased,
        );
      }
      g.position.set(x, 0, z);
      // Reserve the complete swept volume on either axis during a push.
      const from = motion ? points[motion.from] : { x, z };
      const to = motion ? points[motion.to] : { x, z };
      this.collision.dynamic.push({
        x: (from.x + to.x) / 2,
        z: (from.z + to.z) / 2,
        halfX: Math.abs(to.x - from.x) / 2 + 0.47,
        halfZ: Math.abs(to.z - from.z) / 2 + 0.47,
      });
    });
    this.tiles.forEach(({ mesh: tile, stone }) =>
      (tile.material as THREE.MeshStandardMaterial).color.set(
        p.stones[this.room.id][stone] === this.room.stones![stone].goal
          ? "#b3e8a0"
          : "#f1e9ce",
      ),
    );
    if (state.motion && this.motionTime >= 0.28) gameStore.finishMotion();
  }
  dispose() {
    disposeTree(this.root);
  }
}
