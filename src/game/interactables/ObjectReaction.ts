import { Object3D } from "three";
export type ReactionKind = "wobble" | "spin" | "lift" | "helmet" | "visor" | "candle" | "cloud";
/** A bounded local animation, replayable without saving click counters. */
export class ObjectReaction {
  private elapsed = 2;
  private basePosition;
  private baseRotation;
  private toggled = false;
  constructor(public object: Object3D, public kind: ReactionKind, private revealed = false) {
    this.basePosition = object.position.clone();
    this.baseRotation = object.rotation.clone();
    this.apply();
  }
  play(revealed: boolean) { this.elapsed = 0; this.toggled = !this.toggled; this.revealed = revealed; }
  update(dt: number) { this.elapsed = Math.min(2, this.elapsed + dt); this.apply(); }
  private apply() {
    const t = Math.min(1, this.elapsed / 0.8), pulse = Math.sin(t * Math.PI), decay = 1 - t;
    this.object.position.copy(this.basePosition);
    this.object.rotation.copy(this.baseRotation);
    switch (this.kind) {
      case "spin": this.object.rotation.y += t < 1 ? t * Math.PI * 2 : 0; break;
      case "lift": this.object.position.y += pulse * 0.35; break;
      case "helmet":
        if (this.revealed) {
          this.object.position.x += 0.45 * t;
          this.object.position.y -= 0.9 * t;
          this.object.rotation.z += 1.6 * t;
        }
        break;
      case "visor": this.object.rotation.x -= pulse * 1.2; break;
      case "candle": this.object.visible = !this.toggled; break;
      case "cloud": this.object.position.x += Math.sin(Math.min(1, this.elapsed / 2) * Math.PI) * 0.5; break;
      default: this.object.rotation.z += Math.sin(t * Math.PI * 4) * decay * 0.12;
    }
  }
}
