import { DESERT_RETURN } from "../underworld/layout";
import {
  DESERT_PICKUPS,
  DESERT_SPAWN,
  DESERT_TEMPLE_ARRIVAL,
} from "../desert/layout";
import { WATER_PICKUPS, WATER_SPAWN } from "../water/layout";
import type { Location } from "../dungeons/definitions";
export type NatureWorld = "water" | "desert";
export const NATURE_ENTRY = { x: 0, z: 22 };
export const NATURE_EXIT = { x: 0, z: 0 };
export const NATURE_TEMPLE = { x: 5, z: 6 };
export const NATURE_CHEST = { x: -5, z: 18 };
export const NATURE_RUPEES = (["water", "desert"] as const).flatMap((world) =>
  (world === "water" ? WATER_PICKUPS : DESERT_PICKUPS).map(([x, z], i) => ({
    id: `${world}-path-${i + 1}`,
    world,
    x,
    z,
  })),
);
/** Arrival points are outside the automatic portal trigger, on the walkable side. */
export function natureArrival(location: Location, previous: Location) {
  if (location?.world === "volcano-interior" && previous?.world === "water")
    return { x: 0, z: -7 };
  if (location?.world !== "water" && location?.world !== "desert") return null;
  if (location.world === "desert" && previous?.world === "underworld") return { ...DESERT_RETURN };
  if (previous?.dungeon === location.world)
    return location.world === "desert"
      ? { ...DESERT_TEMPLE_ARRIVAL }
      : { x: 5, z: 7.4 };
  if (location.world === "water" && previous?.world === "desert")
    return { x: 0, z: 1.4 };
  return location.world === "water" ? { ...WATER_SPAWN } : { ...DESERT_SPAWN };
}
