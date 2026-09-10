// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import * as THREE from "three";
import { CharacterPreview } from "../src/components/CharacterPreview";
import { ShopDialog } from "../src/components/Shop";
import { InventoryDialog } from "../src/components/Inventory";
import { gameStore } from "../src/store/gameStore";
import {
  freshInventory,
  type Equipment,
  type ItemId,
} from "../src/items/definitions";
import { applyEquipment, heroModel } from "../src/game/heroModel";
import { disposeTree } from "../src/game/Area";

const renderer = vi.hoisted(() => ({
  render: vi.fn(),
  dispose: vi.fn(),
  setPixelRatio: vi.fn(),
  setSize: vi.fn(),
}));
vi.mock("three", async (original) => ({
  ...(await original<typeof import("three")>()),
  WebGLRenderer: class {
    constructor() {
      return renderer;
    }
  },
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let host: HTMLDivElement, root: Root;
const disconnect = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect = disconnect;
    },
  );
  gameStore.debugEndSession();
  gameStore.reset();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});
const click = (name: string) =>
  act(() => {
    const button = [...host.querySelectorAll("button")].find(
      (b) =>
        b.textContent?.trim().startsWith(name) ||
        b.getAttribute("aria-label") === name,
    )!;
    expect(button).toBeDefined();
    button.click();
  });
const shown = () =>
  (renderer.render.mock.calls.at(-1)![0] as THREE.Scene).getObjectByName(
    "hero",
  )!;
const pointer = (type: string, x: number, id = 1) =>
  act(() => {
    const event = new Event(type, { bubbles: true });
    Object.assign(event, { clientX: x, pointerId: id, pointerType: "touch" });
    host.querySelector("canvas")!.dispatchEvent(event);
  });

it("shares every equipment variant without sharing model resources", () => {
  const first = heroModel(),
    second = heroModel();
  const groups: [keyof Equipment, [ItemId, string][]][] = [
    [
      "head",
      [
        ["base-hat", "base-hat"],
        ["green-hat", "green-hat"],
        ["royal-crown", "royal-crown"],
      ],
    ],
    [
      "weapon",
      [
        ["wooden-sword", "wood-sword"],
        ["temple-sword", "sword"],
        ["fire-sword", "fire-sword"],
      ],
    ],
    [
      "shield",
      [
        ["wooden-shield", "wood-shield"],
        ["temple-shield", "shield"],
        ["fire-shield", "fire-shield"],
      ],
    ],
  ];
  for (const [slot, variants] of groups)
    for (const id of [null, ...variants.map((v) => v[0])]) {
      applyEquipment(first, { ...freshInventory().equipment, [slot]: id });
      for (const [item, name] of variants)
        expect(first.root.getObjectByName(name)!.visible).toBe(item === id);
    }
  applyEquipment(first, { ...freshInventory().equipment, body: "blue-tunic" });
  expect(first.coat.color.getHexString()).toBe("3489cb");
  expect(second.coat.color.getHexString()).toBe("36964a");
  applyEquipment(first, freshInventory().equipment);
  expect(first.coat.color.getHexString()).toBe("36964a");
  const resources = (model: ReturnType<typeof heroModel>) => {
    const set = new Set<unknown>();
    model.root.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        set.add(o.geometry);
        for (const m of Array.isArray(o.material) ? o.material : [o.material])
          set.add(m);
      }
    });
    return set;
  };
  const firstResources = resources(first);
  for (const resource of resources(second))
    expect(firstResources.has(resource)).toBe(false);
  disposeTree(first.root);
  disposeTree(second.root);
});

it("previews shop choices without spending or equipping and keeps Ta på open", () => {
  act(() => {
    gameStore.openDebug();
    gameStore.debugOpenShop();
    root.render(<ShopDialog />);
  });
  const before = gameStore.getState();
  click("Träsvärd");
  expect(shown().getObjectByName("wood-sword")!.visible).toBe(true);
  expect(gameStore.getState().equipment).toEqual(before.equipment);
  expect(gameStore.getState().rupees).toBe(before.rupees);
  click("Alla varor");
  expect(shown().getObjectByName("wood-sword")!.visible).toBe(false);
  click("Blå tunika");
  click("Köp");
  expect(gameStore.getState().equipment.body).toBe("green-clothes");
  click("Ta på");
  expect(gameStore.getState().overlay).toBe("shop");
  expect(gameStore.getState().equipment.body).toBe("blue-tunic");
  expect(gameStore.getState().rupees).toBe(before.rupees - 20);
  expect(host.textContent).not.toContain("Provar:");
  click("Fortsätt handla");
  click("Spela vidare");
  expect(gameStore.getState().overlay).toBeNull();
});

