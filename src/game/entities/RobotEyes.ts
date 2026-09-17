import { AdditiveBlending, CylinderGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial } from "three";

/** Shared red eyes and completion lasers, independent of decorative lights. */
export class RobotEyes extends MeshStandardMaterial {
  private templeCompleted = false;
  private beams: Group[] = [];
  // Beyond the camera's far plane, even on the scaled-down lizard.
  private beamGeometry = new CylinderGeometry(1, 1, 1000, 6, 1, true)
    .rotateX(Math.PI / 2).translate(0, 0, 500);
  private core = new MeshBasicMaterial({ color: "#ff6969", toneMapped: false, fog: false });
  private glow = new MeshBasicMaterial({
    color: "#ff1010", transparent: true, opacity: 0.28,
    blending: AdditiveBlending, depthWrite: false, toneMapped: false, fog: false,
  });

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

  /** Attach at the lens in its moving parent's coordinates; local +Z is forward. */
  addLaser(parent: Group, x: number, y: number, z: number) {
    const beam = new Group();
    beam.name = "robot-eye-laser";
    beam.position.set(x, y, z);
    beam.visible = this.templeCompleted;
    const core = new Mesh(this.beamGeometry, this.core);
    core.scale.set(0.014, 0.014, 1);
    const glow = new Mesh(this.beamGeometry, this.glow);
    glow.scale.set(0.045, 0.045, 1);
    // The lasers are decorative and must not intercept touch interaction rays.
    core.raycast = glow.raycast = () => {};
    beam.add(core, glow);
    parent.add(beam);
    this.beams.push(beam);
  }

  setTempleCompleted(completed: boolean) {
    if (completed === this.templeCompleted) return;
    this.templeCompleted = completed;
    this.beams.forEach((beam) => { beam.visible = completed; });
  }
}
