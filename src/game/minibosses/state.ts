import { MINIBOSSES, type MinibossId } from "./definitions";

export type EncounterStatus =
  "intro" | "choosing" | "failure" | "success" | "collapsing";
export interface MinibossEncounter {
  id: MinibossId;
  phase: number;
  status: EncounterStatus;
  selected: number[];
}
export const FEEDBACK_SECONDS = {
  intro: 0.8,
  failure: 1.2,
  success: 1.5,
  collapsing: 2,
} as const;
export function startEncounter(
  id: MinibossId,
  phase: number,
): MinibossEncounter {
  return { id, phase, status: "intro", selected: [] };
}
/** Puzzle-specific validation, independent of phases, rendering and storage. */
export function selectPair(
  values: readonly number[],
  selected: readonly number[],
  value: number,
  target: number,
) {
  if (!values.includes(value)) return null;
  const next = selected.includes(value) ? [] : [...selected, value];
  return {
    selected: next,
    result:
      next.length === 2
        ? next[0] + next[1] === target
          ? "success"
          : "failure"
        : null,
  } as const;
}
export function selectRune(
  encounter: MinibossEncounter,
  value: number,
): MinibossEncounter {
  if (encounter.status !== "choosing") return encounter;
  const boss = MINIBOSSES[encounter.id];
  const next = selectPair(
    boss.puzzle.values,
    encounter.selected,
    value,
    boss.phases[encounter.phase],
  );
  return next
    ? {
        ...encounter,
        selected: next.selected,
        status: next.result ?? "choosing",
      }
    : encounter;
}
export function finishFeedback(
  encounter: MinibossEncounter,
): MinibossEncounter | null {
  switch (encounter.status) {
    case "intro":
    case "failure":
      return { ...encounter, status: "choosing", selected: [] };
    case "success":
      return encounter.phase + 1 === MINIBOSSES[encounter.id].phases.length
        ? { ...encounter, status: "collapsing" }
        : {
            ...encounter,
            phase: encounter.phase + 1,
            status: "choosing",
            selected: [],
          };
    case "collapsing":
      return null;
    default:
      return encounter;
  }
}
