export const WATER_ENTRY = { x: -8.4, z: 20, rotation: Math.PI / 2 };
export const WATER_SPAWN = { x: -7, z: 20 };
/** World-space waypoints used by scenery, pickups and walkability checks. */
export const WATER_PATHS = [
  [
    [-8.4, 20],
    [-6.2, 20],
    [-3.8, 21],
    [0, 20.6],
    [-0.9, 18.5],
    [0.9, 15.4],
    [0.5, 12],
    [-0.8, 9.3],
    [0.1, 6],
    [-0.4, 3],
    [0, 1.4],
    [0, 0],
  ],
  [
    [-0.9, 18.5],
    [-2.7, 17.6],
    [-4.2, 18],
    [-5, 18],
  ],
  [
    [-0.8, 9.3],
    [-1.8, 8.6],
    [-3, 8],
  ],
  [
    [0.1, 6],
    [1.5, 7.3],
    [3.2, 7.7],
    [5, 7.4],
    [5, 6],
  ],
  [
    [0.5, 12],
    [2.3, 11.3],
    [4, 10],
  ],
  [
    [-0.9, 18.5],
    [-2.8, 16.6],
    [-4, 16],
  ],
] as const;
export const WATER_PICKUPS = [
  [-0.4, 19.6],
  [-2.5, 17.8],
  [-4, 18],
  [0.8, 15.6],
  [0.2, 11.4],
  [1.8, 7.5],
  [4, 7.6],
] as const;
export function pathDistance(x: number, z: number) {
  let closest = Infinity;
  for (const path of WATER_PATHS)
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1],
        b = path[i];
      const dx = b[0] - a[0],
        dz = b[1] - a[1];
      const t = Math.max(
        0,
        Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)),
      );
      closest = Math.min(
        closest,
        Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz),
      );
    }
  return closest;
}
