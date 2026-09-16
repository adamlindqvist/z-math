import { MeshStandardMaterial } from "three";

/** Shared eye palette, independent of the robots' decorative lights. */
export class RobotEyes extends MeshStandardMaterial {
  private templeCompleted = false;

  constructor() {
    super({
      color: "#ff3030",
      emissive: "#ff1010",
      emissiveIntensity: 3,
      // Keep the eyes bright even in shadow and under the world's tone mapping.
      toneMapped: false,
      roughness: 0.35,
    });
    this.name = "robot-eyes";
  }

  setTempleCompleted(completed: boolean) {
    if (completed === this.templeCompleted) return;
    this.templeCompleted = completed;
    this.color.set(completed ? "#308cff" : "#ff3030");
    this.emissive.set(completed ? "#1060ff" : "#ff1010");
  }
}
