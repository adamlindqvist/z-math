import type { ChestId } from "../entities/chestDefinitions";

export type WorldSecret = {
  id: string;
  type: "butterfly";
  chestId: ChestId;
  requiresBridge: boolean;
  waypoints: readonly { x: number; z: number }[];
  chestPosition: { x: number; z: number };
};
export const WORLD_SECRETS = [
  {
    id: "butterfly-01",
    type: "butterfly",
    chestId: "butterfly-01",
    requiresBridge: false,
    waypoints: [
      { x: 4.8, z: 1.2 },
      { x: 0, z: 4.2 },
      { x: -5.8, z: 5 },
      { x: 0.5, z: -1.6 },
      { x: -3.4, z: -4.8 },
    ],
    chestPosition: { x: -3.4, z: -5.2 },
  },
  {
    id: "butterfly-02",
    type: "butterfly",
    chestId: "butterfly-02",
    requiresBridge: true,
    waypoints: [
      { x: 0, z: 21 },
      { x: 4, z: 17.4 },
      { x: -2, z: 18.7 },
      { x: 2, z: 23 },
      { x: -4.5, z: 24 },
    ],
    chestPosition: { x: -4.5, z: 24.4 },
  },
] as const satisfies readonly WorldSecret[];
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
): value is SecretsProgress {
  if (
    !value ||
    typeof value !== "object" ||
    Object.keys(value).length !== WORLD_SECRETS.length
  )
    return false;
  return WORLD_SECRETS.every(({ id, chestId, requiresBridge }) => {
    const p = (value as SecretsProgress)[id];
    return (
      p &&
      typeof p.discovered === "boolean" &&
      typeof p.completed === "boolean" &&
      typeof p.revealed === "boolean" &&
      (!p.revealed || p.discovered) &&
      (!p.completed || p.revealed) &&
      (!requiresBridge || bridgeUnlocked || !p.discovered) &&
      p.completed === chests[chestId]
    );
  });
}
