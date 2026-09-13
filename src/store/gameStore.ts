import type { DayPeriod } from "../game/DayNightCycle";
import { NATURE_RUPEES } from "../game/nature/layout";
import { RABBITS, freshRabbits, rabbitsHome, validRabbits, type RabbitId, type RabbitProgress } from "../game/rabbits/definitions";
import {
  freshMinibosses, validMinibosses, minibossDefeated,
  STONE_GIANT_START_DISTANCE, STONE_GIANT_EXIT_DISTANCE,
  type MinibossId, type MinibossProgress,
} from "../game/minibosses/definitions";
import {
  startEncounter, selectRune, finishFeedback, type MinibossEncounter,
} from "../game/minibosses/state";
import { VOLCANO_RUPEES } from "../game/volcanoLayout";
import {
  freshPuzzles,
  validPuzzles,
  puzzleSolved,
  PUZZLES,
  type PuzzlesProgress,
} from "../game/puzzles/definitions";
import {
  WORLD_OBJECTS,
  PICKUP_OBJECTS,
  sameLocation,
  validWorldObjects,
  type WorldObjectId,
} from "../game/interactables/definitions";
import { canOpenChest } from "../game/entities/chestAccess";
import type { ChestDefinition } from "../game/entities/chestDefinitions";
import {
  SHOP,
  isShopItem,
  validPurchases,
  purchaseTotal,
  type ShopItemId,
} from "../items/shop";
import type { SoundEvent } from "../audio/types";
import {
  CHESTS,
  CHEST_IDS,
  type ChestId,
} from "../game/entities/chestDefinitions";
import {
  WORLD_SECRETS,
  BUTTERFLY_SECRETS,
  ROCK_SECRETS,
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
  natureRestored,
  volcanoGateOpen,
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
export const SAVE_VERSION = 20;
export const RUPEE_IDS = [
  ...NATURE_RUPEES.map(r => r.id),
  ...VOLCANO_RUPEES.map(({ id }) => id),
  "royal-helmet-rupee",
  "royal-pot-rupee",
  ...ROCK_SECRETS.flatMap((s) => [...s.pickupIds]),
  "path-1",
  "path-2",
  "path-3",
  "path-4",
  "south-path-1",
  "south-path-2",
  "south-path-3",
  "south-path-4",
  "castle-1",
  "castle-2",
  "castle-3",
  "castle-4",
  "castle-5",
  "castle-6",
];
export const REQUIRED_CORRECT_ANSWERS = 3;
export const hasBridgeEquipment = (state: Inventory) =>
  state.items.includes("temple-sword") && state.items.includes("temple-shield");
export type Target =
  | { kind: "farmer"; label: string }
  | { kind: "rabbit"; id: RabbitId; label: string }
  | { kind: "runeStone"; boss: MinibossId; value: number; label: string }
  | { kind: "worldObject"; id: WorldObjectId; label: string }
  | { kind: "shop"; itemId?: ShopItemId; label: string }
  | { kind: "castleDoor"; id: "library"; label: string }
  | "npc"
  | "bokoblin"
  | null
  | { kind: "chest"; id: ChestId; label: string }
  | { kind: "secret"; id: SecretId; label: string }
  | { kind: "challenge"; id: string; label: string };
export type Overlay =
  | "elephant"
  | "giraffe"
  | "farmer"
  | "rabbitReward"
  | "pictureClue"
  | "shop"
  | "castleDoor"
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
  rabbits: RabbitProgress;
  minibosses: MinibossProgress;
  puzzles: PuzzlesProgress;
  worldObjects: WorldObjectId[];
  purchases: ShopItemId[];
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
  followingRabbits: RabbitId[];
  rabbitCare: { id: RabbitId; action: "feed" | "pet"; sequence: number } | null;
  rabbitNextCare: Record<RabbitId, "feed" | "pet">;
  encounter: MinibossEncounter | null;
  objectEvent: { id: WorldObjectId; sequence: number } | null;
  movingBarriers: string[];
  shopSelection: ShopItemId | null;
  shopPurchased: boolean;
  castleMessage: string;
  shopGreeting: boolean;
  overlay: Overlay;
  target: Target;
  question: MathQuestion | null;
  feedback: "retry" | "correct" | "complete" | null;
  /** Question keys already used in the open quiz, so none of them repeats. */
  askedQuestions: string[];
  quizCorrectAnswers: number;
  dungeonQuiz: string | null;
  activeChest: ChestId | null;
  activeSecret: SecretId | null;
  motion: { index: number; from: number; to: number } | null;
  reward: number;
  rewardItems: ItemId[];
  savingAvailable: boolean;
  resetId: number;
  debugActive: boolean;
  debugNoclip: boolean;
  debugDayPeriod: { period: DayPeriod } | null;
}
const fresh = (): Progress => ({
  ...freshInventory(),
  rabbits: freshRabbits(),
  minibosses: freshMinibosses(),
  puzzles: freshPuzzles(),
  worldObjects: [],
  purchases: [],
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
      p?.version !== SAVE_VERSION ||
      !validInventory(p) ||
      !validRabbits(p.rabbits) ||
      (RABBITS.some(({ id }) => p.rabbits[id]) && !p.bridgeUnlocked) ||
      ((p.location?.world || p.location?.dungeon === "fire") && !rabbitsHome(p.rabbits)) ||
      !validMinibosses(p.minibosses) ||
      !validPuzzles(p.puzzles) ||
      !validWorldObjects(p.worldObjects) ||
      !validPurchases(p.purchases, p.items) ||
      !validDungeons(p.dungeons) ||
      ((p.location?.world === "volcano-interior" || p.location?.dungeon === "fire" ||
        Object.values(p.dungeons.fire.answers).some((n) => n !== 0) ||
        p.dungeons.fire.stones.stones.some((n: number) => n !== 0)) &&
        !minibossDefeated(p.minibosses, "stone_giant")) ||
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
      !Array.isArray(p.collected) ||
      !validSecrets(p.secrets, p.chests, p.bridgeUnlocked, p.collected) ||
      (p.chests["stone-giant-treasure"] &&
        (!minibossDefeated(p.minibosses, "stone_giant") ||
          !p.items.includes("lava_hat") ||
          !p.items.includes("stone_armor"))) ||
      (p.chests["royal-treasure"] &&
        (!puzzleSolved(p.puzzles, "royal-symbols") ||
          !p.items.includes("royal-crown"))) ||
      PICKUP_OBJECTS.some((id) => {
        const b = WORLD_OBJECTS[id].behavior;
        return (
          b.kind === "pickup" &&
          p.collected.includes(b.pickup) &&
          !p.worldObjects.includes(id)
        );
      }) ||
      typeof p.bridgeUnlocked !== "boolean" ||
      (p.bridgeUnlocked && !hasBridgeEquipment(p)) ||
      (p.chests.south && !p.bridgeUnlocked) ||
      (p.chests["south-fire-shield"] && (!p.bridgeUnlocked || !p.items.includes("fire-shield"))) ||
      typeof p.talkedToNpc !== "boolean" ||
      !Array.isArray(p.collected) ||
      p.collected.some(
        (id: unknown) => typeof id !== "string" || !RUPEE_IDS.includes(id),
      ) ||
      new Set(p.collected).size !== p.collected.length ||
      !validNatureProgress(p) ||
      p.rupees !==
        p.collected.length +
          CHEST_IDS.reduce(
            (sum, id) => sum + (p.chests[id] ? CHESTS[id].reward : 0),
            0,
          ) +
          dungeonRewardTotal(p.dungeons) + (rabbitsHome(p.rabbits) ? 10 : 0) -
          purchaseTotal(p.purchases)
    )
      return fresh();
    return {
      rabbits: p.rabbits,
      minibosses: p.minibosses,
      puzzles: p.puzzles,
      worldObjects: p.worldObjects,
      purchases: p.purchases,
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
    followingRabbits: [],
    rabbitCare: null,
    rabbitNextCare: { cream: "feed", brown: "feed", gray: "feed" },
    shopSelection: null,
    shopPurchased: false,
    castleMessage: "",
    shopGreeting: false,
    ...progress,
    encounter: null,
    overlay: null,
    target: null,
    question: null,
    feedback: null,
    askedQuestions: [],
    quizCorrectAnswers: 0,
    dungeonQuiz: null,
    activeChest: null,
    motion: null,
    activeSecret: null,
    movingBarriers: [],
    objectEvent: null,
    reward: 0,
    rewardItems: [],
    savingAvailable,
    resetId: 0,
    debugActive: false,
    debugNoclip: false,
    debugDayPeriod: null,
  };
  let rabbitCareSequence = 0;
  let debugBaseline: Progress | null = null;
  const soundListeners = new Set<(event: SoundEvent) => void>();
  const emitSound = (event: SoundEvent) => {
    if (!state.debugActive)
      soundListeners.forEach((listener) => listener(event));
  };
  const listeners = new Set<() => void>();
  const set = (
    update: Partial<GameState>,
    persist = false,
    sound?: SoundEvent,
  ) => {
    if (("location" in update && JSON.stringify(update.location) !== JSON.stringify(state.location)) || "resetId" in update) {
      update = { ...update, followingRabbits: [], rabbitCare: null, rabbitNextCare: { cream: "feed", brown: "feed", gray: "feed" } };
    }
    state = { ...state, ...update };
    if (persist && storage && !state.debugActive) {
      try {
        storage.setItem(
          SAVE_KEY,
          JSON.stringify({
            version: SAVE_VERSION,
            rabbits: state.rabbits,
            minibosses: state.minibosses,
            puzzles: state.puzzles,
            worldObjects: state.worldObjects,
            purchases: state.purchases,
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
    if (sound) emitSound(sound);
  };
  // A generated question is always recorded so the same one cannot come up
  // twice while the quiz is open.
  const askQuestion = (question: MathQuestion): Partial<GameState> => ({
    question,
    feedback: null,
    askedQuestions: [...state.askedQuestions, question.key],
  });
  const chestQuestion = (asked: readonly string[] = []): MathQuestion => {
    const definition: ChestDefinition | undefined = state.activeChest
      ? CHESTS[state.activeChest]
      : undefined;
    return definition?.pictureQuiz
      ? generateTempleQuestion(definition.pictureQuiz, Math.random, asked)
      : generateAdditionQuestion(Math.random, asked);
  };
  const nextQuestion = (): MathQuestion | null => {
    if (state.dungeonQuiz) {
      const c = resolveRoom(state.location)?.room.challenge;
      return c
        ? generateTempleQuestion(c.kind, Math.random, state.askedQuestions)
        : null;
    }
    return chestQuestion(state.askedQuestions);
  };
  // The chest flag, currency and associated discovery are committed together.
  const chestAward = (id: ChestId): Partial<GameState> => {
    if (state.chests[id]) return {};
    const secret = BUTTERFLY_SECRETS.find((s) => s.chestId === id);
    return {
      ...receiveItems(state, (CHESTS[id] as ChestDefinition).items ?? [], true),
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
    base = state,
  ): Partial<GameState> => {
    const dungeon = DUNGEONS.find((candidate) => candidate.id === dungeonId);
    const current = base.dungeons[dungeonId];
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
    let inventory: Inventory = base;
    let rupees = base.rupees;
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
      dungeons: { ...base.dungeons, [dungeonId]: progress },
    };
  };
  return {
    getState: () => state,
    updateMinibossPresence: (id: MinibossId, distance: number) => {
      if (
        state.location?.world !== "volcano" || state.overlay ||
        state.motion || !Number.isFinite(distance)
      ) return;
      if (state.encounter?.id === id && distance > STONE_GIANT_EXIT_DISTANCE) {
        set({ encounter: null, target: null });
      } else if (
        !state.encounter && distance <= STONE_GIANT_START_DISTANCE &&
        !minibossDefeated(state.minibosses, id)
      ) {
        set({ encounter: startEncounter(id, state.minibosses[id]), target: null });
      }
    },
    finishMinibossFeedback: (expected: MinibossEncounter) => {
      if (
        state.encounter !== expected || state.overlay || state.motion ||
        state.location?.world !== "volcano"
      ) return;
      const encounter = finishFeedback(expected);
      if (encounter !== expected) set({ encounter, target: null });
    },
    resetRuneSelection: () => {
      if (
        state.overlay || state.motion || state.encounter?.status !== "choosing" ||
        !state.encounter.selected.length
      ) return;
      set({ encounter: { ...state.encounter, selected: [] } });
    },
    discoverSecret: (id: SecretId) => {
      const definition = WORLD_SECRETS.find((s) => s.id === id);
      if (
        !definition ||
        (definition.requiresBridge && !state.bridgeUnlocked) ||
        !secretInLocation(definition, state.location) ||
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
        !secretInLocation(definition, state.location) ||
        state.overlay ||
        state.motion ||
        !progress?.discovered ||
        progress.revealed
      )
        return;
      set(
        {
          secrets: { ...state.secrets, [id]: { ...progress, revealed: true } },
          ...(state.activeSecret === id ? { activeSecret: null } : {}),
        },
        true,
        "discovery",
      );
    },
    grantItems: (ids: readonly ItemId[], equip = false) => {
      const update = receiveItems(state, ids, equip);
      const hasNew = ids.some((id) => !state.items.includes(id));
      set(update, true, hasNew ? "reward" : undefined);
    },
    equipItem: (id: ItemId, slot: EquipmentSlot) => {
      if (
        !isItemId(id) ||
        !state.items.includes(id) ||
        ITEMS[id].equipSlot !== slot
      )
        return;
      set({ equipment: { ...state.equipment, [slot]: id } }, true);
    },
    unequipItem: (slot: EquipmentSlot) => {
      if (!["head", "body", "weapon", "shield"].includes(slot)) return;
      set(
        {
          equipment: {
            ...state.equipment,
            [slot]: slot === "body" ? "green-clothes" : null,
          },
        },
        true,
      );
    },
    greetShop: () => {
      if (state.location?.castle === "shop" && !state.shopGreeting)
        set({ shopGreeting: true });
    },
    selectShopItem: (id: ShopItemId | null) => {
      if (state.overlay === "shop" && (id === null || isShopItem(id)))
        set({ shopSelection: id, shopPurchased: false });
    },
    buyItem: (id: ItemId) => {
      if (
        state.location?.castle !== "shop" ||
        state.overlay !== "shop" ||
        !isShopItem(id) ||
        state.items.includes(id) ||
        state.rupees < SHOP[id]
      )
        return false;
      set(
        {
          ...receiveItems(state, [id]),
          rupees: state.rupees - SHOP[id],
          purchases: [...state.purchases, id],
          shopSelection: id,
          shopPurchased: true,
        },
        true,
        "reward",
      );
      return true;
    },
    openInventory: () => {
      if (state.motion || (state.overlay && state.overlay !== "itemReward"))
        return;
      set({ overlay: "inventory", reward: 0, rewardItems: [] });
    },
    subscribeSound: (fn: (event: SoundEvent) => void) => {
      soundListeners.add(fn);
      return () => {
        soundListeners.delete(fn);
      };
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
        if (found.dungeon.requiresBridge || found.dungeon.entranceWorld) {
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
      if (destination?.world || found?.dungeon.entranceWorld) {
        update = { ...update,
          ...receiveItems({ ...state, ...update }, ["temple-sword", "temple-shield"]),
          bridgeUnlocked: true,
          rabbits: { cream: true, brown: true, gray: true },
          rupees: (update.rupees ?? state.rupees) + (rabbitsHome(state.rabbits) ? 0 : 10),
        };
      }
      if (destination?.world === "volcano-interior" || found?.dungeon.id === "fire")
        update.minibosses = { ...state.minibosses, stone_giant: 3 };
      const natureWorld = destination?.world === "water" || destination?.world === "desert" ? destination.world : found?.dungeon.entranceWorld;
      if (natureWorld === "water" || natureWorld === "desert") {
        update.minibosses = { ...state.minibosses, stone_giant: 3 };
        update = { ...update, ...solveThrough("fire", 2, { ...state, ...update }) };
        if (natureWorld === "desert") update = { ...update, ...solveThrough("water", 2, { ...state, ...update }) };
      }
      set({
        ...update,
        location: destination,
        encounter: null,
        shopGreeting: false,
        shopSelection: null,
        shopPurchased: false,
        target: null,
        motion: null,
        activeSecret: null,
        movingBarriers: [],
        objectEvent: null,
        question: null,
        feedback: null,
        askedQuestions: [],
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
    debugOpenShop: () => {
      if (state.overlay !== "debug") return;
      beginDebugSession();
      set({
        rupees: Math.max(100, state.rupees),
        location: { castle: "shop" },
        overlay: "shop",
        target: null,
        shopSelection: null,
        shopPurchased: false,
        shopGreeting: false,
      });
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
    debugSetDayPeriod: (period: DayPeriod) => {
      if (state.overlay !== "debug" || state.location) return;
      beginDebugSession();
      set({ debugDayPeriod: { period } });
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
        encounter: null,
        overlay: "debug",
        target: null,
        question: null,
        feedback: null,
        askedQuestions: [],
        quizCorrectAnswers: 0,
        dungeonQuiz: null,
        activeChest: null,
        motion: null,
        activeSecret: null,
        movingBarriers: [],
        objectEvent: null,
        reward: 0,
        rewardItems: [],
        shopGreeting: false,
        shopSelection: null,
        shopPurchased: false,
        resetId: state.resetId + 1,
        debugDayPeriod: null,
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
        encounter: null,
        overlay: null,
        target: null,
        question: null,
        feedback: null,
        askedQuestions: [],
        quizCorrectAnswers: 0,
        dungeonQuiz: null,
        activeChest: null,
        motion: null,
        activeSecret: null,
        movingBarriers: [],
        objectEvent: null,
        reward: 0,
        rewardItems: [],
        shopGreeting: false,
        shopSelection: null,
        shopPurchased: false,
        resetId: state.resetId + 1,
        debugDayPeriod: null,
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
      const interiorAdjacent =
        (state.location?.world === "volcano" && destination?.world === "volcano-interior" && minibossDefeated(state.minibosses, "stone_giant")) ||
        (state.location?.world === "volcano-interior" && destination?.world === "volcano") ||
        (state.location?.world === "volcano-interior" && next?.dungeon.id === "fire" && currentIndex === -1 && next.room === next.dungeon.rooms[0]) ||
        (found?.dungeon.id === "fire" && destination?.world === "volcano-interior" && (currentIndex === 0 || (currentIndex === found.dungeon.rooms.length - 1 && roomSolved(found.room, state.dungeons.fire))));
      const natureAdjacent =
        (state.location?.world === "volcano-interior" && destination?.world === "water" && volcanoGateOpen(state.dungeons)) ||
        (state.location?.world === "water" && destination?.world === "volcano-interior") ||
        (state.location?.world === "water" && destination?.world === "desert" && natureRestored(state.dungeons, "water")) ||
        (state.location?.world === "desert" && destination?.world === "water") ||
        ((state.location?.world === "water" || state.location?.world === "desert") && next?.dungeon.entranceWorld === state.location.world && next.room === next.dungeon.rooms[0]) ||
        ((found?.dungeon.entranceWorld === "water" || found?.dungeon.entranceWorld === "desert") && destination?.world === found.dungeon.entranceWorld && (currentIndex === 0 || (currentIndex === found.dungeon.rooms.length - 1 && roomSolved(found.room, state.dungeons[found.dungeon.id]))));
      const volcanoAdjacent =
        (state.location === null &&
          destination?.world === "volcano" && state.bridgeUnlocked && rabbitsHome(state.rabbits)) ||
        (state.location?.world === "volcano" && destination === null);
      const castleAdjacent =
        (!state.location && destination?.castle === "hall") ||
        (state.location?.castle === "hall" &&
          (destination === null ||
            destination?.castle === "shop" ||
            destination?.castle === "throne")) ||
        ((state.location?.castle === "shop" ||
          state.location?.castle === "throne") &&
          destination?.castle === "hall");
      const adjacent = !state.location
        ? !!next && !next.dungeon.entranceWorld && next.dungeon.rooms[0] === next.room
        : (!destination && !found?.dungeon.entranceWorld &&
            (currentIndex === 0 ||
              (!!found &&
                currentIndex === found.dungeon.rooms.length - 1 &&
                roomSolved(found.room, state.dungeons[found.dungeon.id])))) ||
          (!!next &&
            next.dungeon === found?.dungeon &&
            Math.abs(next.dungeon.rooms.indexOf(next.room) - currentIndex) ===
              1);
      if (
        (natureAdjacent || interiorAdjacent || volcanoAdjacent || castleAdjacent || adjacent) &&
        canVisit(destination, state.dungeons)
      )
        set(
          {
            location: destination,
            encounter: null,
            shopGreeting: false,
            shopSelection: null,
            shopPurchased: false,
            target: null,
            motion: null,
            activeSecret: null,
            movingBarriers: [],
            objectEvent: null,
            reward: 0,
          },
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
        "stone",
      );
      return true;
    },
    finishBarrier: (id: string) => {
      if (state.movingBarriers.includes(id))
        set({ movingBarriers: state.movingBarriers.filter((b) => b !== id) });
    },
    bringRabbitHome: (id: RabbitId) => {
      if (state.location || !state.bridgeUnlocked || state.overlay || state.motion ||
          !state.followingRabbits.includes(id) || state.rabbits[id]) return;
      const rabbits = { ...state.rabbits, [id]: true };
      const completed = rabbitsHome(rabbits);
      set({ rabbits, followingRabbits: state.followingRabbits.filter(r => r !== id),
        ...(completed ? { rupees: state.rupees + 10, overlay: "rabbitReward" as const, target: null } : {}),
      }, true, completed ? "reward" : "discovery");
    },
    finishRabbitCare: (sequence: number) => {
      if (state.rabbitCare?.sequence === sequence) set({ rabbitCare: null });
    },
    interact: () => {
      if (state.overlay || state.motion || !state.target) return;
      if (typeof state.target === "object") {
        const target = state.target;
        if (target.kind === "worldObject") {
          const definition = WORLD_OBJECTS[target.id];
          if (!definition || !sameLocation(state.location, definition.location))
            return;
          const behavior = definition.behavior;
          const update: Partial<GameState> = {
            objectEvent: {
              id: target.id,
              sequence: (state.objectEvent?.sequence ?? 0) + 1,
            },
          };
          let persist = false;
          let event: SoundEvent = definition.sound;
          if (behavior.kind === "symbol") {
            const progress = state.puzzles[behavior.puzzle];
            if (!progress.activated.includes(target.id)) {
              update.puzzles = {
                ...state.puzzles,
                [behavior.puzzle]: {
                  activated: [...progress.activated, target.id],
                },
              };
              persist = true;
              if (puzzleSolved(update.puzzles, behavior.puzzle)) {
                update.movingBarriers = [
                  ...state.movingBarriers,
                  PUZZLES[behavior.puzzle].barrier,
                ];
                event = "mechanism";
              }
            } else event = "interact";
          } else if (
            behavior.kind === "pickup" &&
            !state.worldObjects.includes(target.id)
          ) {
            update.worldObjects = [...state.worldObjects, target.id];
            persist = true;
          } else if (behavior.kind === "clue") update.overlay = "pictureClue";
          else if (behavior.kind === "animal") update.overlay = behavior.animal;
          set(update, persist, event);
          return;
        }
        if (target.kind === "farmer") {
          if (!state.location && state.bridgeUnlocked) set({ overlay: "farmer" }, false, "interact");
          return;
        }
        if (target.kind === "rabbit") {
          if (state.location || !state.bridgeUnlocked || !RABBITS.some(r => r.id === target.id)) return;
          if (!state.rabbits[target.id]) {
            if (!state.followingRabbits.includes(target.id))
              set({ followingRabbits: [...state.followingRabbits, target.id], target: null }, false, "interact");
          } else if (rabbitsHome(state.rabbits) && !state.rabbitCare) {
            const action = state.rabbitNextCare[target.id];
            set({ rabbitCare: { id: target.id, action, sequence: ++rabbitCareSequence },
              rabbitNextCare: { ...state.rabbitNextCare, [target.id]: action === "feed" ? "pet" : "feed" },
              target: null,
            }, false, "interact");
          }
          return;
        }
        if (target.kind === "shop") {
          if (state.location?.castle !== "shop") return;
          set(
            {
              overlay: "shop",
              shopSelection: target.itemId ?? null,
              shopPurchased: false,
            },
            false,
            "interact",
          );
          return;
        }
        if (target.kind === "castleDoor") {
          if (state.location?.castle !== "hall") return;
          set({
            overlay: "castleDoor",
            castleMessage: "Biblioteket är stängt idag!",
          });
          return;
        }
        if (target.kind === "secret") {
          const definition = ROCK_SECRETS.find((s) => s.id === target.id);
          if (
            !definition ||
            !secretInLocation(definition, state.location) ||
            state.activeSecret ||
            state.secrets[target.id].revealed ||
            (definition.requiresBridge && !state.bridgeUnlocked)
          )
            return;
          set(
            {
              activeSecret: target.id,
              target: null,
              secrets: {
                ...state.secrets,
                [target.id]: { ...state.secrets[target.id], discovered: true },
              },
            },
            true,
            "interact",
          );
          return;
        }
        if (target.kind === "runeStone") {
          const current = state.encounter;
          if (state.location?.world !== "volcano" || !current || current.id !== target.boss) return;
          const encounter = selectRune(current, target.value);
          if (encounter === current) return;
          const success = encounter.status === "success";
          set({
            encounter,
            ...(success ? {
              minibosses: { ...state.minibosses, [current.id]: current.phase + 1 },
              target: null,
            } : {}),
          }, success);
          return;
        }
        if (target.kind === "chest") {
          if (!canOpenChest(state, target.id)) return;
          if (
            CHESTS[target.id].opening === "direct" &&
            !state.chests[target.id]
          ) {
            set(
              {
                ...chestAward(target.id),
                reward: CHESTS[target.id].reward,
                rewardItems: [
                  ...((CHESTS[target.id] as ChestDefinition).items ?? []),
                ],
                overlay: (CHESTS[target.id] as ChestDefinition).items?.length
                  ? "itemReward"
                  : null,
                activeChest: null,
              },
              true,
              "reward",
            );
            return;
          }
          set(
            {
              activeChest: target.id,
              overlay: state.chests[target.id] ? "empty" : "locked",
            },
            false,
            "interact",
          );
          return;
        }
        const found = resolveRoom(state.location);
        if (found && found.room.challenge?.id === target.id) {
          const c = found.room.challenge;
          const answers = state.dungeons[found.dungeon.id].answers[c.id];
          if (answers < c.required) {
            const templeQuestion = generateTempleQuestion(c.kind);
            set(
              {
                overlay: "quiz",
                dungeonQuiz: c.id,
                question: templeQuestion,
                askedQuestions: [templeQuestion.key],
                quizCorrectAnswers: answers,
                feedback: null,
              },
              false,
              "interact",
            );
          }
        }
        return;
      }
      if (state.location) return;
      if (state.target === "npc")
        set({ overlay: "npc", talkedToNpc: true }, true, "interact");
      else if (state.target === "bokoblin" && !state.bridgeUnlocked) {
        if (hasBridgeEquipment(state))
          set({ bridgeUnlocked: true, target: null }, true, "discovery");
        else set({ overlay: "bokoblin" }, false, "interact");
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
        askedQuestions: [],
        quizCorrectAnswers: 0,
      }),
    beginQuiz: () => {
      if (state.dungeonQuiz) return;
      if (
        state.overlay === "locked" &&
        state.activeChest &&
        !state.chests[state.activeChest] &&
        CHESTS[state.activeChest].opening === "quiz"
      ) {
        const question = chestQuestion();
        set({
          overlay: "quiz",
          question,
          askedQuestions: [question.key],
          feedback: null,
          quizCorrectAnswers: 0,
        });
      }
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
          state.feedback
        )
          return;
        const progress = state.dungeons[found.dungeon.id];
        if (progress.answers[c.id] >= c.required) return;
        if (answer !== state.question.correctAnswer) {
          set({ feedback: "retry" }, false, "retry");
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
          complete ? "complete" : "correct",
        );
        return;
      }
      if (
        state.overlay !== "quiz" ||
        !state.question ||
        !state.activeChest ||
        state.chests[state.activeChest] ||
        state.feedback
      )
        return;
      if (answer !== state.question.correctAnswer) {
        set({ feedback: "retry" }, false, "retry");
        return;
      }
      const quizCorrectAnswers = state.quizCorrectAnswers + 1;
      if (quizCorrectAnswers < REQUIRED_CORRECT_ANSWERS) {
        set({ quizCorrectAnswers, feedback: "correct" }, false, "correct");
        return;
      }
      set(
        {
          ...chestAward(state.activeChest),
          rewardItems: [
            ...((CHESTS[state.activeChest] as ChestDefinition).items ?? []),
          ],
          feedback: "complete",
          quizCorrectAnswers,
        },
        true,
        "complete",
      );
    },
    // A wrong answer is followed by a fresh question, so guessing through the
    // buttons never gets the child to the next star.
    replaceQuestion: () => {
      if (state.overlay !== "quiz" || state.feedback !== "retry") return;
      const question = nextQuestion();
      if (question) set(askQuestion(question));
    },
    finishQuiz: () => {
      if (state.dungeonQuiz) {
        const c = resolveRoom(state.location)?.room.challenge;
        if (!c) return;
        if (state.feedback === "correct")
          set(
            askQuestion(
              generateTempleQuestion(c.kind, Math.random, state.askedQuestions),
            ),
          );
        else if (state.feedback === "complete")
          set({
            overlay: state.rewardItems.length ? "itemReward" : null,
            question: null,
            feedback: null,
            askedQuestions: [],
            dungeonQuiz: null,
            activeChest: null,
            quizCorrectAnswers: 0,
            reward: c.reward,
          });
        return;
      }
      if (state.feedback === "correct")
        set(askQuestion(chestQuestion(state.askedQuestions)));
      else if (state.feedback === "complete")
        set({
          overlay: state.rewardItems.length ? "itemReward" : null,
          question: null,
          feedback: null,
          askedQuestions: [],
          quizCorrectAnswers: 0,
          reward: state.activeChest ? CHESTS[state.activeChest].reward : 0,
          activeChest: null,
        });
    },
    collect: (id: string) => {
      const secret = ROCK_SECRETS.find((s) =>
        s.pickupIds.some((pickup) => pickup === id),
      );
      if (
        state.overlay ||
        !pickupAllowed(state, id) ||
        !RUPEE_IDS.includes(id) ||
        state.collected.includes(id) ||
        (secret && !state.secrets[secret.id].revealed)
      )
        return;
      const collected = [...state.collected, id];
      set(
        {
          rupees: state.rupees + 1,
          collected,
          ...(secret
            ? {
                secrets: {
                  ...state.secrets,
                  [secret.id]: {
                    ...state.secrets[secret.id],
                    completed: secret.pickupIds.every((pickup) =>
                      collected.includes(pickup),
                    ),
                  },
                },
              }
            : {}),
        },
        true,
        "rupee",
      );
    },
    finishMotion: () => {
      if (state.motion) {
        const found = resolveRoom(state.location);
        const solved =
          found && roomSolved(found.room, state.dungeons[found.dungeon.id]);
        set({ motion: null }, false, solved ? "solved" : undefined);
      }
    },
    resetPuzzle: () => {
      const found = resolveRoom(state.location);
      if (!found?.room.stones || state.overlay || state.motion) return;
      const progress = state.dungeons[found.dungeon.id];
      if (roomSolved(found.room, progress)) return;
      set(
        {
          target: null,
          shopGreeting: false,
          shopSelection: null,
          shopPurchased: false,
          resetId: state.resetId + 1,
          debugDayPeriod: null,
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
          encounter: null,
          dungeonQuiz: null,
          activeChest: null,
          motion: null,
          activeSecret: null,
          movingBarriers: [],
          objectEvent: null,
          overlay: null,
          target: null,
          question: null,
          feedback: null,
          askedQuestions: [],
          quizCorrectAnswers: 0,
          reward: 0,
          rewardItems: [],
          shopGreeting: false,
          shopSelection: null,
          shopPurchased: false,
          resetId: state.resetId + 1,
          debugDayPeriod: null,
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
    rabbits: { ...state.rabbits },
    minibosses: { ...state.minibosses },
    puzzles: {
      "royal-symbols": {
        activated: [...state.puzzles["royal-symbols"].activated],
      },
    },
    worldObjects: [...state.worldObjects],
    purchases: [...state.purchases],
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
  if (value && typeof value === "object" && "world" in value)
    return (
      Object.keys(value).length === 1 &&
      (value.world === "volcano" || value.world === "volcano-interior" || value.world === "water" || value.world === "desert")
    );
  if (value && typeof value === "object" && "castle" in value)
    return (
      Object.keys(value).length === 1 &&
      (value.castle === "hall" ||
        value.castle === "shop" ||
        value.castle === "throne")
    );
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

function pickupAllowed(state: GameState, id: string) {
  const secret = ROCK_SECRETS.find((rock) => rock.pickupIds.some((pickup) => pickup === id));
  if (secret) return secretInLocation(secret, state.location);
  for (const objectId of PICKUP_OBJECTS) {
    const definition = WORLD_OBJECTS[objectId];
    const b = definition.behavior;
    if (b.kind === "pickup" && b.pickup === id)
      return (
        sameLocation(state.location, definition.location) &&
        state.worldObjects.includes(objectId)
      );
  }
  const natureRupee = NATURE_RUPEES.find(r => r.id === id);
  if (natureRupee) return state.location?.world === natureRupee.world;
  if (VOLCANO_RUPEES.some((rupee) => rupee.id === id))
    return state.location?.world === "volcano";
  if (id.startsWith("castle-")) return state.location?.castle === "hall";
  return state.location === null;
}

function secretInLocation(definition: (typeof WORLD_SECRETS)[number], location: GameState["location"]) {
  return definition.type === "strange-rock" && definition.world === "volcano"
    ? location?.world === "volcano"
    : location === null;
}

/** Check prerequisites even when a save is currently back in an earlier world. */
function validNatureProgress(p: Progress) {
  const touched = (world: "water" | "desert") => {
    const d = DUNGEONS.find(d => d.id === world)!;
    return p.location?.world === world || p.location?.dungeon === world || p.chests[`${world}-01`] ||
      NATURE_RUPEES.some(r => r.world === world && p.collected.includes(r.id)) ||
      d.rooms.some(r => r.challenge ? p.dungeons[world].answers[r.challenge.id] > 0 : r.stones?.some((stone, i) => p.dungeons[world].stones[r.id][i] !== stone.start));
  };
  if ((touched("water") || touched("desert")) && (!p.bridgeUnlocked || !rabbitsHome(p.rabbits) || !minibossDefeated(p.minibosses, "stone_giant") || !volcanoGateOpen(p.dungeons))) return false;
  if (touched("desert") && !natureRestored(p.dungeons, "water")) return false;
  return ([ ["water", "water-shield"], ["desert", "sun-hat"] ] as const).every(([world, item]) => natureRestored(p.dungeons, world) === p.items.includes(item));
}
