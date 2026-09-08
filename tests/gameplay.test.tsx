import { InventoryDialog } from "../src/components/Inventory";
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
    Object.assign(event, {
      pointerId: id,
      pointerType: "touch",
      clientX: x,
      clientY: y,
    });
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
        <InventoryDialog />
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
  it("normalizes diagonal motion and stops input without pausing on lost focus", () => {
    key("KeyW");
    key("KeyD");
    expect(Math.hypot(input.direction().x, input.direction().y)).toBeCloseTo(1);
    key("Escape");
    expect(gameStore.getState().overlay).toBe("pause");
    expect(input.direction()).toEqual({ x: 0, y: 0 });
    act(() =>
      button("Spela vidare").dispatchEvent(
        new KeyboardEvent("keydown", { code: "Escape", bubbles: true }),
      ),
    );
    expect(gameStore.getState().overlay).toBeNull();
    key("KeyD");
    act(() => window.dispatchEvent(new Event("blur")));
    expect(input.direction()).toEqual({ x: 0, y: 0 });
    expect(gameStore.getState().overlay).toBeNull();
  });
  it("supports one joystick pointer while another finger interacts or lifts", () => {
    const joystick = host.querySelector('[data-testid="joystick"]')!;
    Object.assign(joystick, {
      setPointerCapture: () => {},
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        width: 160,
        height: 160,
      }),
    });
    pointer(joystick, "pointerdown", 1, 122, 80);
    expect(input.direction().x).toBeCloseTo(1);
    pointer(joystick, "pointerdown", 2, 38, 80);
    pointer(joystick, "pointerup", 2, 38, 80);
    expect(input.direction().x).toBeCloseTo(1);
    pointer(joystick, "pointercancel", 1, 122, 80);
    expect(input.direction()).toEqual({ x: 0, y: 0 });
    pointer(joystick, "pointerdown", 3, 122, 80);
    act(() => gameStore.setTarget("npc"));
    click("Prata");
    expect(gameStore.getState().overlay).toBe("npc");
    expect(input.direction()).toEqual({ x: 0, y: 0 });
    expect(host.querySelector('[data-testid="joystick"]')).toBeNull();
  });
  it("activates the action on a second touch without relying on a synthetic click", () => {
    const joystick = host.querySelector('[data-testid="joystick"]')!;
    Object.assign(joystick, {
      setPointerCapture: () => {},
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        width: 160,
        height: 160,
      }),
    });
    act(() => gameStore.setTarget("npc"));
    pointer(joystick, "pointerdown", 1, 122, 80);
    expect(input.direction().x).toBe(1);
    const action = button("Prata");
    pointer(action, "pointerdown", 2, 400, 80);
    expect(input.direction().x).toBe(1);
    pointer(action, "pointerup", 2, 400, 80);
    expect(gameStore.getState().overlay).toBe("npc");
    expect(input.direction()).toEqual({ x: 0, y: 0 });
    pointer(joystick, "pointerup", 1, 122, 80);
    expect(gameStore.getState().overlay).toBe("npc");
  });
  it("scales joystick travel and clears input on lost capture or hidden page", () => {
    const joystick = host.querySelector('[data-testid="joystick"]')!;
    Object.assign(joystick, {
      setPointerCapture: () => {},
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        width: 200,
        height: 200,
      }),
    });
    pointer(joystick, "pointerdown", 1, 131, 100);
    expect(input.direction().x).toBeCloseTo(0.5);
    pointer(joystick, "pointermove", 1, 300, 100);
    expect(input.direction().x).toBe(1);
    pointer(joystick, "lostpointercapture", 1, 300, 100);
    expect(input.direction()).toEqual({ x: 0, y: 0 });
    pointer(joystick, "pointerdown", 2, 162, 100);
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(input.direction()).toEqual({ x: 0, y: 0 });
    hidden.mockRestore();
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
    click("Leta efter kistan");
    expect(gameStore.getState().talkedToNpc).toBe(true);
  });
  it("completes three quiz questions after a retry and opens the chest with a single reward", () => {
    vi.useFakeTimers();
    act(() =>
      gameStore.setTarget({ kind: "chest", id: "glade", label: "Öppna" }),
    );
    click("Öppna");
    click("Räkna!");
    const q = gameStore.getState().question!;
    expect(host.querySelectorAll('[data-testid="answer"]')).toHaveLength(4);
    const wrong = q.answers.find((n) => n !== q.correctAnswer)!;
    act(() =>
      Array.from(
        host.querySelectorAll<HTMLButtonElement>('[data-testid="answer"]'),
      )
        .find((b) => b.textContent === String(wrong))!
        .click(),
    );
    expect(host.querySelector('[role="status"]')?.textContent).toContain(
      "Inte rätt än. Prova igen!",
    );
    expect(
      host.querySelector(`[aria-label="${wrong}, inte rätt, prova igen"]`),
    ).not.toBeNull();
    expect(gameStore.getState().question).toBe(q);
    expect(gameStore.getState().rupees).toBe(0);
    for (let index = 0; index < 3; index++) {
      const correct = gameStore.getState().question!.correctAnswer;
      act(() =>
        Array.from(
          host.querySelectorAll<HTMLButtonElement>('[data-testid="answer"]'),
        )
          .find((b) => b.textContent === String(correct))!
          .click(),
      );
      expect(gameStore.getState().quizCorrectAnswers).toBe(index + 1);
      expect(gameStore.getState().rupees).toBe(index === 2 ? 5 : 0);
      expect(host.textContent).toContain(
        index === 2 ? "Tre rätt!" : "Bra jobbat!",
      );
      expect(
        host.querySelector(`[aria-label="${correct}, rätt svar"]`),
      ).not.toBeNull();
      expect(host.querySelector('[aria-label*="inte rätt"]')).toBeNull();
      act(() => vi.advanceTimersByTime(500));
      expect(gameStore.getState().feedback).toBe(
        index === 2 ? "complete" : "correct",
      );
      act(() => vi.advanceTimersByTime(600));
      expect(host.querySelector('[aria-label*="rätt svar"]')).toBeNull();
    }
    expect(host.querySelector('[aria-label="Kistans mattelås"]')).toBeNull();
    expect(gameStore.getState().rupees).toBe(5);
    expect(gameStore.getState().reward).toBe(5);
    click("Titta i kistan");
    expect(host.textContent).toContain("Kistan är tom nu");
    expect(gameStore.getState().rupees).toBe(5);
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
    expect(gameStore.getState().rupees).toBe(4);
    expect(gameStore.getState().target).toMatchObject({
      kind: "chest",
      id: "glade",
    });
    click("Öppna");
    click("Räkna!");
    for (let index = 0; index < 3; index++) {
      const correct = gameStore.getState().question!.correctAnswer;
      act(() =>
        Array.from(
          host.querySelectorAll<HTMLButtonElement>('[data-testid="answer"]'),
        )
          .find((b) => b.textContent === String(correct))!
          .click(),
      );
      if (index < 2) act(() => gameStore.finishQuiz());
    }
    expect(gameStore.getState().rupees).toBe(9);
  });
  it("requires confirmation for reset and keeps progress when cancelled", () => {
    act(() => gameStore.collect("path-1"));
    key("Escape");
    click("Börja om");
    click("Nej, spela vidare");
    expect(gameStore.getState().rupees).toBe(1);
    click("Börja om");
    click("Ja, börja om");
    expect(gameStore.getState().rupees).toBe(0);
    expect(gameStore.getState().overlay).toBeNull();
  });
});

