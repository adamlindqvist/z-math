import type { Location } from "./dungeons/definitions";
import * as THREE from "three";
import type { GameState, Target } from "../store/gameStore";
import type { CollisionSystem } from "./CollisionSystem";
import type { Collectible } from "./entities/Collectible";
export interface Interaction {
  target: Target;
  x: number;
  z: number;
}
export interface Passage {
  rotation?: number;
  x: number;
  z: number;
  destination: Location;
}
export interface PushHint {
  x: number;
  z: number;
  index: number;
  direction: -1 | 1;
  dx: number;
  dz: number;
}
export interface Area {
  root: THREE.Group;
  collision: CollisionSystem;
  spawn: { x: number; z: number };
  cameraMode: "glade" | "room";
  rupees: Collectible[];
  passages(state: GameState): Passage[];
  pushHint?(state: GameState, position: THREE.Vector3): PushHint | null;
  tryPush?(position: THREE.Vector3, dx: number, dz: number): boolean;
  interactions(state: GameState, position: THREE.Vector3): Interaction[];
  update(dt: number, time: number): void;
  dispose(): void;
}
export function disposeTree(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      geometries.add(o.geometry);
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
        materials.add(m),
      );
    }
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  root.removeFromParent();
}
