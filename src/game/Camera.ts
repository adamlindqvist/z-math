import { PerspectiveCamera, Vector3 } from "three";
export class GameCamera {
  camera = new PerspectiveCamera(39, 1, 0.1, 120);
  private focus = new Vector3(-1, 0, 0);
  private offset = new Vector3(8.33, 12.6, 14.28);
  private mode: "glade" | "room" = "glade";
  setMode(mode: "glade" | "room", position: Vector3) {
    this.mode = mode;
    this.focus.copy(
      mode === "room"
        ? new Vector3(0, 0, 0)
        : new Vector3(
            position.x,
            0,
            position.z * 0.3 + 0.9 + Math.max(0, position.z - 4) * 0.7,
          ),
    );
    this.update(position, 1);
  }
  resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
  update(position: Vector3, dt: number) {
    const desired =
      this.mode === "room"
        ? new Vector3(0, 0, 0)
        : new Vector3(
            position.x,
            0,
            position.z * 0.3 + 0.9 + Math.max(0, position.z - 4) * 0.7,
          );
    this.focus.lerp(desired, 1 - Math.exp(-dt * 3));
    const zoom =
      this.mode === "room"
        ? this.camera.aspect < 1
          ? 1.27
          : 1
        : this.camera.aspect < 1
          ? 1.25
          : 1;
    this.camera.position
      .copy(this.focus)
      .addScaledVector(
        this.mode === "room" ? new Vector3(0, 18, 12) : this.offset,
        zoom,
      );
    this.camera.lookAt(this.focus);
  }
}
