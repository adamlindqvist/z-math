// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { MathQuiz } from "../src/components/MathQuiz";
import { gameStore } from "../src/store/gameStore";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

it("shows crossed-out apples, a zero answer and retry feedback for subtraction", () => {
  gameStore.reset();
  const open = () => {
    gameStore.setTarget({ kind: "chest", id: "glade", label: "Öppna" });
    gameStore.interact();
    gameStore.beginQuiz();
  };
  // Advance via real answers, closing before the chest is complete.
  for (let i = 0; i < 5; i++) {
    open();
    for (let j = 0; j < 2; j++) {
      gameStore.answer(gameStore.getState().question!.correctAnswer);
      gameStore.finishQuiz();
    }
    gameStore.close();
  }
  expect(gameStore.getState().mathProgress.level).toBe(3);
  const random = vi.spyOn(Math, "random").mockReturnValue(0.999999);
  open();
  random.mockRestore();
  const question = gameStore.getState().question!;
  expect(question.category).toBe("subtraction");
  expect(question.correctAnswer).toBe(0);
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  try {
    act(() => root.render(<MathQuiz />));
    expect(host.textContent).toContain("Hur många är kvar?");
    expect(
      host.querySelectorAll('[aria-label="Borttaget äpple"]'),
    ).toHaveLength(question.removedCount!);
    expect(host.querySelectorAll('[aria-label="Äpple"]')).toHaveLength(0);
    expect(host.querySelectorAll('[data-testid="answer"]')).toHaveLength(3);
    const wrong = question.answers.find((n) => n !== 0)!;
    act(() =>
      host.querySelector<HTMLButtonElement>(`[aria-label="${wrong}"]`)!.click(),
    );
    expect(
      host.querySelector('[aria-label="0, det här var rätt svar"]'),
    ).not.toBeNull();
    expect(gameStore.getState().mathProgress).toEqual({ level: 3, streak: 0 });
  } finally {
    act(() => root.unmount());
    host.remove();
    gameStore.reset();
  }
});
