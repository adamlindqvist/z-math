import type { ItemId } from "../../items/definitions";
export type SymbolKind = "sun" | "leaf" | "moon";
export interface StoneDefinition {
  id: string;
  symbol: SymbolKind;
  z: number;
  goal: number;
  tiles: Partial<Record<number, SymbolKind>>;
}
export interface ChallengeDefinition {
  id: string;
  title: string;
  kind: "counting" | "addition";
  required: number;
  reward: number;
  items?: ItemId[];
}
export interface RoomDefinition {
  id: string;
  name: string;
  hint: string;
  challenge?: ChallengeDefinition;
  stones?: StoneDefinition[];
}
export type DungeonTheme = "water";
export interface DungeonDefinition {
  theme: DungeonTheme;
  id: string;
  name: string;
  entrance: { x: number; z: number };
  rooms: RoomDefinition[];
}
export const TRACK_X = [-3.2, -1.6, 0, 1.6, 3.2];
export const DUNGEONS: DungeonDefinition[] = [
  {
    id: "moss",
    name: "Vattentemplet",
    theme: "water",
    entrance: { x: 2, z: -3.4 },
    rooms: [
      {
        id: "light",
        name: "Ljusporten",
        hint: "Räkna och tänd fem lampor!",
        challenge: {
          id: "light-lock",
          title: "Tänd lamporna",
          kind: "counting",
          required: 5,
          reward: 0,
        },
      },
      {
        id: "stones",
        name: "Stensalen",
        hint: "Gå mot stenen. Matcha bilderna!",
        stones: [
          {
            id: "sun",
            symbol: "sun",
            z: -2.6,
            goal: 0,
            tiles: { 0: "sun", 1: "leaf", 4: "moon" },
          },
          {
            id: "leaf",
            symbol: "leaf",
            z: 0,
            goal: 4,
            tiles: { 0: "moon", 3: "sun", 4: "leaf" },
          },
          {
            id: "moon",
            symbol: "moon",
            z: 2.6,
            goal: 1,
            tiles: { 0: "leaf", 1: "moon", 4: "sun" },
          },
        ],
      },
      {
        id: "treasure",
        name: "Skattkammaren",
        hint: "Räkna ihop och öppna skatten!",
        challenge: {
          id: "treasure-lock",
          title: "Skattens mattelås",
          kind: "addition",
          required: 5,
          reward: 5,
          items: ["temple-sword", "temple-shield"],
        },
      },
    ],
  },
];
export type Location = { dungeon: string; room: string } | null;
export interface DungeonProgress {
  answers: Record<string, number>;
  stones: Record<string, number[]>;
  rewards: string[];
}
export function freshDungeons(): Record<string, DungeonProgress> {
  return Object.fromEntries(
    DUNGEONS.map((d) => [
      d.id,
      {
        answers: Object.fromEntries(
          d.rooms.flatMap((r) => (r.challenge ? [[r.challenge.id, 0]] : [])),
        ),
        stones: Object.fromEntries(
          d.rooms.flatMap((r) =>
            r.stones ? [[r.id, r.stones.map(() => 2)]] : [],
          ),
        ),
        rewards: [],
      },
    ]),
  );
}
export function resolveRoom(location: Location) {
  const dungeon = DUNGEONS.find((d) => d.id === location?.dungeon);
  const room = dungeon?.rooms.find((r) => r.id === location?.room);
  return dungeon && room ? { dungeon, room } : null;
}
export function roomSolved(room: RoomDefinition, progress: DungeonProgress) {
  if (room.challenge)
    return progress.answers[room.challenge.id] === room.challenge.required;
  return !!room.stones?.every((s, i) => progress.stones[room.id][i] === s.goal);
}
export function canVisit(
  location: Location,
  progress: Record<string, DungeonProgress>,
) {
  if (!location) return true;
  const found = resolveRoom(location);
  if (!found) return false;
  const { dungeon, room } = found;
  return dungeon.rooms
    .slice(0, dungeon.rooms.indexOf(room))
    .every((r) => roomSolved(r, progress[dungeon.id]));
}
export function pushedPosition(position: number, direction: number) {
  if (direction !== -1 && direction !== 1) return null;
  const next = position + direction;
  return next >= 0 && next < TRACK_X.length ? next : null;
}
