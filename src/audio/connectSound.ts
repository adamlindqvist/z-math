import { gameStore } from "../store/gameStore";
import { sound } from "./sound";

export function connectSound() {
  const update = () =>
    sound.block(
      "pause",
      ["pause", "reset", "debug"].includes(gameStore.getState().overlay ?? ""),
    );
  const hide = () => sound.block("hidden", document.hidden);
  const blur = () => sound.block("blur", true);
  const focus = () => sound.block("blur", false);
  const unsubscribe = gameStore.subscribeSound(sound.play);
  const unsubscribeState = gameStore.subscribe(update);
  // Capture does not prevent default or interfere with simultaneous game touches.
  window.addEventListener("pointerdown", sound.unlock, true);
  window.addEventListener("touchend", sound.unlock, true);
  window.addEventListener("keydown", sound.unlock, true);
  window.addEventListener("blur", blur);
  window.addEventListener("focus", focus);
  document.addEventListener("visibilitychange", hide);
  update();
  hide();
  return () => {
    unsubscribe();
    unsubscribeState();
    window.removeEventListener("pointerdown", sound.unlock, true);
    window.removeEventListener("touchend", sound.unlock, true);
    window.removeEventListener("keydown", sound.unlock, true);
    window.removeEventListener("blur", blur);
    window.removeEventListener("focus", focus);
    document.removeEventListener("visibilitychange", hide);
    sound.dispose();
  };
}