describe("temple interface and input", () => {
  const enter = () =>
    act(() => gameStore.travelTo({ dungeon: "moss", room: "light" }));
  it("resets held joystick input on travel, focus loss and puzzle reset", () => {
    const joystick = host.querySelector('[data-testid="joystick"]')!;
    Object.assign(joystick, {
      setPointerCapture: () => {},
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        width: 160,
        height: 160,
      }),
    });
    pointer(joystick, "pointerdown", 1, 122, 80);
    expect(input.direction().x).toBe(1);
    enter();
    expect(input.direction()).toEqual({ x: 0, y: 0 });
    pointer(joystick, "pointermove", 1, 122, 80);
    expect(input.direction()).toEqual({ x: 0, y: 0 });
    pointer(joystick, "pointerdown", 2, 122, 80);
    act(() => window.dispatchEvent(new Event("blur")));
    pointer(joystick, "pointermove", 2, 122, 80);
    expect(input.direction()).toEqual({ x: 0, y: 0 });
  });
  it("shows picture groups and three dot answers, resumes a partial challenge and opens the gate", () => {
    vi.useFakeTimers();
    enter();
    act(() =>
      gameStore.setTarget({
        kind: "challenge",
        id: "light-lock",
        label: "Tänd lamporna",
      }),
    );
    click("Tänd lamporna");
    expect(host.querySelectorAll('[data-testid="answer"]')).toHaveLength(3);
    expect(host.querySelectorAll('[aria-label="Äpple"]')).toHaveLength(
      gameStore.getState().question!.correctAnswer,
    );
    expect(host.querySelector('[aria-label="Stjärna"]')).toBeNull();
    act(() => gameStore.answer(99));
    expect(host.textContent).toContain("Prova igen");
    act(() => gameStore.answer(gameStore.getState().question!.correctAnswer));
    act(() => vi.advanceTimersByTime(2100));
    act(() => gameStore.close());
    click("Tänd lamporna");
    expect(gameStore.getState().quizCorrectAnswers).toBe(1);
    for (let i = 0; i < 4; i++) {
      act(() => gameStore.answer(gameStore.getState().question!.correctAnswer));
      if (i < 3) act(() => vi.advanceTimersByTime(2100));
    }
    expect(host.textContent).toContain("Porten är öppen");
    act(() => vi.advanceTimersByTime(2100));
    expect(host.querySelector('[role="dialog"]')).toBeNull();
    expect(host.textContent).toContain("öppna porten");
  });
});

