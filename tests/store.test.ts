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
  store.setTarget({ kind: "chest", id: "glade", label: "Öppna" });
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
    expect(store.getState().quizCorrectAnswers).toBe(0);
    store.replaceQuestion();
    expect(store.getState().question).not.toBe(question);
    store.answer(store.getState().question!.correctAnswer);
    expect(store.getState()).toMatchObject({
      rupees: 0,
      chests: { glade: false, south: false },
      bridgeUnlocked: false,
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
      chests: { glade: true, south: false },
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
      chests: { glade: false, south: false },
      bridgeUnlocked: false,
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
        chests: { glade: false, south: false },
        bridgeUnlocked: false,
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

describe("shared math progression", () => {
  function answer(store: ReturnType<typeof createGameStore>, correct = true) {
    const q = store.getState().question!;
    store.answer(correct ? q.correctAnswer : q.answers.find(n => n !== q.correctAnswer)!);
  }
  function temple(store: ReturnType<typeof createGameStore>) {
    store.travelTo({ dungeon: "moss", room: "light" });
    store.setTarget({ kind: "challenge", id: "light-lock", label: "Räkna" });
    store.interact();
  }
  function savedAt(level: number, streak: number) {
    const storage = memory();
    createGameStore(storage).collect("path-1");
    const save = JSON.parse(storage.getItem(SAVE_KEY)!);
    save.mathProgress = { level, streak };
    storage.setItem(SAVE_KEY, JSON.stringify(save));
    return storage;
  }

  it("shares five consecutive answers between chest, reload and temple; ignores duplicate answers", () => {
    const storage = memory();
    let store = createGameStore(storage);
    openQuiz(store);
    for (let i = 0; i < 3; i++) {
      answer(store);
      answer(store);
      store.finishQuiz();
    }
    expect(store.getState().mathProgress).toEqual({ level: 1, streak: 3 });
    expect(store.getState().rupees).toBe(5);
    store = createGameStore(storage);
    temple(store);
    answer(store);
    store.finishQuiz();
    const fifth = store.getState().question!;
    answer(store);
    expect(store.getState().mathProgress).toEqual({ level: 2, streak: 0 });
    expect(store.getState().question).toBe(fifth);
    expect(fifth.difficulty).toBe(1);
    store.finishQuiz();
    expect(store.getState().question!.difficulty).toBe(2);
    expect(createGameStore(storage).getState().mathProgress).toEqual({ level: 2, streak: 0 });
  });

  it.each(["chest", "temple"])("breaks the streak without losing level or stars in a %s", kind => {
    const storage = savedAt(2, 2);
    const store = createGameStore(storage);
    if (kind === "chest") openQuiz(store); else temple(store);
    answer(store);
    store.finishQuiz();
    answer(store, false);
    answer(store);
    expect(store.getState()).toMatchObject({
      mathProgress: { level: 2, streak: 0 }, quizCorrectAnswers: 1, feedback: "retry",
    });
    expect(createGameStore(storage).getState().mathProgress).toEqual({ level: 2, streak: 0 });
    store.replaceQuestion();
    expect(store.getState().question!.difficulty).toBe(2);
    answer(store);
    expect(store.getState().mathProgress.streak).toBe(1);
  });

  it.each([1, 2, 3, 4])("advances only after five correct at level %i and caps level four", level => {
    const storage = savedAt(level, 3);
    const store = createGameStore(storage);
    openQuiz(store);
    answer(store);
    expect(store.getState().mathProgress).toEqual({ level, streak: 4 });
    store.finishQuiz();
    answer(store);
    expect(store.getState().mathProgress).toEqual({ level: Math.min(4, level + 1), streak: level === 4 ? 5 : 0 });
    store.finishQuiz();
    expect(store.getState().question!.difficulty).toBe(Math.min(4, level + 1));
  });

  it("retains streak on closing and restores the default on full reset", () => {
    const storage = savedAt(3, 2);
    const store = createGameStore(storage);
    openQuiz(store);
    answer(store);
    store.finishQuiz();
    store.close();
    openQuiz(store);
    expect(store.getState().mathProgress).toEqual({ level: 3, streak: 3 });
    store.reset();
    expect(createGameStore(storage).getState().mathProgress).toEqual({ level: 1, streak: 0 });
  });

  it.each([undefined, null, {}, { level: 0, streak: 0 }, { level: 5, streak: 0 },
    { level: 2, streak: 5 }, { level: 2, streak: -1 }, { level: 1.5, streak: 0 },
    { level: 2, streak: 1.5 }, { level: 4, streak: "2" }])(
    "defaults missing or invalid math progress without losing a valid version 20 save: %j", value => {
      const storage = savedAt(2, 3);
      const save = JSON.parse(storage.getItem(SAVE_KEY)!);
      expect(save.version).toBe(20);
      save.mathProgress = value;
      const parsed = parseSave(JSON.stringify(save));
      expect(parsed.mathProgress).toEqual({ level: 1, streak: 0 });
      expect(parsed.rupees).toBe(1);
      expect(parsed.collected).toEqual(["path-1"]);
    },
  );

  it("keeps playing and progressing when writes fail", () => {
    const store = createGameStore({ getItem: () => null, setItem: () => { throw Error(); } });
    temple(store);
    for (let i = 0; i < 5; i++) { answer(store); store.finishQuiz(); }
    expect(store.getState().mathProgress).toEqual({ level: 2, streak: 0 });
    expect(store.getState().savingAvailable).toBe(false);
  });

  it("restores real math progress after debug play and never writes debug answers", () => {
    const storage = savedAt(2, 4);
    const store = createGameStore(storage);
    const saved = storage.getItem(SAVE_KEY);
    store.openDebug();
    store.debugTravelTo({ dungeon: "moss", room: "light" });
    store.closeDebug();
    store.setTarget({ kind: "challenge", id: "light-lock", label: "Räkna" });
    store.interact();
    answer(store);
    expect(store.getState().mathProgress.level).toBe(3);
    expect(storage.getItem(SAVE_KEY)).toBe(saved);
    store.debugEndSession();
    expect(store.getState().mathProgress).toEqual({ level: 2, streak: 4 });
  });
});
