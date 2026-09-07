import * as THREE from "three";
import { type Area, type Interaction, disposeTree } from "../Area";
import { CollisionSystem } from "../CollisionSystem";
import { Chest } from "../entities/Chest";
import { box, material, ball } from "../models";
import { gameStore, type GameState } from "../../store/gameStore";
import {
  TRACK_X,
  roomSolved,
  pushedPosition,
  type DungeonDefinition,
  type RoomDefinition,
} from "./definitions";
import { portal, symbol } from "./models";
export class DungeonArea implements Area {
  root = new THREE.Group();
  collision = new CollisionSystem(6.2, 6);
  spawn = { x: 0, z: 4.7 };
  cameraMode = "room" as const;
  rupees = [];
  private stones: THREE.Group[] = [];
  private tiles: { mesh: THREE.Mesh; stone: number }[] = [];
  private gate: THREE.Mesh;
  private lamps: THREE.Mesh[] = [];
  private chest?: Chest;
  private motionTime = 0;
  private activeMotion: GameState["motion"] = null;
  constructor(
    readonly dungeon: DungeonDefinition,
    readonly room: RoomDefinition,
  ) {
    const stone = material("#b7bea5"),
      floor = material("#d9d7bb"),
      moss = material("#8ba875");
    box(this.root, floor, 0, -0.2, 0, 12.4, 0.4, 12);
    for (let x = -5; x <= 5; x += 2)
      for (let z = -5; z <= 5; z += 2)
        box(
          this.root,
          material((x + z) % 4 === 0 ? "#e0ddc4" : "#d3d2b7"),
          x,
          0.005,
          z,
          1.94,
          0.025,
          1.94,
        );
    for (const x of [-6, 6]) {
      box(this.root, stone, x, 0.45, 0, 0.35, 0.9, 12);
      box(this.root, moss, x, 0.92, 0, 0.4, 0.08, 12);
      this.collision.add(x, 0, 0.18, 6);
    }
    for (const z of [-5.8, 5.8])
      for (const x of [-3.6, 3.6]) {
        box(this.root, stone, x, 0.35, z, 4.7, 0.7, 0.35);
        this.collision.add(x, z, 2.35, 0.18);
      }
    portal(this.root, 0, -5.35);
    portal(this.root, 0, 5.35).scale.y = 0.22;
    for (const z of [-5.35, 5.35])
      for (const x of [-0.95, 0.95]) this.collision.add(x, z, 0.25, 0.28);
    this.gate = box(
      this.root,
      material("#76917b"),
      0,
      0.8,
      -5.35,
      1.4,
      1.6,
      0.18,
    );
    for (const x of [-5.2, 5.2])
      for (const z of [-4.4, 4.4]) {
        box(this.root, stone, x, 0.5, z, 0.65, 1, 0.65);
        ball(this.root, material("#ffe5a0"), x, 1.1, z, 0.2);
        this.collision.add(x, z, 0.34);
      }
    if (room.challenge) {
      if (room.challenge.reward > 0) {
        this.chest = new Chest(false);
        this.chest.root.position.set(0, 0, -2.5);
        this.root.add(this.chest.root);
        this.collision.add(0, -2.5, 0.56, 0.41);
      } else {
        box(this.root, stone, 0, 0.4, -3, 1.4, 0.8, 0.8);
        symbol("sun", this.root, 0, 0.85, -3, 1.2);
        this.collision.add(0, -3, 0.7, 0.4);
      }
      for (let i = 0; i < room.challenge.required; i++)
        this.lamps.push(
          ball(
            this.root,
            material("#979d87"),
            (i - (room.challenge.required - 1) / 2) * 0.4,
            2.3,
            -5.35,
            0.17,
          ),
        );
    }
    room.stones?.forEach((s, i) => {
      box(this.root, material("#b9b59a"), 0, 0.04, s.z, 8.3, 0.06, 1.1);
      TRACK_X.forEach((x, slot) => {
        const tile = box(
          this.root,
          material("#f1e9ce"),
          x,
          0.1,
          s.z,
          1.2,
          0.1,
          1.1,
        );
        if (s.tiles[slot])
          symbol(s.tiles[slot]!, this.root, x, 0.17, s.z, 1.15);
        if (slot === s.goal) this.tiles.push({ mesh: tile, stone: i });
      });
      for (const x of [-4.15, 4.15])
        box(this.root, stone, x, 0.16, s.z, 0.15, 0.25, 1.15);
      const g = new THREE.Group();
      box(g, material("#a0ad9c"), 0, 0.42, 0, 0.92, 0.78, 0.92);
      box(g, material("#e7e1c5"), 0, 0.83, 0, 0.84, 0.06, 0.84);
      symbol(s.symbol, g, 0, 0.9, 0, 1.05);
      this.root.add(g);
      this.stones.push(g);
    });
    this.update(0, 0);
  }
  passages(state: GameState) {
    const index = this.dungeon.rooms.indexOf(this.room);
    const passages = [
      {
        x: 0,
        z: 5.35,
        destination: index
          ? { dungeon: this.dungeon.id, room: this.dungeon.rooms[index - 1].id }
          : null,
      },
    ];
    if (roomSolved(this.room, state.dungeons[this.dungeon.id]))
      passages.push({
        x: 0,
        z: -5.35,
        destination:
          index < this.dungeon.rooms.length - 1
            ? {
                dungeon: this.dungeon.id,
                room: this.dungeon.rooms[index + 1].id,
              }
            : null,
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
          z: this.chest ? -2.5 : -3,
          target: {
            kind: "challenge",
            id: this.room.challenge.id,
            label: this.chest ? "Öppna kistan" : "Tänd lamporna",
          },
        },
      ];
    return [];
  }
  pushHint(state: GameState, position: THREE.Vector3) {
    const p = state.dungeons[this.dungeon.id];
    if (state.motion || state.overlay || roomSolved(this.room, p)) return null;
    for (const [i, stone] of (this.room.stones ?? []).entries()) {
      const slot = p.stones[this.room.id][i],
        x = TRACK_X[slot];
      const dx = position.x - x;
      if (
        Math.abs(position.z - stone.z) > 0.55 ||
        Math.abs(dx) < 0.75 ||
        Math.abs(dx) > 1.75
      )
        continue;
      const direction = dx < 0 ? 1 : -1;
      const next = pushedPosition(slot, direction);
      if (
        next === null ||
        !this.collision.free(TRACK_X[next], stone.z, 0.5) ||
        Math.hypot(position.x - TRACK_X[next], position.z - stone.z) < 0.9
      )
        continue;
      return { x, z: stone.z, index: i, direction: direction as -1 | 1 };
    }
    return null;
  }
  tryPush(position: THREE.Vector3, dx: number, dz: number) {
    const hint = this.pushHint(gameStore.getState(), position);
    if (
      !hint ||
      Math.sign(dx) !== hint.direction ||
      Math.abs(dz) > Math.abs(dx) * 0.65
    )
      return false;
    // Contact must happen on this movement step; merely standing nearby does nothing.
    if (Math.abs(position.x + dx - hint.x) > 0.8) return false;
    return gameStore.pushStone(hint.index, hint.direction);
  }
  update(dt: number, _time: number) {
    const state = gameStore.getState(),
      p = state.dungeons[this.dungeon.id];
    const solved = roomSolved(this.room, p);
    this.gate.visible = !solved;
    this.collision.dynamic = solved
      ? []
      : [{ x: 0, z: -5.35, halfX: 0.7, halfZ: 0.12 }];
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
      const slot = p.stones[this.room.id][i];
      let x = TRACK_X[slot];
      const motion = state.motion?.index === i ? state.motion : null;
      if (motion) {
        const t = Math.min(1, this.motionTime / 0.28);
        x = THREE.MathUtils.lerp(
          TRACK_X[motion.from],
          TRACK_X[motion.to],
          t * t * (3 - 2 * t),
        );
      }
      const z = this.room.stones![i].z;
      g.position.set(x, 0, z);
      // Reserve the swept volume, including the destination, throughout a push.
      const left = motion
        ? Math.min(TRACK_X[motion.from], TRACK_X[motion.to])
        : x;
      const right = motion
        ? Math.max(TRACK_X[motion.from], TRACK_X[motion.to])
        : x;
      this.collision.dynamic.push({
        x: (left + right) / 2,
        z,
        halfX: (right - left) / 2 + 0.47,
        halfZ: 0.47,
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
