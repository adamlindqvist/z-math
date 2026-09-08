import * as THREE from "three";
import { gameStore } from "../store/gameStore";
import type { Area } from "./Area";
export class InteractionSystem {
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
  update(position: THREE.Vector3, world: Area, time: number) {
    const state = gameStore.getState();
    const choices = world
      .interactions(state, position)
      .map((o) => ({
        ...o,
        distance: Math.hypot(position.x - o.x, position.z - o.z),
      }))
      .filter((o) => o.distance < 1.85 && world.collision.visible(position, o))
      .sort((a, b) => a.distance - b.distance);
    const nearest = !state.overlay && !state.motion ? choices[0] : undefined;
    gameStore.setTarget(nearest?.target ?? null);
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
    if (!state.overlay && !state.motion) {
      const passage = world.passages(state).find((p) => {
        const rotation = p.rotation ?? 0;
        const dx = position.x - p.x,
          dz = position.z - p.z;
        const across = dx * Math.cos(rotation) - dz * Math.sin(rotation);
        const depth = dx * Math.sin(rotation) + dz * Math.cos(rotation);
        return Math.abs(across) < 0.55 && Math.abs(depth) < 0.28;
      });
      if (passage) {
        gameStore.travelTo(passage.destination);
        this.ring.visible = false;
        this.arrow.visible = false;
        return;
      }
    }
    if (!gameStore.getState().overlay)
      world.rupees.forEach((rupee) => {
        if (
          Math.hypot(
            position.x - rupee.root.position.x,
            position.z - rupee.root.position.z,
          ) < 0.57
        )
          gameStore.collect(rupee.id);
      });
  }
}
