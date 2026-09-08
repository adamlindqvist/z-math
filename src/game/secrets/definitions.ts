import { gladePosition } from "../gladeLayout";
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
