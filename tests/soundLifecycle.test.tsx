// @vitest-environment jsdom
import { act, StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { connectSound } from "../src/audio/connectSound";
import { sound } from "../src/audio/sound";
import { gameStore } from "../src/store/gameStore";
import { SoundButton } from "../src/components/SoundButton";
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
it("cleans subscriptions and activation listeners across StrictMode remounts", () => {
  gameStore.reset();
  const play = vi.spyOn(sound, "play").mockImplementation(() => {});
  const unlock = vi.spyOn(sound, "unlock").mockImplementation(() => {});
  const block = vi.spyOn(sound, "block");
  function Binding() {
    useEffect(connectSound, []);
    return <SoundButton />;
  }
  const host = document.createElement("div");
  const root = createRoot(host);
  act(() =>
    root.render(
      <StrictMode>
        <Binding />
      </StrictMode>,
    ),
  );
  gameStore.collect("path-1");
  expect(play).toHaveBeenCalledExactlyOnceWith("rupee");
  window.dispatchEvent(new Event("pointerdown"));
  expect(unlock).toHaveBeenCalledOnce();
  act(() => gameStore.pause());
  expect(block).toHaveBeenCalledWith("pause", true);
  window.dispatchEvent(new Event("blur"));
  expect(block).toHaveBeenCalledWith("blur", true);
  window.dispatchEvent(new Event("focus"));
  expect(block).toHaveBeenCalledWith("blur", false);
  document.dispatchEvent(new Event("visibilitychange"));
  expect(block).toHaveBeenCalledWith("hidden", document.hidden);
  act(() => host.querySelector("button")!.click());
  expect(sound.getEnabled()).toBe(false);
  gameStore.reset();
  expect(sound.getEnabled()).toBe(false);
  act(() => root.unmount());
  gameStore.collect("path-2");
  window.dispatchEvent(new Event("pointerdown"));
  expect(play).toHaveBeenCalledTimes(1);
  expect(unlock).toHaveBeenCalledTimes(1);
  sound.setEnabled(true);
  vi.restoreAllMocks();
});
