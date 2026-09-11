import { Color, type Scene, type DirectionalLight, type HemisphereLight } from "three";

export interface AreaEnvironment {
  background: string | null;
  sky: string;
  ground: string;
  ambientIntensity: number;
  sun: string;
  sunIntensity: number;
}
export const DEFAULT_ENVIRONMENT: AreaEnvironment = {
  background: null,
  sky: "#ffefd8",
  ground: "#9da981",
  ambientIntensity: 2.2,
  sun: "#fff0d2",
  sunIntensity: 2.8,
};
export const CAVE_ENVIRONMENT: AreaEnvironment = {
  background: "#302725",
  sky: "#ffdbb4",
  ground: "#695047",
  ambientIntensity: 1.7,
  sun: "#ffcb94",
  sunIntensity: 1.7,
};
export function applyAreaEnvironment(
  scene: Scene,
  sun: DirectionalLight,
  ambient: HemisphereLight,
  profile: AreaEnvironment = DEFAULT_ENVIRONMENT,
) {
  scene.background = profile.background ? new Color(profile.background) : null;
  ambient.color.set(profile.sky);
  ambient.groundColor.set(profile.ground);
  ambient.intensity = profile.ambientIntensity;
  sun.color.set(profile.sun);
  sun.intensity = profile.sunIntensity;
}
