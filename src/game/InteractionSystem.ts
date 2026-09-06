import * as THREE from "three";
import { gameStore } from "../store/gameStore";
import type { World } from "./World";
export class InteractionSystem {
  ring: THREE.Mesh;
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
  }
  update(position: THREE.Vector3, world: World, time: number) {
    const choices = (
      [
        { id: "npc", root: world.npc.root },
        { id: "chest", root: world.chest.root },
      ] as const
    )
      .map((o) => ({
        ...o,
        distance: Math.hypot(
          position.x - o.root.position.x,
          position.z - o.root.position.z,
        ),
      }))
      .sort((a, b) => a.distance - b.distance);
    const nearest = choices[0].distance < 1.85 ? choices[0] : null;
    gameStore.setTarget(nearest?.id ?? null);
    this.ring.visible = !!nearest;
    if (nearest) {
      this.ring.position.x = nearest.root.position.x;
      this.ring.position.z = nearest.root.position.z;
      this.ring.scale.setScalar(1 + Math.sin(time * 3) * 0.05);
    }
    if (!gameStore.getState().overlay)
      world.coins.forEach((c) => {
        if (
          Math.hypot(
            position.x - c.root.position.x,
            position.z - c.root.position.z,
          ) < 0.57
        )
          gameStore.collect(c.id);
      });
  }
}
