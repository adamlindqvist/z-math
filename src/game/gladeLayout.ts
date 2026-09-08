// Horizontal layout only: models, interaction reach and dungeon rooms keep their size.
export const GLADE_SCALE = 1.25;
export const gladeDistance = (value: number) => value * GLADE_SCALE;
export const gladePosition = (x: number, z: number) => ({
  x: gladeDistance(x),
  z: gladeDistance(z),
});