it("allows trying unaffordable items and updates the bag immediately", () => {
  act(() => {
    gameStore.travelTo({ castle: "hall" });
    gameStore.travelTo({ castle: "shop" });
    gameStore.setTarget({
      kind: "shop",
      itemId: "wooden-shield",
      label: "Titta",
    });
    gameStore.interact();
    root.render(<ShopDialog />);
  });
  expect(shown().getObjectByName("wood-shield")!.visible).toBe(true);
  expect(
    [...host.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("25 rupees"),
    )?.disabled,
  ).toBe(true);
  expect(gameStore.getState().items).not.toContain("wooden-shield");
  act(() => {
    gameStore.close();
    gameStore.openInventory();
    root.render(<InventoryDialog />);
  });
  click("Ta av grön mössa");
  expect(shown().getObjectByName("base-hat")!.visible).toBe(false);
  click("Ta på grön mössa");
  expect(shown().getObjectByName("base-hat")!.visible).toBe(true);
});

it("preserves angle across equipment updates, cancels dragging and releases resources", () => {
  act(() =>
    root.render(<CharacterPreview equipment={freshInventory().equipment} />),
  );
  const canvas = host.querySelector("canvas")!;
  canvas.setPointerCapture = vi.fn();
  canvas.hasPointerCapture = () => true;
  canvas.releasePointerCapture = vi.fn();
  Object.defineProperty(canvas, "clientWidth", { value: 300 });
  const initial = shown().rotation.y;
  pointer("pointerdown", 10);
  pointer("pointermove", 85);
  expect(shown().rotation.y).toBeCloseTo(initial + Math.PI / 2);
  for (const stop of [
    "pointerup",
    "pointercancel",
    "lostpointercapture",
    "blur",
    "visibilitychange",
  ]) {
    pointer("pointerdown", 85);
    if (stop === "blur") act(() => window.dispatchEvent(new Event(stop)));
    else if (stop === "visibilitychange")
      act(() => document.dispatchEvent(new Event(stop)));
    else pointer(stop, 85);
    const angle = shown().rotation.y;
    pointer("pointermove", 150);
    expect(shown().rotation.y).toBe(angle);
  }
  const angle = shown().rotation.y;
  act(() =>
    root.render(
      <CharacterPreview
        equipment={{ ...freshInventory().equipment, head: "royal-crown" }}
      />,
    ),
  );
  expect(shown().rotation.y).toBe(angle);
  const hero = shown();
  const geometry = (hero.getObjectByName("crown-band") as THREE.Mesh).geometry;
  const dispose = vi.spyOn(geometry, "dispose");
  act(() => root.render(null));
  expect(dispose).toHaveBeenCalledOnce();
  expect(renderer.dispose).toHaveBeenCalledOnce();
  expect(disconnect).toHaveBeenCalledOnce();
  act(() =>
    root.render(<CharacterPreview equipment={freshInventory().equipment} />),
  );
  expect(shown().rotation.y).toBe(initial);
});

it("contains rendering and context-loss errors inside the preview", () => {
  renderer.render.mockImplementationOnce(() => {
    throw Error("GPU");
  });
  act(() =>
    root.render(<CharacterPreview equipment={freshInventory().equipment} />),
  );
  expect(host.textContent).toContain("Gubben kunde inte visas");
  act(() => root.render(null));
  act(() =>
    root.render(<CharacterPreview equipment={freshInventory().equipment} />),
  );
  act(() =>
    host
      .querySelector("canvas")!
      .dispatchEvent(new Event("webglcontextlost", { cancelable: true })),
  );
  expect(host.textContent).toContain("Gubben kunde inte visas");
  const calls = renderer.render.mock.calls.length;
  pointer("pointerdown", 0);
  pointer("pointermove", 100);
  expect(renderer.render).toHaveBeenCalledTimes(calls);
});
