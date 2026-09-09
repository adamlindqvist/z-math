import { Group } from "three";
/** Visual progress is disposable; its permanent destination comes from puzzle state. */
export class SlidingBarrier {
  amount: number;
  constructor(public root: Group, private offset: number, opened: boolean, private duration = 1.5) {
    this.amount = opened ? 1 : 0;
    this.apply();
  }
  private apply() { const t = this.amount; this.root.position.x = this.offset * t * t * (3 - 2 * t); }
  update(dt: number, solved: boolean) {
    const before = this.amount;
    this.amount = solved ? Math.min(1, this.amount + dt / this.duration) : 0;
    this.apply();
    return before < 1 && this.amount === 1;
  }
  get opened() { return this.amount === 1; }
}