describe("walking controls in the stone room", () => {
  it("keeps a held joystick during a push, clears it on cancellation and hides the action button", () => {
    act(() => {
      gameStore.travelTo({ dungeon: "moss", room: "light" });
      gameStore.setTarget({
        kind: "challenge",
        id: "light-lock",
        label: "Räkna",
      });
      gameStore.interact();
      for (let i = 0; i < 5; i++) {
        gameStore.answer(gameStore.getState().question!.correctAnswer);
        gameStore.finishQuiz();
      }
      gameStore.travelTo({ dungeon: "moss", room: "stones" });
    });
    const joystick = host.querySelector('[data-testid="joystick"]')!;
    Object.assign(joystick, {
      setPointerCapture: () => {},
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        width: 160,
        height: 160,
      }),
    });
    pointer(joystick, "pointerdown", 1, 38, 80);
    act(() => gameStore.pushStone(0, -1));
    expect(input.direction().x).toBe(-1);
    act(() => gameStore.finishMotion());
    expect(input.direction().x).toBe(-1);
    expect(button("Knuffa")).toBeUndefined();
    expect(button("Nästa rum")).toBeUndefined();
    pointer(joystick, "pointercancel", 1, 38, 80);
    expect(input.direction()).toEqual({ x: 0, y: 0 });
  });
});

describe("inventory interface", () => {
  it("stops held input, shows only the bag, equips items and closes with Escape", () => {
    act(() => gameStore.grantItems(["temple-sword", "temple-shield"], true));
    key("KeyW");
    click("Väska");
    expect(input.direction()).toEqual({ x: 0, y: 0 });
    expect(host.querySelectorAll('[role="dialog"]')).toHaveLength(1);
    expect(host.textContent).toContain("Gröna kläder");
    expect(host.querySelector('[data-testid="joystick"]')).toBeNull();
    act(() =>
      host
        .querySelector<HTMLButtonElement>('[aria-label="Ta av svärd"]')!
        .click(),
    );
    expect(gameStore.getState().equipment.sword).toBeNull();
    act(() =>
      host
        .querySelector<HTMLButtonElement>('[aria-label="Ta på svärd"]')!
        .click(),
    );
    expect(gameStore.getState().equipment.sword).toBe("temple-sword");
    key("Escape");
    expect(gameStore.getState().overlay).toBeNull();
    expect(input.direction()).toEqual({ x: 0, y: 0 });
  });
});
