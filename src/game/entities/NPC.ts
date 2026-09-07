import { character } from "../models";
export class NPC {
  root = character("princess").root;
  constructor() {
    this.root.position.set(-3.5, 0, 1.3);
    this.root.rotation.y = 0.6;
  }
  update(time: number) {
    this.root.position.y = Math.sin(time * 1.7) * 0.025;
  }
}
