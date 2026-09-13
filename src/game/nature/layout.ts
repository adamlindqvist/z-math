import { WATER_PICKUPS, WATER_SPAWN } from "../water/layout";
import type { Location } from "../dungeons/definitions";
export type NatureWorld = "water" | "desert";
export const NATURE_ENTRY = { x: 0, z: 22 };
export const NATURE_EXIT = { x: 0, z: 0 };
export const NATURE_TEMPLE = { x: 5, z: 6 };
export const NATURE_CHEST = { x: -5, z: 18 };
export const NATURE_RUPEES = (["water", "desert"] as const).flatMap((world) =>
  (world === "water"
    ? WATER_PICKUPS
    : [
        [0, 19],
        [-2, 18],
        [-4, 18],
        [0, 16],
        [0, 11],
        [2, 7.4],
        [4, 7.4],
      ]
  ).map(([x, z], i) => ({ id: `${world}-path-${i + 1}`, world, x, z })),
);
/** Arrival points are outside the automatic portal trigger, on the walkable side. */
export function natureArrival(location: Location, previous: Location) {
  if (location?.world === "volcano-interior" && previous?.world === "water")
    return { x: 0, z: -7 };
  if (location?.world !== "water" && location?.world !== "desert") return null;
  if (previous?.dungeon === location.world) return { x: 5, z: 7.4 };
  if (location.world === "water" && previous?.world === "desert")
    return { x: 0, z: 1.4 };
  return location.world === "water" ? { ...WATER_SPAWN } : { x: 0, z: 20.6 };
}
