import { PerspectiveCamera, Vector3 } from "three";
export class GameCamera {
  camera = new PerspectiveCamera(39, 1, 0.1, 120);
  private focus = new Vector3(-1, 0, 0);
  private offset = new Vector3(8.33, 12.6, 14.28);
  resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
  update(position: Vector3, dt: number) {
    const desired = new Vector3(position.x * 0.3, 0, position.z * 0.3 + 0.9);
    this.focus.lerp(desired, 1 - Math.exp(-dt * 3));
    const zoom = this.camera.aspect < 1 ? 1.25 : 1;
    this.camera.position.copy(this.focus).addScaledVector(this.offset, zoom);
    this.camera.lookAt(this.focus);
  }
}
