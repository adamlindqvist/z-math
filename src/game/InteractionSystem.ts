import * as THREE from "three";
import { gameStore, type Target } from "../store/gameStore";
import type { Area, Interaction } from "./Area";
export class InteractionSystem {
  private fall: { world: Area; passage: import("./Area").Passage; elapsed: number; resetId: number } | null = null;
  get falling() { return this.fall !== null; }
  ring: THREE.Mesh;
  arrow: THREE.Mesh;
  constructor(scene: THREE.Scene) {
    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(0.68, 0.76, 40),
      new THREE.MeshBasicMaterial({
        color: "#fff3b0",
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
      }),
    );
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.08;
    scene.add(this.ring);
    const shape = new THREE.Shape();
    shape.moveTo(-0.55, -0.07);
    shape.lineTo(0.2, -0.07);
    shape.lineTo(0.2, -0.22);
    shape.lineTo(0.55, 0);
    shape.lineTo(0.2, 0.22);
    shape.lineTo(0.2, 0.07);
    shape.lineTo(-0.55, 0.07);
    shape.closePath();
    const geometry = new THREE.ShapeGeometry(shape);
    geometry.rotateX(-Math.PI / 2);
    this.arrow = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ color: "#fff5b3", side: THREE.DoubleSide }),
    );
    this.arrow.visible = false;
    scene.add(this.arrow);
  }
  update(position: THREE.Vector3, world: Area, time: number, dt = 0) {
    const state = gameStore.getState();
    if (this.fall && (this.fall.world !== world || this.fall.resetId !== state.resetId)) {
      this.fall = null;
      position.y = 0;
    }
    if (this.fall) {
      this.ring.visible = this.arrow.visible = false;
      gameStore.setTarget(null);
      if (state.overlay || state.motion) return;
      this.fall.elapsed += dt;
      position.y = -5 * Math.pow(Math.min(1, this.fall.elapsed / 1.1), 2);
      if (this.fall.elapsed >= 1.1) {
        gameStore.travelTo(this.fall.passage.destination);
        this.fall = null;
        position.y = 0;
      }
      return;
    }
    const choices = world
      .interactions(state, position)
      .map((o) => ({
        ...o,
        distance: Math.hypot(position.x - o.x, position.z - o.z),
      }))
      .filter((o) => inReach(position, o) && reachable(world, position, o))
      .sort((a, b) => a.distance - b.distance);
    const nearest = !state.overlay && !state.motion ? choices[0] : undefined;
    gameStore.setTarget(
      nearest?.target ??
        (state.riding && !state.overlay && !state.motion
          ? { kind: "horse", action: "dismount", label: "Kliv av" }
          : null),
    );
    this.ring.visible = !!nearest;
    const push = world.pushHint?.(state, position);
    this.arrow.visible = !!push;
    if (push) {
      this.arrow.position.set(push.x, 0.25, push.z + 0.8);
      this.arrow.rotation.y = Math.atan2(-push.dz, push.dx);
    }
    if (nearest) {
      this.ring.position.x = nearest.x;
      this.ring.position.z = nearest.z;
      this.ring.scale.setScalar(1 + Math.sin(time * 3) * 0.05);
    }
    if (!state.overlay && !state.motion && !state.riding) {
      const passage = world.passages(state).find((p) => {
        if (p.radius) return Math.hypot(position.x - p.x, position.z - p.z) < p.radius - 0.35;
        const rotation = p.rotation ?? 0;
        const dx = position.x - p.x,
          dz = position.z - p.z;
        const across = dx * Math.cos(rotation) - dz * Math.sin(rotation);
        const depth = dx * Math.sin(rotation) + dz * Math.cos(rotation);
        return Math.abs(across) < 0.55 && Math.abs(depth) < 0.28;
      });
      if (passage) {
        if (passage.fall) this.fall = { world, passage, elapsed: 0, resetId: state.resetId };
        else gameStore.travelTo(passage.destination);
        this.ring.visible = false;
        this.arrow.visible = false;
        return;
      }
    }
    if (!gameStore.getState().overlay) this.collect(position, world);
  }
  private collect(position: THREE.Vector3, world: Area) {
    world.rupees.forEach((rupee) => {
      if (
        rupee.root.visible &&
        Math.hypot(
          position.x - rupee.root.position.x,
          position.z - rupee.root.position.z,
        ) < 0.57
      )
        gameStore.collect(rupee.id);
    });
  }
}

/** Only objects explicitly marked by an area can respond to a nearby tap. */
export function pickInteraction(
  world: Area,
  position: THREE.Vector3,
  camera: THREE.Camera,
  point: THREE.Vector2,
): Target {
  const ray = new THREE.Raycaster();
  ray.setFromCamera(point, camera);
  const hit = ray.intersectObject(world.root, true)[0];
  let object: THREE.Object3D | null = hit?.object ?? null;
  while (object && !object.userData.target) object = object.parent;
  const target = object?.userData.target as Target | undefined;
  if (!target) return null;
  const choice = world
    .interactions(gameStore.getState(), position)
    .find((i) => JSON.stringify(i.target) === JSON.stringify(target));
  return choice &&
    inReach(position, choice) &&
    reachable(world, position, choice)
    ? target
    : null;
}

function inReach(position: THREE.Vector3, choice: Interaction) {
  if (choice.reach) {
    return Math.abs(position.x - choice.x) <= choice.reach.halfX &&
      Math.abs(position.z - choice.z) <= choice.reach.halfZ;
  }
  return Math.hypot(position.x - choice.x, position.z - choice.z) < 1.85;
}

// Mounting checks scenery without letting the parked horse block itself.
function reachable(world: Area, position: THREE.Vector3, choice: Interaction) {
  if (
    typeof choice.target === "object" &&
    choice.target?.kind === "horse" &&
    choice.target.action === "mount"
  )
    return world.riding?.canMountFrom(position) ?? false;
  return world.collision.visible(position, choice);
}
