import {
  FogExp2,
  Color,
  type Scene,
  type DirectionalLight,
  type HemisphereLight,
} from "three";

export interface AreaEnvironment {
  background: string | null;
  fog?: { color: string; density: number };
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
export const UNDERWATER_ENVIRONMENT: AreaEnvironment = {
  background: "#195d70",
  sky: "#b0eee5",
  ground: "#347784",
  ambientIntensity: 2,
  sun: "#bdedf1",
  sunIntensity: 2.1,
  fog: { color: "#195d70", density: 0.024 },
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
  scene.fog = profile.fog
    ? new FogExp2(profile.fog.color, profile.fog.density)
    : null;
  scene.background = profile.background ? new Color(profile.background) : null;
  ambient.color.set(profile.sky);
  ambient.groundColor.set(profile.ground);
  ambient.intensity = profile.ambientIntensity;
  sun.color.set(profile.sun);
  sun.intensity = profile.sunIntensity;
}
