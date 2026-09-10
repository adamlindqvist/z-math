import { gladePosition } from "./gladeLayout";

export const VOLCANO_CHEST_POSITION = gladePosition(-4, -5.6);
export const VOLCANO_RUPEES = [
  [-7, 3.2],
  [-5.8, 1.2],
  [-4, -2],
  [-4, -4.2],
].map(([x, z], index) => ({
  id: `volcano-path-${index + 1}`,
  ...gladePosition(x, z),
}));
