import { describe, it, expect } from "vitest";
import { createGameStore, parseSave, SAVE_KEY } from "../src/store/gameStore";
const memory = () => {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
};
const openQuiz = (store: ReturnType<typeof createGameStore>) => {
  store.setTarget("chest");
  store.interact();
  store.beginQuiz();
};
describe("progress", () => {
  it("requires three correct answers and awards treasure once, atomically", () => {
    const storage = memory();
    const store = createGameStore(storage);
    openQuiz(store);
    const question = store.getState().question!;
    store.answer(question.answers.find((n) => n !== question.correctAnswer)!);
    expect(store.getState().rupees).toBe(0);
    expect(store.getState().question).toBe(question);
    expect(store.getState().feedback).toBe("retry");
    store.answer(question.correctAnswer);
    expect(store.getState()).toMatchObject({
      rupees: 0,
      chestOpened: false,
      quizCorrectAnswers: 1,
      feedback: "correct",
    });
    store.finishQuiz();
    store.answer(store.getState().question!.correctAnswer);
    store.finishQuiz();
    store.answer(store.getState().question!.correctAnswer);
    store.answer(store.getState().question!.correctAnswer);
    expect(store.getState().rupees).toBe(5);
    expect(parseSave(storage.getItem(SAVE_KEY))).toMatchObject({
      rupees: 5,
      chestOpened: true,
    });
    store.finishQuiz();
    store.interact();
    expect(store.getState().overlay).toBe("empty");
    store.beginQuiz();
    expect(store.getState().question).toBeNull();
  });
  it("collects only known Rupees once and restores saved progress", () => {
    const storage = memory(),
      store = createGameStore(storage);
    store.collect("path-1");
    expect(store.getState().rupees).toBe(1);
    store.collect("path-1");
    store.collect("path-1");
    store.collect("unknown");
    expect(store.getState().rupees).toBe(1);
    expect(createGameStore(storage).getState().collected).toEqual(["path-1"]);
    store.reset();
    expect(createGameStore(storage).getState()).toMatchObject({
      rupees: 0,
      collected: [],
      chestOpened: false,
    });
  });
  it("tolerates invalid or blocked storage", () => {
    for (const raw of [
      "bad",
      "null",
      "{}",
      JSON.stringify({
        version: 1,
        rupees: 99,
        chestOpened: false,
        talkedToNpc: false,
        collected: [],
      }),
    ])
      expect(parseSave(raw).rupees).toBe(0);
    const store = createGameStore({
      getItem: () => {
        throw Error();
      },
      setItem: () => {
        throw Error();
      },
    });
    openQuiz(store);
    for (let index = 0; index < 3; index++) {
      store.answer(store.getState().question!.correctAnswer);
      if (index < 2) store.finishQuiz();
    }
    expect(store.getState().rupees).toBe(5);
    expect(store.getState().savingAvailable).toBe(false);
  });
});
