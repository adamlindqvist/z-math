import { expect, it } from "vitest";
import { DirectionalLight, HemisphereLight } from "three";
import { DayNightCycle } from "../src/game/DayNightCycle";
import { createGameStore } from "../src/store/gameStore";
import { DEFAULT_ENVIRONMENT } from "../src/game/environment";

it("starts with the existing daylight, reaches a readable night and repeats after 180 seconds", () => {
  const cycle = new DayNightCycle(), store = createGameStore();
  const sun = new DirectionalLight(), ambient = new HemisphereLight();
  cycle.update(0, store.getState());
  cycle.apply(sun, ambient);
  const daylight = sun.color.clone();
  expect(sun.intensity).toBe(DEFAULT_ENVIRONMENT.sunIntensity);
  expect(ambient.intensity).toBe(DEFAULT_ENVIRONMENT.ambientIntensity);
  cycle.update(65, store.getState());
  expect(cycle.darkness).toBeCloseTo(0.5);
  cycle.update(35, store.getState());
  cycle.apply(sun, ambient);
  expect(cycle.darkness).toBe(1);
  expect(ambient.intensity).toBe(0.85);
  expect(sun.intensity).toBe(0.65);
  cycle.update(60, store.getState());
  expect(cycle.darkness).toBeCloseTo(0.5);
  cycle.update(20, store.getState());
  cycle.apply(sun, ambient);
  expect(cycle.darkness).toBe(0);
  expect(sun.color).toEqual(daylight);
  expect(sun.intensity).toBe(DEFAULT_ENVIRONMENT.sunIntensity);
});

it("freezes for overlays, hidden pages, motion and other areas", () => {
  const cycle = new DayNightCycle(), state = createGameStore().getState();
  cycle.update(65, state);
  const darkness = cycle.darkness;
  for (const overlay of ["pause", "quiz", "debug"] as const) {
    cycle.update(20, { ...state, overlay });
    expect(cycle.darkness).toBe(darkness);
  }
  cycle.update(20, state, true);
  expect(cycle.darkness).toBe(darkness);
  cycle.update(20, { ...state, motion: { index: 0, from: 0, to: 1 } });
  expect(cycle.darkness).toBe(darkness);
  cycle.update(20, { ...state, location: { world: "volcano" } });
  expect(cycle.darkness).toBe(darkness);
  cycle.update(1, state);
  expect(cycle.darkness).toBeGreaterThan(darkness);
});

it("applies repeated debug choices while paused, resumes and resets to day on session exit", () => {
  const store = createGameStore(), cycle = new DayNightCycle();
  store.openDebug();
  store.debugSetDayPeriod("night");
  cycle.update(0, store.getState());
  expect(cycle.darkness).toBe(1);
  store.closeDebug();
  cycle.update(60, store.getState());
  expect(cycle.darkness).toBeCloseTo(0.5);
  store.openDebug();
  store.debugSetDayPeriod("night");
  cycle.update(0, store.getState());
  expect(cycle.darkness).toBe(1);
  store.debugEndSession();
  cycle.update(0, store.getState());
  expect(cycle.darkness).toBe(0);
});
