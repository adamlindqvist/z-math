import { useSyncExternalStore } from "react";
import { generateAdditionQuestion } from "../math/questionGenerators";
import type { MathQuestion } from "../math/types";
export const SAVE_KEY = "glantans-skatt-v1";
export const COIN_IDS = ["path-1", "path-2", "path-3", "path-4"];
export type Target = "npc" | "chest" | null;
export type Overlay =
  null | "welcome" | "npc" | "locked" | "empty" | "quiz" | "pause" | "reset";
export interface Progress {
  coins: number;
  chestOpened: boolean;
  collected: string[];
  talkedToNpc: boolean;
}
export interface GameState extends Progress {
  overlay: Overlay;
  target: Target;
  question: MathQuestion | null;
  feedback: "retry" | "correct" | null;
  reward: number;
  savingAvailable: boolean;
  resetId: number;
}
const fresh = (): Progress => ({
  coins: 0,
  chestOpened: false,
  collected: [],
  talkedToNpc: false,
});
export function parseSave(raw: string | null): Progress {
  try {
    const p = JSON.parse(raw || "null");
    if (
      p?.version !== 1 ||
      !Number.isInteger(p.coins) ||
      p.coins < 0 ||
      typeof p.chestOpened !== "boolean" ||
      typeof p.talkedToNpc !== "boolean" ||
      !Array.isArray(p.collected) ||
      p.collected.some(
        (id: unknown) => typeof id !== "string" || !COIN_IDS.includes(id),
      ) ||
      new Set(p.collected).size !== p.collected.length ||
      p.coins !== p.collected.length + (p.chestOpened ? 5 : 0)
    )
      return fresh();
    return {
      coins: p.coins,
      chestOpened: p.chestOpened,
      collected: p.collected,
      talkedToNpc: p.talkedToNpc,
    };
  } catch {
    return fresh();
  }
}
export function createGameStore(
  storage?: Pick<Storage, "getItem" | "setItem">,
) {
  let progress = fresh();
  let savingAvailable = !!storage;
  try {
    progress = parseSave(storage?.getItem(SAVE_KEY) ?? null);
  } catch {
    savingAvailable = false;
  }
  let state: GameState = {
    ...progress,
    overlay: "welcome",
    target: null,
    question: null,
    feedback: null,
    reward: 0,
    savingAvailable,
    resetId: 0,
  };
  const listeners = new Set<() => void>();
  const set = (update: Partial<GameState>, persist = false) => {
    state = { ...state, ...update };
    if (persist && storage) {
      try {
        storage.setItem(
          SAVE_KEY,
          JSON.stringify({
            version: 1,
            coins: state.coins,
            chestOpened: state.chestOpened,
            collected: state.collected,
            talkedToNpc: state.talkedToNpc,
          }),
        );
      } catch {
        state = { ...state, savingAvailable: false };
      }
    }
    listeners.forEach((fn) => fn());
  };
  return {
    getState: () => state,
    subscribe: (fn: () => void) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    start: () => set({ overlay: null }),
    setTarget: (target: Target) => {
      if (target !== state.target) set({ target });
    },
    interact: () => {
      if (state.overlay || !state.target) return;
      if (state.target === "npc")
        set({ overlay: "npc", talkedToNpc: true }, true);
      else set({ overlay: state.chestOpened ? "empty" : "locked" });
    },
    close: () => set({ overlay: null, question: null, feedback: null }),
    beginQuiz: () => {
      if (state.overlay === "locked" && !state.chestOpened)
        set({
          overlay: "quiz",
          question: generateAdditionQuestion(),
          feedback: null,
        });
    },
    answer: (answer: number) => {
      if (state.overlay !== "quiz" || !state.question || state.chestOpened)
        return;
      if (answer !== state.question.correctAnswer) {
        set({ feedback: "retry" });
        return;
      }
      set(
        { coins: state.coins + 5, chestOpened: true, feedback: "correct" },
        true,
      );
    },
    finishQuiz: () => {
      if (state.feedback === "correct")
        set({ overlay: null, question: null, feedback: null, reward: 5 });
    },
    collect: (id: string) => {
      if (
        !state.overlay &&
        COIN_IDS.includes(id) &&
        !state.collected.includes(id)
      )
        set(
          { coins: state.coins + 1, collected: [...state.collected, id] },
          true,
        );
    },
    clearReward: () => set({ reward: 0 }),
    pause: () => {
      if (!state.overlay) set({ overlay: "pause" });
      else if (state.overlay === "pause") set({ overlay: null });
    },
    confirmReset: () => set({ overlay: "reset" }),
    cancelReset: () => set({ overlay: "pause" }),
    reset: () =>
      set(
        {
          ...fresh(),
          overlay: null,
          target: null,
          question: null,
          feedback: null,
          reward: 0,
          resetId: state.resetId + 1,
        },
        true,
      ),
  };
}
let local: Storage | undefined;
try {
  local = globalThis.localStorage;
} catch {
  /* The adventure also works without storage. */
}
export const gameStore = createGameStore(local);
export const useGameState = () =>
  useSyncExternalStore(gameStore.subscribe, gameStore.getState);
