import { gladePosition } from "../gladeLayout";
import type { ChestId } from "../entities/chestDefinitions";

export type ButterflySecret = {
  id: string;
  type: "butterfly";
  chestId: ChestId;
  requiresBridge: boolean;
  waypoints: readonly { x: number; z: number }[];
  chestPosition: { x: number; z: number };
};
export type StrangeRockSecret = {
  id: string;
  type: "strange-rock";
  requiresBridge: boolean;
  position: { x: number; z: number };
  offset: { x: number; z: number };
  pickupIds: readonly string[];
};
export type WorldSecret = ButterflySecret | StrangeRockSecret;
export const WORLD_SECRETS = [
  {
    id: "butterfly-01",
    type: "butterfly",
    chestId: "butterfly-01",
    requiresBridge: false,
    waypoints: [
      gladePosition(4.8, 1.2),
      gladePosition(0, 4.2),
      gladePosition(-5.8, 5),
      gladePosition(0.5, -1.6),
      gladePosition(-3.4, -4.8),
    ],
    chestPosition: gladePosition(-3.4, -5.2),
  },
  {
    id: "butterfly-02",
    type: "butterfly",
    chestId: "butterfly-02",
    requiresBridge: true,
    waypoints: [
      gladePosition(0, 21),
      gladePosition(4, 17.4),
      gladePosition(-2, 18.7),
      gladePosition(2, 23),
      gladePosition(-4.5, 24),
    ],
    chestPosition: gladePosition(-4.5, 24.4),
  },
  {
    id: "strange-rock-01",
    type: "strange-rock",
    requiresBridge: false,
    position: gladePosition(5, 5.2),
    offset: { x: 1.6, z: 0 },
    pickupIds: [
      "strange-rock-01-1",
      "strange-rock-01-2",
      "strange-rock-01-3",
      "strange-rock-01-4",
      "strange-rock-01-5",
    ],
  },
  {
    id: "strange-rock-02",
    type: "strange-rock",
    requiresBridge: true,
    position: gladePosition(-6.8, 26),
    offset: { x: 1.6, z: 0 },
    pickupIds: [
      "strange-rock-02-1",
      "strange-rock-02-2",
      "strange-rock-02-3",
      "strange-rock-02-4",
      "strange-rock-02-5",
    ],
  },
  {
    id: "strange-rock-03",
    type: "strange-rock",
    requiresBridge: true,
    position: gladePosition(6.2, 21.8),
    offset: { x: 1.6, z: 0 },
    pickupIds: [
      "strange-rock-03-1",
      "strange-rock-03-2",
      "strange-rock-03-3",
      "strange-rock-03-4",
      "strange-rock-03-5",
    ],
  },
] as const satisfies readonly WorldSecret[];
export const BUTTERFLY_SECRETS = WORLD_SECRETS.filter(
  (s) => s.type === "butterfly",
);
export const ROCK_SECRETS = WORLD_SECRETS.filter(
  (s) => s.type === "strange-rock",
);
export type SecretId = (typeof WORLD_SECRETS)[number]["id"];
export type SecretProgress = {
  discovered: boolean;
  revealed: boolean;
  completed: boolean;
};
export type SecretsProgress = Record<SecretId, SecretProgress>;
export const freshSecrets = (): SecretsProgress =>
  Object.fromEntries(
    WORLD_SECRETS.map(({ id }) => [
      id,
      { discovered: false, revealed: false, completed: false },
    ]),
  ) as SecretsProgress;

export function validSecrets(
  value: unknown,
  chests: Record<ChestId, boolean>,
  bridgeUnlocked: boolean,
  collected: readonly string[],
): value is SecretsProgress {
  if (
    !value ||
    typeof value !== "object" ||
    Object.keys(value).length !== WORLD_SECRETS.length
  )
    return false;
  return WORLD_SECRETS.every((definition) => {
    const { id, requiresBridge } = definition;
    const p = (value as SecretsProgress)[id];
    return (
      p &&
      typeof p.discovered === "boolean" &&
      typeof p.completed === "boolean" &&
      typeof p.revealed === "boolean" &&
      (!p.revealed || p.discovered) &&
      (!p.completed || p.revealed) &&
      (!requiresBridge || bridgeUnlocked || !p.discovered) &&
      (definition.type === "butterfly"
        ? p.completed === chests[definition.chestId]
        : definition.pickupIds.every(
            (id) => !collected.includes(id) || p.revealed,
          ) &&
          p.completed ===
            definition.pickupIds.every((id) => collected.includes(id)))
    );
  });
}
