import {
  CHESTS,
  CHEST_IDS,
  type ChestId,
} from "../game/entities/chestDefinitions";
import {
  WORLD_SECRETS,
  freshSecrets,
  validSecrets,
  type SecretId,
  type SecretsProgress,
} from "../game/secrets/definitions";
export type { ChestId } from "../game/entities/chestDefinitions";
import {
  freshInventory,
  validInventory,
  receiveItems,
  isItemId,
  ITEMS,
  type Inventory,
  type ItemId,
  type EquipmentSlot,
} from "../items/definitions";
import {
  DUNGEONS,
  freshDungeons,
  resolveRoom,
  roomSolved,
  canVisit,
  pushedPosition,
  type Location,
  type DungeonProgress,
} from "../game/dungeons/definitions";
import { useSyncExternalStore } from "react";
import {
  generateAdditionQuestion,
  generateTempleQuestion,
} from "../math/questionGenerators";
import type { MathQuestion } from "../math/types";
export const SAVE_KEY = "glantans-skatt-v1";
export const RUPEE_IDS = ["path-1", "path-2", "path-3", "path-4"];
export const REQUIRED_CORRECT_ANSWERS = 3;
export const hasBridgeEquipment = (state: Inventory) =>
  state.items.includes("temple-sword") && state.items.includes("temple-shield");
export type Target =
  | "npc"
  | "bokoblin"
  | null
  | { kind: "chest"; id: ChestId; label: string }
  | { kind: "challenge"; id: string; label: string };
export type Overlay =
  | null
  | "npc"
  | "bokoblin"
  | "locked"
  | "empty"
  | "quiz"
  | "pause"
  | "debug"
  | "reset"
  | "inventory"
  | "itemReward";
