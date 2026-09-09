import { expect, it, vi } from "vitest";
import { SoundEngine, SOUND_KEY } from "../src/audio/sound";
function mockAudio(state = "running") {
  const node = () => ({ connect: vi.fn(), disconnect: vi.fn() });
  const makeSource = () => ({
    ...node(),
    frequency: { value: 0 },
    start: vi.fn(),
    stop: vi.fn(),
    onended: null as null | (() => void),
  });
  const sources: ReturnType<typeof makeSource>[] = [];
  const source = () => {
    const value = makeSource();
    sources.push(value);
    return value;
  };
  const context = {
    state,
    currentTime: 0,
    sampleRate: 44100,
    destination: node(),
    createGain: () => ({
      ...node(),
      gain: {
        value: 0,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
    }),
    createOscillator: source,
    createBufferSource: source,
    createBuffer: (_channels: number, length: number) => ({
      getChannelData: () => new Float32Array(length),
    }),
    resume: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  };
  const factory = vi.fn(() => context as unknown as AudioContext);
  return { context, sources, factory };
}
it("does not queue locked sounds and tolerates unavailable or rejected audio", async () => {
  const { factory, context, sources } = mockAudio("suspended");
  context.resume.mockRejectedValue(Error("blocked"));
  const engine = new SoundEngine(undefined, factory);
  engine.play("reward");
  expect(factory).not.toHaveBeenCalled();
  engine.unlock();
  engine.unlock();
  engine.play("rupee");
  await Promise.resolve();
  expect(factory).toHaveBeenCalledTimes(1);
  expect(sources).toHaveLength(0);
  context.state = "running";
  engine.play("correct");
  expect(sources).toHaveLength(2);
  engine.dispose();
  expect(context.close).toHaveBeenCalledOnce();
  const missing = new SoundEngine(undefined, () => {
    throw Error("unsupported");
  });
  expect(() => {
    missing.unlock();
    missing.play("rupee");
    missing.dispose();
  }).not.toThrow();
});
it("coalesces rupees, bounds overlap and cleans every node", () => {
  const { factory, context, sources } = mockAudio();
  const engine = new SoundEngine(undefined, factory);
  engine.unlock();
  engine.play("rupee");
  engine.play("rupee");
  expect(sources).toHaveLength(2);
  context.currentTime = 0.081;
  engine.play("rupee");
  engine.play("correct");
  engine.play("retry");
  expect(sources[0].disconnect).not.toHaveBeenCalled();
  engine.play("stone");
  expect(sources[0].disconnect).toHaveBeenCalledOnce();
  engine.stop();
  for (const source of sources) {
    expect(source.disconnect).toHaveBeenCalledOnce();
    expect(source.onended).toBeNull();
  }
  engine.play("discovery");
  const last = sources.slice(-3);
  last.forEach((source) => source.onended?.());
  last.forEach((source) => expect(source.disconnect).toHaveBeenCalledOnce());
});
it("persists only the sound preference and handles invalid or blocked storage", () => {
  const data = new Map<string, string>();
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
  const { factory, sources } = mockAudio();
  const engine = new SoundEngine(storage, factory);
  engine.unlock();
  engine.play("reward");
  engine.setEnabled(false);
  engine.play("correct");
  expect(sources).toHaveLength(4);
  expect(sources[0].disconnect).toHaveBeenCalled();
  expect(data.get(SOUND_KEY)).toBe("off");
  expect(new SoundEngine(storage).getEnabled()).toBe(false);
  data.set(SOUND_KEY, "broken");
  expect(new SoundEngine(storage).getEnabled()).toBe(true);
  const blocked = new SoundEngine({
    getItem: () => {
      throw Error();
    },
    setItem: () => {
      throw Error();
    },
  });
  expect(() => blocked.setEnabled(false)).not.toThrow();
  expect(blocked.getEnabled()).toBe(false);
});
it("stops and suppresses effects for independent pause, speech, focus and graphics blockers", () => {
  const { factory, sources } = mockAudio();
  const engine = new SoundEngine(undefined, factory);
  engine.unlock();
  for (const reason of ["pause", "hidden", "blur", "graphics", "speech"]) {
    engine.play("interact");
    const count = sources.length;
    engine.block(reason, true);
    engine.play("reward");
    expect(sources).toHaveLength(count);
    expect(sources.at(-1)!.disconnect).toHaveBeenCalled();
    engine.block("speech", true);
    engine.block(reason, false);
    if (reason !== "speech") {
      engine.play("reward");
      expect(sources).toHaveLength(count);
    }
    engine.block("speech", false);
  }
  engine.dispose();
  engine.unlock();
  expect(factory).toHaveBeenCalledTimes(2);
});
