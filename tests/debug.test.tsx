// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import DebugMenu from "../src/components/DebugMenu";
import { CollisionSystem } from "../src/game/CollisionSystem";
import { DUNGEONS, roomSolved } from "../src/game/dungeons/definitions";
import { Input } from "../src/game/Input";
import { createGameStore, gameStore, SAVE_KEY } from "../src/store/gameStore";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

function memory() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
  };
}

describe("temporary debug sessions", () => {
  it("unlocks paths consistently, awards rooms once and protects the save", () => {
    const storage = memory();
    const store = createGameStore(storage);
    store.collect("path-1");
    const saved = storage.getItem(SAVE_KEY);

    store.openDebug();
    store.debugTravelTo({ dungeon: "moss", room: "treasure" });
    let state = store.getState();
    expect(state.debugActive).toBe(true);
    expect(roomSolved(DUNGEONS[0].rooms[0], state.dungeons.moss)).toBe(true);
    expect(roomSolved(DUNGEONS[0].rooms[1], state.dungeons.moss)).toBe(true);
    expect(state.rupees).toBe(1);

    store.debugCompleteCurrentRoom();
    store.debugCompleteCurrentRoom();
    state = store.getState();
    expect(state.rupees).toBe(6);
    expect(state.items).toEqual(
      expect.arrayContaining(["temple-sword", "temple-shield"]),
    );
    expect(state.dungeons.moss.rewards).toEqual(["treasure-lock"]);

    store.debugTravelTo({ dungeon: "fire", room: "stones" });
    state = store.getState();
    expect(state.bridgeUnlocked).toBe(true);
    expect(state.location).toEqual({ dungeon: "fire", room: "stones" });
    expect(roomSolved(DUNGEONS[1].rooms[0], state.dungeons.fire)).toBe(true);

    store.closeDebug();
    store.collect("path-2");
    expect(storage.getItem(SAVE_KEY)).toBe(saved);
    expect(createGameStore(storage).getState().collected).toEqual(["path-1"]);

    store.openDebug();
    store.debugEndSession();
    expect(store.getState()).toMatchObject({
      debugActive: false,
      debugNoclip: false,
      location: null,
      rupees: 1,
      collected: ["path-1"],
      overlay: null,
    });
  });

  it("starts over only inside the active test session", () => {
    const storage = memory();
    const store = createGameStore(storage);
    store.collect("path-1");
    store.openDebug();
    store.debugReset();
    expect(store.getState()).toMatchObject({
      debugActive: true,
      overlay: "debug",
      rupees: 0,
    });
    expect(createGameStore(storage).getState().rupees).toBe(1);
    store.debugEndSession();
    expect(store.getState().rupees).toBe(1);
  });
});

describe("debug movement", () => {
  it("ignores obstacles but keeps the player inside the area bounds", () => {
    const collision = new CollisionSystem(2, 3, 1);
    collision.add(0.5, 1, 0.4);
    const position = { x: 0, z: 1 };
    collision.moveWithinBounds(position, 1, 0);
    expect(position.x).toBe(1);
    collision.moveWithinBounds(position, 10, 10);
    expect(position).toEqual({ x: 1.68, z: 3.68 });
  });
});

describe("debug menu", () => {
  let host: HTMLDivElement;
  let root: Root;
  let input: Input;

  beforeEach(() => {
    if (gameStore.getState().debugActive) gameStore.debugEndSession();
    gameStore.reset();
    input = new Input();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => root.render(<DebugMenu />));
  });

  afterEach(() => {
    act(() => {
      if (gameStore.getState().debugActive) gameStore.debugEndSession();
      else if (gameStore.getState().overlay === "debug") gameStore.closeDebug();
    });
    act(() => root.unmount());
    input.dispose();
    host.remove();
  });

  it("opens with touch or F2, resets held input and lists every destination", () => {
    const opener = host.querySelector<HTMLButtonElement>(
      '[aria-label="Öppna debugmenyn"]',
    )!;
    act(() => opener.click());
    expect(gameStore.getState().overlay).toBe("debug");
    act(() =>
      host
        .querySelector<HTMLButtonElement>('[aria-label="Stäng debugmenyn"]')!
        .click(),
    );
    expect(gameStore.getState().overlay).toBeNull();
    act(() =>
      window.dispatchEvent(
        new KeyboardEvent("keydown", { code: "KeyW", bubbles: true }),
      ),
    );
    expect(input.direction().y).toBe(-1);
    act(() =>
      window.dispatchEvent(
        new KeyboardEvent("keydown", { code: "F2", bubbles: true }),
      ),
    );
    expect(gameStore.getState().overlay).toBe("debug");
    expect(input.direction()).toEqual({ x: 0, y: 0 });
    expect(host.querySelector('[role="dialog"]')).not.toBeNull();
    expect(host.textContent).toContain("Gläntan");
    const volcanoButton = Array.from(host.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Vulkanvärlden"),
    )!;
    expect(volcanoButton).toBeDefined();
    act(() => volcanoButton.click());
    expect(gameStore.getState().location).toEqual({ world: "volcano" });
    expect(gameStore.getState().debugActive).toBe(true);
    expect(volcanoButton.getAttribute("aria-current")).toBe("location");
    for (const dungeon of DUNGEONS)
      for (const room of dungeon.rooms)
        expect(host.textContent).toContain(`${dungeon.name} · ${room.name}`);

    act(() =>
      window.dispatchEvent(
        new KeyboardEvent("keydown", { code: "F2", bubbles: true }),
      ),
    );
    expect(gameStore.getState().overlay).toBeNull();
  });
});