export interface Progress extends Inventory {
  location: Location;
  dungeons: Record<string, DungeonProgress>;
  rupees: number;
  chests: Record<ChestId, boolean>;
  secrets: SecretsProgress;
  bridgeUnlocked: boolean;
  collected: string[];
  talkedToNpc: boolean;
}
export interface GameState extends Progress {
  overlay: Overlay;
  target: Target;
  question: MathQuestion | null;
  feedback: "retry" | "correct" | "complete" | null;
  quizCorrectAnswers: number;
  dungeonQuiz: string | null;
  activeChest: ChestId | null;
  motion: { index: number; from: number; to: number } | null;
  reward: number;
  rewardItems: ItemId[];
  savingAvailable: boolean;
  resetId: number;
  debugActive: boolean;
  debugNoclip: boolean;
}
const fresh = (): Progress => ({
  ...freshInventory(),
  location: null,
  dungeons: freshDungeons(),
  rupees: 0,
  chests: Object.fromEntries(CHEST_IDS.map((id) => [id, false])) as Record<
    ChestId,
    boolean
  >,
  secrets: freshSecrets(),
  bridgeUnlocked: false,
  collected: [],
  talkedToNpc: false,
});
export function parseSave(raw: string | null): Progress {
  try {
    const p = JSON.parse(raw || "null");
    if (
      p?.version !== 7 ||
      !validInventory(p) ||
      !validDungeons(p.dungeons) ||
      !validLocation(p.location, p.dungeons) ||
      (!p.bridgeUnlocked &&
        DUNGEONS.some(
          (d) =>
            d.requiresBridge &&
            (p.location?.dungeon === d.id ||
              d.rooms.some((r) =>
                r.challenge
                  ? p.dungeons[d.id].answers[r.challenge.id] !== 0
                  : r.stones?.some(
                      (stone, i) =>
                        p.dungeons[d.id].stones[r.id][i] !== stone.start,
                    ),
              )),
        )) ||
      !Number.isInteger(p.rupees) ||
      p.rupees < 0 ||
      !p.chests ||
      Object.keys(p.chests).length !== CHEST_IDS.length ||
      !CHEST_IDS.every((id) => typeof p.chests[id] === "boolean") ||
      !validSecrets(p.secrets, p.chests, p.bridgeUnlocked) ||
      typeof p.bridgeUnlocked !== "boolean" ||
      (p.bridgeUnlocked && !hasBridgeEquipment(p)) ||
      (p.chests.south && !p.bridgeUnlocked) ||
      typeof p.talkedToNpc !== "boolean" ||
      !Array.isArray(p.collected) ||
      p.collected.some(
        (id: unknown) => typeof id !== "string" || !RUPEE_IDS.includes(id),
      ) ||
      new Set(p.collected).size !== p.collected.length ||
      p.rupees !==
        p.collected.length +
          CHEST_IDS.reduce(
            (sum, id) => sum + (p.chests[id] ? CHESTS[id].reward : 0),
            0,
          ) +
          dungeonRewardTotal(p.dungeons)
    )
      return fresh();
    return {
      items: p.items,
      equipment: p.equipment,
      location: p.location,
      dungeons: p.dungeons,
      rupees: p.rupees,
      chests: p.chests,
      secrets: p.secrets,
      bridgeUnlocked: p.bridgeUnlocked,
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
    overlay: null,
    target: null,
    question: null,
    feedback: null,
    quizCorrectAnswers: 0,
    dungeonQuiz: null,
    activeChest: null,
    motion: null,
    reward: 0,
    rewardItems: [],
    savingAvailable,
    resetId: 0,
    debugActive: false,
    debugNoclip: false,
  };
  let debugBaseline: Progress | null = null;
  const listeners = new Set<() => void>();
  const set = (update: Partial<GameState>, persist = false) => {
    state = { ...state, ...update };
    if (persist && storage && !state.debugActive) {
      try {
        storage.setItem(
          SAVE_KEY,
          JSON.stringify({
            version: 7,
            items: state.items,
            equipment: state.equipment,
            location: state.location,
            dungeons: state.dungeons,
            rupees: state.rupees,
            chests: state.chests,
            secrets: state.secrets,
            bridgeUnlocked: state.bridgeUnlocked,
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
  // The chest flag, currency and associated discovery are committed together.
  const chestAward = (id: ChestId): Partial<GameState> => {
    if (state.chests[id]) return {};
    const secret = WORLD_SECRETS.find((s) => s.chestId === id);
    return {
      rupees: state.rupees + CHESTS[id].reward,
      chests: { ...state.chests, [id]: true },
      ...(secret
        ? {
            secrets: {
              ...state.secrets,
              [secret.id]: {
                discovered: true,
                revealed: true,
                completed: true,
              },
            },
          }
        : {}),
    };
  };
  const beginDebugSession = () => {
    if (state.debugActive) return;
    debugBaseline = copyProgress(state);
    set({ debugActive: true });
  };
  const solveThrough = (
    dungeonId: string,
    lastRoomIndex: number,
  ): Partial<GameState> => {
    const dungeon = DUNGEONS.find((candidate) => candidate.id === dungeonId);
    const current = state.dungeons[dungeonId];
    if (!dungeon || !current || lastRoomIndex < 0) return {};
    const progress: DungeonProgress = {
      answers: { ...current.answers },
      stones: Object.fromEntries(
        Object.entries(current.stones).map(([id, positions]) => [
          id,
          [...positions],
        ]),
      ),
      rewards: [...current.rewards],
    };
    let inventory: Inventory = state;
    let rupees = state.rupees;
    for (const room of dungeon.rooms.slice(0, lastRoomIndex + 1)) {
      if (room.challenge) {
        const challenge = room.challenge;
        progress.answers[challenge.id] = challenge.required;
        if (challenge.reward > 0 && !progress.rewards.includes(challenge.id)) {
          progress.rewards.push(challenge.id);
          rupees += challenge.reward;
        }
        inventory = receiveItems(inventory, challenge.items ?? [], true);
      }
      if (room.stones)
        progress.stones[room.id] = room.stones.map((stone) => stone.goal);
    }
    return {
      ...inventory,
      rupees,
      dungeons: { ...state.dungeons, [dungeonId]: progress },
    };
  };
  return {
    getState: () => state,
    discoverSecret: (id: SecretId) => {
      const definition = WORLD_SECRETS.find((s) => s.id === id);
      if (
        !definition ||
        (definition.requiresBridge && !state.bridgeUnlocked) ||
        state.location ||
        state.overlay ||
        state.motion ||
        !state.secrets[id] ||
        state.secrets[id].discovered
      )
        return;
      set(
        {
          secrets: {
            ...state.secrets,
            [id]: { ...state.secrets[id], discovered: true },
          },
        },
        true,
      );
    },
    revealSecret: (id: SecretId) => {
      const progress = state.secrets[id];
      const definition = WORLD_SECRETS.find((s) => s.id === id);
      if (
        !definition ||
        (definition.requiresBridge && !state.bridgeUnlocked) ||
        state.location ||
        state.overlay ||
        state.motion ||
        !progress?.discovered ||
        progress.revealed
      )
        return;
      set(
        {
          secrets: { ...state.secrets, [id]: { ...progress, revealed: true } },
        },
        true,
      );
    },
    grantItems: (ids: readonly ItemId[], equip = false) => {
      set(receiveItems(state, ids, equip), true);
    },
    equipItem: (id: ItemId, slot: EquipmentSlot) => {
      if (
        !isItemId(id) ||
        !state.items.includes(id) ||
        ITEMS[id].category !== slot
      )
        return;
      set({ equipment: { ...state.equipment, [slot]: id } }, true);
    },
    unequipItem: (slot: EquipmentSlot) => {
      if (slot !== "sword" && slot !== "shield") return;
      set({ equipment: { ...state.equipment, [slot]: null } }, true);
    },
    openInventory: () => {
      if (state.motion || (state.overlay && state.overlay !== "itemReward"))
        return;
      set({ overlay: "inventory", reward: 0, rewardItems: [] });
    },
    subscribe: (fn: () => void) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    setTarget: (target: Target) => {
      if (JSON.stringify(target) !== JSON.stringify(state.target))
        set({ target });
    },
    openDebug: () => {
      if (!state.overlay && !state.motion) set({ overlay: "debug" });
    },
    closeDebug: () => {
      if (state.overlay === "debug") set({ overlay: null });
    },
    debugTravelTo: (destination: Location) => {
      if (state.overlay !== "debug") return;
      beginDebugSession();
      const found = resolveRoom(destination);
      let update: Partial<GameState> = {};
      if (found) {
        const roomIndex = found.dungeon.rooms.indexOf(found.room);
        update = solveThrough(found.dungeon.id, roomIndex - 1);
        if (found.dungeon.requiresBridge) {
          const inventory = receiveItems(
            {
              items: update.items ?? state.items,
              equipment: update.equipment ?? state.equipment,
            },
            ["temple-sword", "temple-shield"],
          );
          update = { ...update, ...inventory, bridgeUnlocked: true };
        }
      }
      set({
        ...update,
        location: destination,
        target: null,
        motion: null,
        question: null,
        feedback: null,
        dungeonQuiz: null,
        activeChest: null,
        reward: 0,
        rewardItems: [],
        quizCorrectAnswers: 0,
      });
    },
    debugCompleteCurrentRoom: () => {
      if (state.overlay !== "debug") return;
      const found = resolveRoom(state.location);
      if (!found) return;
      beginDebugSession();
      set(
        solveThrough(found.dungeon.id, found.dungeon.rooms.indexOf(found.room)),
      );
    },
    debugGrantAllItems: () => {
      if (state.overlay !== "debug") return;
      beginDebugSession();
      set(receiveItems(state, Object.keys(ITEMS) as ItemId[]));
    },
    debugUnlockBridge: () => {
      if (state.overlay !== "debug") return;
      beginDebugSession();
      set({
        ...receiveItems(state, ["temple-sword", "temple-shield"]),
        bridgeUnlocked: true,
      });
    },
    debugSetNoclip: (enabled: boolean) => {
      if (state.overlay !== "debug") return;
      beginDebugSession();
      set({ debugNoclip: enabled });
    },
    debugReset: () => {
      if (state.overlay !== "debug") return;
      beginDebugSession();
      set({
        ...fresh(),
        overlay: "debug",
        target: null,
        question: null,
        feedback: null,
        quizCorrectAnswers: 0,
        dungeonQuiz: null,
        activeChest: null,
        motion: null,
        reward: 0,
        rewardItems: [],
        resetId: state.resetId + 1,
      });
    },
    debugEndSession: () => {
      if (!state.debugActive || !debugBaseline) {
        set({ overlay: null, debugNoclip: false });
        return;
      }
      const baseline = debugBaseline;
      debugBaseline = null;
      set({
        ...baseline,
        overlay: null,
        target: null,
        question: null,
        feedback: null,
        quizCorrectAnswers: 0,
        dungeonQuiz: null,
        activeChest: null,
        motion: null,
        reward: 0,
        rewardItems: [],
        resetId: state.resetId + 1,
        debugActive: false,
        debugNoclip: false,
      });
    },
    travelTo: (destination: Location) => {
      if (state.overlay || state.motion) return;
      const found = resolveRoom(state.location);
      const currentIndex = found ? found.dungeon.rooms.indexOf(found.room) : -1;
      const next = resolveRoom(destination);
      if (next?.dungeon.requiresBridge && !state.bridgeUnlocked) return;
      const adjacent = !state.location
        ? !!next && next.dungeon.rooms[0] === next.room
        : (!destination &&
            (currentIndex === 0 ||
              (!!found &&
                currentIndex === found.dungeon.rooms.length - 1 &&
                roomSolved(found.room, state.dungeons[found.dungeon.id])))) ||
          (!!next &&
            next.dungeon === found?.dungeon &&
            Math.abs(next.dungeon.rooms.indexOf(next.room) - currentIndex) ===
              1);
      if (adjacent && canVisit(destination, state.dungeons))
        set(
          { location: destination, target: null, motion: null, reward: 0 },
          true,
        );
    },
    pushStone: (index: number, direction: -1 | 1) => {
      const found = resolveRoom(state.location);
      if (!found || state.overlay || state.motion) return false;
      const stone = found.room.stones?.[index];
      const progress = state.dungeons[found.dungeon.id];
      if (!stone || roomSolved(found.room, progress)) return false;
      const positions = progress.stones[found.room.id];
      const to = pushedPosition(
        positions[index],
        direction,
        stone.points.length,
      );
      if (to === null) return false;
      const updated = positions.map((p, i) => (i === index ? to : p));
      set(
        {
          dungeons: {
            ...state.dungeons,
            [found.dungeon.id]: {
              ...progress,
              stones: { ...progress.stones, [found.room.id]: updated },
            },
          },
          motion: { index, from: positions[index], to },
          target: null,
        },
        true,
      );
      return true;
    },
    interact: () => {
      if (state.overlay || state.motion || !state.target) return;
      if (typeof state.target === "object") {
        const target = state.target;
        if (target.kind === "chest") {
          if (
            state.location ||
            (target.id === "south" && !state.bridgeUnlocked)
          )
            return;
          const secret = WORLD_SECRETS.find((s) => s.chestId === target.id);
          if (
            secret &&
            (!state.secrets[secret.id].revealed ||
              (secret.requiresBridge && !state.bridgeUnlocked))
          )
            return;
          if (
            CHESTS[target.id].opening === "direct" &&
            !state.chests[target.id]
          ) {
            set(
              {
                ...chestAward(target.id),
                reward: CHESTS[target.id].reward,
                activeChest: null,
              },
              true,
            );
            return;
          }
          set({
            activeChest: target.id,
            overlay: state.chests[target.id] ? "empty" : "locked",
          });
          return;
        }
        const found = resolveRoom(state.location);
        if (found && found.room.challenge?.id === target.id) {
          const c = found.room.challenge;
          const answers = state.dungeons[found.dungeon.id].answers[c.id];
          if (answers < c.required)
            set({
              overlay: "quiz",
              dungeonQuiz: c.id,
              question: generateTempleQuestion(c.kind),
              quizCorrectAnswers: answers,
              feedback: null,
            });
        }
        return;
      }
      if (state.location) return;
      if (state.target === "npc")
        set({ overlay: "npc", talkedToNpc: true }, true);
      else if (state.target === "bokoblin" && !state.bridgeUnlocked) {
        if (hasBridgeEquipment(state))
          set({ bridgeUnlocked: true, target: null }, true);
        else set({ overlay: "bokoblin" });
      }
    },
    close: () =>
      set({
        overlay: null,
        rewardItems: [],
        reward: state.overlay === "itemReward" ? 0 : state.reward,
        dungeonQuiz: null,
        activeChest: null,
        question: null,
        feedback: null,
        quizCorrectAnswers: 0,
      }),
    beginQuiz: () => {
      if (state.dungeonQuiz) return;
      if (
        state.overlay === "locked" &&
        state.activeChest &&
        !state.chests[state.activeChest] &&
        CHESTS[state.activeChest].opening === "quiz"
      )
        set({
          overlay: "quiz",
          question: generateAdditionQuestion(),
          feedback: null,
          quizCorrectAnswers: 0,
        });
    },
    answer: (answer: number) => {
      if (state.dungeonQuiz) {
        const found = resolveRoom(state.location);
        const c = found?.room.challenge;
        if (
          !found ||
          !c ||
          c.id !== state.dungeonQuiz ||
          state.overlay !== "quiz" ||
          !state.question ||
          state.feedback === "correct" ||
          state.feedback === "complete"
        )
          return;
        const progress = state.dungeons[found.dungeon.id];
        if (progress.answers[c.id] >= c.required) return;
        if (answer !== state.question.correctAnswer) {
          set({ feedback: "retry" });
          return;
        }
        const count = progress.answers[c.id] + 1;
        const complete = count === c.required;
        const itemAward = complete
          ? (c.items ?? []).filter((id) => !state.items.includes(id))
          : [];
        const award =
          complete && !progress.rewards.includes(c.id) ? c.reward : 0;
        set(
          {
            ...receiveItems(state, itemAward, true),
            rewardItems: itemAward,
            quizCorrectAnswers: count,
            feedback: complete ? "complete" : "correct",
            rupees: state.rupees + award,
            dungeons: {
              ...state.dungeons,
              [found.dungeon.id]: {
                ...progress,
                answers: { ...progress.answers, [c.id]: count },
                rewards:
                  complete && c.reward > 0
                    ? [...progress.rewards, c.id]
                    : progress.rewards,
              },
            },
          },
          true,
        );
        return;
      }
      if (
        state.overlay !== "quiz" ||
        !state.question ||
        !state.activeChest ||
        state.chests[state.activeChest] ||
        state.feedback === "correct" ||
        state.feedback === "complete"
      )
        return;
      if (answer !== state.question.correctAnswer) {
        set({ feedback: "retry" });
        return;
      }
      const quizCorrectAnswers = state.quizCorrectAnswers + 1;
      if (quizCorrectAnswers < REQUIRED_CORRECT_ANSWERS) {
        set({ quizCorrectAnswers, feedback: "correct" });
        return;
      }
      set(
        {
          ...chestAward(state.activeChest),
          feedback: "complete",
          quizCorrectAnswers,
        },
        true,
      );
    },
    finishQuiz: () => {
      if (state.dungeonQuiz) {
        const c = resolveRoom(state.location)?.room.challenge;
        if (!c) return;
        if (state.feedback === "correct")
          set({ question: generateTempleQuestion(c.kind), feedback: null });
        else if (state.feedback === "complete")
          set({
            overlay: state.rewardItems.length ? "itemReward" : null,
            question: null,
            feedback: null,
            dungeonQuiz: null,
            activeChest: null,
            quizCorrectAnswers: 0,
            reward: c.reward,
          });
        return;
      }
      if (state.feedback === "correct")
        set({ question: generateAdditionQuestion(), feedback: null });
      else if (state.feedback === "complete")
        set({
          overlay: null,
          question: null,
          feedback: null,
          quizCorrectAnswers: 0,
          reward: state.activeChest ? CHESTS[state.activeChest].reward : 0,
          activeChest: null,
        });
    },
    collect: (id: string) => {
      if (
        !state.overlay &&
        !state.location &&
        RUPEE_IDS.includes(id) &&
        !state.collected.includes(id)
      )
        set(
          { rupees: state.rupees + 1, collected: [...state.collected, id] },
          true,
        );
    },
    finishMotion: () => {
      if (state.motion) set({ motion: null });
    },
    resetPuzzle: () => {
      const found = resolveRoom(state.location);
      if (!found?.room.stones || state.overlay || state.motion) return;
      const progress = state.dungeons[found.dungeon.id];
      if (roomSolved(found.room, progress)) return;
      set(
        {
          target: null,
          resetId: state.resetId + 1,
          dungeons: {
            ...state.dungeons,
            [found.dungeon.id]: {
              ...progress,
              stones: {
                ...progress.stones,
                [found.room.id]: found.room.stones.map((stone) => stone.start),
              },
            },
          },
        },
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
          dungeonQuiz: null,
          activeChest: null,
          motion: null,
          overlay: null,
          target: null,
          question: null,
          feedback: null,
          quizCorrectAnswers: 0,
          reward: 0,
          rewardItems: [],
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

function copyProgress(state: Progress): Progress {
  return {
    items: [...state.items],
    equipment: { ...state.equipment },
    location: state.location ? { ...state.location } : null,
    dungeons: Object.fromEntries(
      Object.entries(state.dungeons).map(([id, progress]) => [
        id,
        {
          answers: { ...progress.answers },
          stones: Object.fromEntries(
            Object.entries(progress.stones).map(([room, positions]) => [
              room,
              [...positions],
            ]),
          ),
          rewards: [...progress.rewards],
        },
      ]),
    ),
    rupees: state.rupees,
    chests: { ...state.chests },
    secrets: Object.fromEntries(
      Object.entries(state.secrets).map(([id, progress]) => [
        id,
        { ...progress },
      ]),
    ) as SecretsProgress,
    bridgeUnlocked: state.bridgeUnlocked,
    collected: [...state.collected],
    talkedToNpc: state.talkedToNpc,
  };
}

function validLocation(
  value: unknown,
  progress: Record<string, DungeonProgress>,
): boolean {
  if (value === null) return true;
  if (
    !value ||
    typeof value !== "object" ||
    !("dungeon" in value) ||
    !("room" in value) ||
    typeof value.dungeon !== "string" ||
    typeof value.room !== "string"
  )
    return false;
  return canVisit({ dungeon: value.dungeon, room: value.room }, progress);
}
function dungeonRewardTotal(progress: Record<string, DungeonProgress>): number {
  return DUNGEONS.reduce(
    (total, d) =>
      total +
      d.rooms.reduce(
        (sum, r) =>
          sum +
          (r.challenge && progress[d.id].rewards.includes(r.challenge.id)
            ? r.challenge.reward
            : 0),
        0,
      ),
    0,
  );
}
function validDungeons(
  value: unknown,
): value is Record<string, DungeonProgress> {
  if (
    !value ||
    typeof value !== "object" ||
    Object.keys(value).length !== DUNGEONS.length
  )
    return false;
  return DUNGEONS.every((d) => {
    const p = (value as Record<string, DungeonProgress>)[d.id];
    if (
      !p ||
      !p.answers ||
      !p.stones ||
      !Array.isArray(p.rewards) ||
      new Set(p.rewards).size !== p.rewards.length
    )
      return false;
    const challenges = d.rooms.flatMap((r) =>
      r.challenge ? [r.challenge] : [],
    );
    if (
      Object.keys(p.answers).length !== challenges.length ||
      Object.keys(p.stones).length !== d.rooms.filter((r) => r.stones).length
    )
      return false;
    if (
      !challenges.every(
        (c) =>
          Number.isInteger(p.answers[c.id]) &&
          p.answers[c.id] >= 0 &&
          p.answers[c.id] <= c.required &&
          p.rewards.includes(c.id) ===
            (c.reward > 0 && p.answers[c.id] === c.required),
      )
    )
      return false;
    if (
      !p.rewards.every((id) =>
        challenges.some((c) => c.id === id && c.reward > 0),
      )
    )
      return false;
    let reachable = true;
    for (const r of d.rooms) {
      if (r.stones) {
        const positions = p.stones[r.id];
        if (
          !Array.isArray(positions) ||
          positions.length !== r.stones.length ||
          !positions.every(
            (n, i) =>
              Number.isInteger(n) && n >= 0 && n < r.stones![i].points.length,
          )
        )
          return false;
        if (!reachable && positions.some((n, i) => n !== r.stones![i].start))
          return false;
      }
      if (!reachable && r.challenge && p.answers[r.challenge.id] !== 0)
        return false;
      reachable = reachable && roomSolved(r, p);
    }
    return true;
  });
}
