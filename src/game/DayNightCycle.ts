import { Color, type DirectionalLight, type HemisphereLight } from "three";
import type { GameState } from "../store/gameStore";
import { DEFAULT_ENVIRONMENT } from "./environment";

export type DayPeriod = "day" | "dusk" | "night" | "dawn";
const periodSeconds: Record<DayPeriod, number> = { day: 0, dusk: 65, night: 100, dawn: 160 };
const daySky = new Color(DEFAULT_ENVIRONMENT.sky);
const dayGround = new Color(DEFAULT_ENVIRONMENT.ground);
const daySun = new Color(DEFAULT_ENVIRONMENT.sun);
const nightSky = new Color("#9aaee5");
const nightGround = new Color("#465776");
const nightSun = new Color("#a8c8ff");
const duskSun = new Color("#ffb977");
const smooth = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

/** Session-only clock: never publishes frame updates to React or storage. */
export class DayNightCycle {
  private seconds = 0;
  private resetId: number;
  private request: GameState["debugDayPeriod"] = null;
  darkness = 0;

  constructor(resetId = 0) { this.resetId = resetId; }

  update(dt: number, state: Pick<GameState, "resetId" | "debugDayPeriod" | "location" | "overlay" | "motion" | "encounter">, hidden = false) {
    if (state.resetId !== this.resetId) {
      this.resetId = state.resetId;
      this.seconds = 0;
    }
    if (state.debugDayPeriod !== this.request) {
      this.request = state.debugDayPeriod;
      if (this.request) this.seconds = periodSeconds[this.request.period];
    }
    if (!state.location && !state.overlay && !state.motion && !state.encounter && !hidden)
      this.seconds = (this.seconds + Math.max(0, dt)) % 180;
    // Day 0–45s, sunset 45–85s, night 85–140s, sunrise 140–180s.
    this.darkness = smooth((this.seconds - 45) / 40) * (1 - smooth((this.seconds - 140) / 40));
  }

  apply(sun: DirectionalLight, ambient: HemisphereLight) {
    const night = this.darkness;
    ambient.color.copy(daySky).lerp(nightSky, night);
    ambient.groundColor.copy(dayGround).lerp(nightGround, night);
    ambient.intensity = DEFAULT_ENVIRONMENT.ambientIntensity * (1 - night) + 0.85 * night;
    sun.color.copy(daySun).lerp(nightSun, night).lerp(duskSun, 4 * night * (1 - night) * 0.65);
    sun.intensity = DEFAULT_ENVIRONMENT.sunIntensity * (1 - night) + 0.65 * night;
  }
}
