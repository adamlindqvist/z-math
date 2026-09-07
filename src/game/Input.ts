import { gameStore } from "../store/gameStore";
export class Input {
  keys = new Set<string>();
  touch = { x: 0, y: 0 };
  private down = (e: KeyboardEvent) => {
    if (e.code === "Escape" && !e.repeat) {
      e.preventDefault();
      if (
        ["inventory", "itemReward"].includes(gameStore.getState().overlay ?? "")
      )
        gameStore.close();
      else gameStore.pause();
      return;
    }
    if ((e.target as HTMLElement)?.closest?.("button, input, textarea")) return;
    if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(
        e.code,
      )
    )
      e.preventDefault();
    if (gameStore.getState().overlay) return;
    this.keys.add(e.code);
    if (["KeyE", "Space"].includes(e.code) && !e.repeat) gameStore.interact();
  };
  private up = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };
  private blur = () => {
    this.reset();
  };
  private visibility = () => {
    if (document.hidden) this.blur();
  };
  private location = JSON.stringify(gameStore.getState().location);
  private resetId = gameStore.getState().resetId;
  private unsubscribe: () => void;
  constructor() {
    window.addEventListener("keydown", this.down);
    window.addEventListener("keyup", this.up);
    window.addEventListener("blur", this.blur);
    document.addEventListener("visibilitychange", this.visibility);
    this.unsubscribe = gameStore.subscribe(() => {
      const state = gameStore.getState();
      const location = JSON.stringify(state.location);
      if (
        state.overlay ||
        location !== this.location ||
        state.resetId !== this.resetId
      )
        this.reset();
      this.location = location;
      this.resetId = state.resetId;
    });
  }
  reset() {
    this.keys.clear();
    this.touch = { x: 0, y: 0 };
  }
  direction() {
    let x =
      Number(this.keys.has("KeyD") || this.keys.has("ArrowRight")) -
      Number(this.keys.has("KeyA") || this.keys.has("ArrowLeft")) +
      this.touch.x;
    let y =
      Number(this.keys.has("KeyS") || this.keys.has("ArrowDown")) -
      Number(this.keys.has("KeyW") || this.keys.has("ArrowUp")) +
      this.touch.y;
    const length = Math.hypot(x, y);
    if (length > 1) {
      x /= length;
      y /= length;
    }
    return { x, y };
  }
  dispose() {
    window.removeEventListener("keydown", this.down);
    window.removeEventListener("keyup", this.up);
    window.removeEventListener("blur", this.blur);
    document.removeEventListener("visibilitychange", this.visibility);
    this.unsubscribe();
  }
}
