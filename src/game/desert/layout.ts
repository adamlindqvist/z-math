/** A wide, scalloped canyon basin with a loop around its central oasis. */
export const DESERT_ENTRY = { x: -10, z: 20.6, rotation: Math.PI };
export const DESERT_SPAWN = { x: -10, z: 19.1 };
export const DESERT_TEMPLE = { x: 7, z: 5.5 };
export const DESERT_TEMPLE_ARRIVAL = { x: 7, z: 7 };
export const DESERT_CHEST = { x: 8, z: 17 };
export const DESERT_OASIS = { x: 0, z: 10 };
export const DESERT_OBJECTS = {
  gullan: { x: -4, z: 9 },
  "desert-palm": { x: -6, z: 13 },
  "sand-pot": { x: 6, z: 11 },
};
export const DESERT_PICKUPS = [
  [-9, 14],
  [-6, 15],
  [-2, 16],
  [3, 16],
  [7, 17],
  [8, 10],
  [7, 7.5],
];
export const DESERT_PATHS = [
  [-10, 20.6, -10, 17],
  [-10, 17, -9, 14],
  [-9, 14, -6, 15],
  [-6, 15, -2, 16],
  [-2, 16, 3, 16],
  [3, 16, 8, 17],
  [3, 16, 7, 13],
  [7, 13, 8, 10],
  [8, 10, 7, 7],
  [7, 7, 7, 5.5],
  [-9, 14, -7, 10],
  [-7, 10, -4, 9],
  [-4, 9, -3, 6],
  [-3, 6, 2, 5],
  [2, 5, 5, 7],
  [5, 7, 7, 7],
  [-6, 15, -6, 13],
  [8, 10, 6, 11],
];
export function desertBoundary(angle: number) {
  const radius =
    1 + 0.12 * Math.sin(3 * angle + 0.4) + 0.06 * Math.cos(5 * angle);
  return {
    x: Math.cos(angle) * 16 * radius,
    z: 11 + Math.sin(angle) * 11 * radius,
  };
}
