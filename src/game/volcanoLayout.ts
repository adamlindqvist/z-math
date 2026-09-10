import { gladePosition } from "./gladeLayout";

export const VOLCANO_CHEST_POSITION = gladePosition(-4, -5.6);
export const VOLCANO_RUPEES = [
  [-7, 3.2],
  [-5.8, 1.2],
  [-4, -2],
  [-4, -4.2],
  // Along the trail from the western clearing up to the stone giant's arena.
  [-2.6, 0.3],
  [-0.6, 1],
  [0.8, 1.85],
].map(([x, z], index) => ({
  id: `volcano-path-${index + 1}`,
  ...gladePosition(x, z),
}));
