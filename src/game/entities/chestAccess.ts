import { minibossDefeated } from "../minibosses/definitions";
import type { GameState } from "../../store/gameStore";
import { CHESTS, type ChestDefinition, type ChestId } from "./chestDefinitions";
import { BUTTERFLY_SECRETS } from "../secrets/definitions";
import { puzzleSolved } from "../puzzles/definitions";
import { sameLocation } from "../interactables/definitions";
export function canOpenChest(state: GameState, id: ChestId) {
  const definition: ChestDefinition = CHESTS[id];
  if (!definition || !sameLocation(state.location, definition.location)) return false;
  if (id === "stone-giant-treasure" && (!minibossDefeated(state.minibosses, "stone_giant") || state.encounter !== null)) return false;
  if (id === "south" && !state.bridgeUnlocked) return false;
  if (definition.puzzle && !puzzleSolved(state.puzzles, definition.puzzle)) return false;
  if (definition.barrier && state.movingBarriers.includes(definition.barrier)) return false;
  const secret = BUTTERFLY_SECRETS.find(s => s.chestId === id);
  return !secret || (state.secrets[secret.id].revealed && (!secret.requiresBridge || state.bridgeUnlocked));
}
