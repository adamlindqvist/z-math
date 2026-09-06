// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { Scene } from "three";
import { Input } from "../src/game/Input";
import { Player } from "../src/game/Player";
import { World } from "../src/game/World";
import { InteractionSystem } from "../src/game/InteractionSystem";
import { gameStore } from "../src/store/gameStore";
import { Dialogue } from "../src/components/Dialogue";
import { MathQuiz } from "../src/components/MathQuiz";
import { TouchControls } from "../src/components/TouchControls";
import { HUD } from "../src/components/HUD";
import type { Game } from "../src/game/Game";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let root: Root, host: HTMLDivElement, input: Input;
const button = (text: string) =>
  Array.from(host.querySelectorAll("button")).find((b) =>
    b.textContent?.includes(text),
  )!;
const click = (text: string) => act(() => button(text).click());
const key = (code: string, down = true) =>
  act(() =>
    document.body.dispatchEvent(
      new KeyboardEvent(down ? "keydown" : "keyup", { code, bubbles: true }),
    ),
  );
const pointer = (el: Element, type: string, id: number, x: number, y: number) =>
  act(() => {
    const event = new Event(type, { bubbles: true });
    Object.assign(event, { pointerId: id, clientX: x, clientY: y });
    el.dispatchEvent(event);
  });
beforeEach(() => {
  gameStore.reset();
  input = new Input();
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() =>
    root.render(
      <>
        <HUD />
        <TouchControls game={{ current: { input } as Game }} />
        <Dialogue />
        <MathQuiz />
      </>,
    ),
  );
});
afterEach(() => {
  act(() => root.unmount());
  input.dispose();
  host.remove();
  vi.useRealTimers();
});

describe("playable controls and interface", () => {
  it("normalizes diagonal motion and stops input during overlays and lost focus", () => {
    key("KeyW");
    key("KeyD");
    expect(Math.hypot(input.direction().x, input.direction().y)).toBeCloseTo(1);
    key("Escape");
    expect(gameStore.getState().overlay).toBe("pause");
    expect(input.direction()).toEqual({ x: 0, y: 0 });
    act(() =>
      button("Fortsätt").dispatchEvent(
        new KeyboardEvent("keydown", { code: "Escape", bubbles: true }),
      ),
    );
    expect(gameStore.getState().overlay).toBeNull();
    key("KeyD");
    act(() => window.dispatchEvent(new Event("blur")));
    expect(input.direction()).toEqual({ x: 0, y: 0 });
    expect(gameStore.getState().overlay).toBe("pause");
  });
  it("supports one joystick pointer while another finger interacts or lifts", () => {
    const joystick = host.querySelector(".joystick")!;
    Object.assign(joystick, {
      setPointerCapture: () => {},
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        width: 126,
        height: 126,
      }),
    });
    pointer(joystick, "pointerdown", 1, 102, 63);
    expect(input.direction().x).toBeCloseTo(1);
    pointer(joystick, "pointerdown", 2, 24, 63);
    pointer(joystick, "pointerup", 2, 24, 63);
    expect(input.direction().x).toBeCloseTo(1);
    pointer(joystick, "pointercancel", 1, 102, 63);
    expect(input.direction()).toEqual({ x: 0, y: 0 });
    pointer(joystick, "pointerdown", 3, 102, 63);
    act(() => gameStore.setTarget("npc"));
    click("Prata med Maja");
    expect(gameStore.getState().overlay).toBe("npc");
    expect(input.direction()).toEqual({ x: 0, y: 0 });
    expect(host.querySelector(".joystick")).toBeNull();
  });
  it("reaches the NPC with actual camera-relative movement and E interaction", () => {
    const player = new Player(),
      world = new World(),
      interaction = new InteractionSystem(new Scene());
    key("KeyD");
    act(() => {
      for (let i = 0; i < 24; i++) {
        player.update(1 / 60, input, world.collision);
        interaction.update(player.position, world, i / 60);
      }
    });
    key("KeyD", false);
    expect(gameStore.getState().target).toBe("npc");
    key("KeyE");
    expect(host.textContent).toContain("Hej, lilla äventyrare!");
    click("Jag letar efter skatten!");
    expect(gameStore.getState().talkedToNpc).toBe(true);
  });
  it("completes the quiz UI after a retry and opens the chest with a single reward", () => {
    vi.useFakeTimers();
    act(() => gameStore.setTarget("chest"));
    click("Öppna kistan");
    click("Lös mattelåset");
    const q = gameStore.getState().question!;
    expect(host.querySelectorAll(".answer-button")).toHaveLength(4);
    const wrong = q.answers.find((n) => n !== q.correctAnswer)!;
    act(() =>
      Array.from(host.querySelectorAll<HTMLButtonElement>(".answer-button"))
        .find((b) => b.textContent === String(wrong))!
        .click(),
    );
    expect(host.textContent).toContain("Försök igen!");
    expect(gameStore.getState().coins).toBe(0);
    act(() =>
      Array.from(host.querySelectorAll<HTMLButtonElement>(".answer-button"))
        .find((b) => b.textContent === String(q.correctAnswer))!
        .click(),
    );
    expect(host.textContent).toContain("Helt rätt!");
    act(() => vi.advanceTimersByTime(1100));
    expect(host.querySelector('[aria-label="Kistans mattelås"]')).toBeNull();
    expect(gameStore.getState().coins).toBe(5);
    expect(gameStore.getState().reward).toBe(5);
    click("Undersök kistan");
    expect(host.textContent).toContain("Kistan är tom nu");
    expect(gameStore.getState().coins).toBe(5);
  });
  it("keeps the entire path to the treasure traversable", () => {
    const player = new Player();
    const world = new World();
    const interaction = new InteractionSystem(new Scene());
    const waypoints = [
      [-4.6, 3],
      [-1.3, 2.6],
      [1.8, 0.6],
      [4.1, -1.8],
      [5, -2.8],
    ];
    act(() => {
      for (const [x, z] of waypoints) {
        let steps = 0;
        while (
          Math.hypot(player.position.x - x, player.position.z - z) > 0.1 &&
          steps++ < 600
        ) {
          const dx = x - player.position.x,
            dz = z - player.position.z;
          const length = Math.hypot(dx, dz);
          input.touch = {
            x: (dx * 0.864 - dz * 0.504) / length,
            y: (dx * 0.504 + dz * 0.864) / length,
          };
          player.update(1 / 60, input, world.collision);
          interaction.update(player.position, world, steps / 60);
        }
        expect(steps).toBeLessThan(600);
      }
    });
    expect(gameStore.getState().coins).toBe(4);
    expect(gameStore.getState().target).toBe("chest");
    click("Öppna kistan");
    click("Lös mattelåset");
    const correct = gameStore.getState().question!.correctAnswer;
    act(() =>
      Array.from(host.querySelectorAll<HTMLButtonElement>(".answer-button"))
        .find((b) => b.textContent === String(correct))!
        .click(),
    );
    expect(gameStore.getState().coins).toBe(9);
  });
  it("requires confirmation for reset and keeps progress when cancelled", () => {
    act(() => gameStore.collect("path-1"));
    key("Escape");
    click("Börja om");
    click("Behåll mitt äventyr");
    expect(gameStore.getState().coins).toBe(1);
    click("Börja om");
    click("Ja, börja om");
    expect(gameStore.getState().coins).toBe(0);
    expect(gameStore.getState().overlay).toBeNull();
  });
});
