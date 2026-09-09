import type { SoundEvent } from "./types";

export const SOUND_KEY = "legend-of-matte-sound";
type Storage = Pick<globalThis.Storage, "getItem" | "setItem">;
const melodies: Record<Exclude<SoundEvent, "stone">, number[]> = {
  rupee: [880, 1320],
  correct: [523, 659],
  retry: [392, 440],
  complete: [523, 659, 784, 1047],
  interact: [440, 587],
  solved: [587, 740, 880, 1175],
  reward: [392, 523, 659, 784],
  discovery: [523, 784, 1047],
};

export class SoundEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private active = new Set<() => void>();
  private listeners = new Set<() => void>();
  private blocks = new Set<string>();
  private enabled = true;
  private lastRupee = -Infinity;
  private variation = 0;
  constructor(
    private storage?: Storage,
    private createContext: () => AudioContext = () => new AudioContext(),
  ) {
    try {
      this.enabled = storage?.getItem(SOUND_KEY) !== "off";
    } catch {
      /* Optional storage. */
    }
  }
  getEnabled = () => this.enabled;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) this.stop();
    try {
      this.storage?.setItem(SOUND_KEY, enabled ? "on" : "off");
    } catch {
      /* Keep playing. */
    }
    this.listeners.forEach((listener) => listener());
  }
  block(reason: string, blocked: boolean) {
    if (blocked) {
      this.blocks.add(reason);
      this.stop();
    } else this.blocks.delete(reason);
  }
  unlock = () => {
    if (!this.enabled) return;
    try {
      if (!this.context) {
        this.context = this.createContext();
        this.master = this.context.createGain();
        this.master.gain.value = 0.16;
        this.master.connect(this.context.destination);
      }
      if (this.context.state !== "running")
        void this.context.resume().catch(() => {});
    } catch {
      /* Audio support must never block gameplay. */
    }
  };
  play = (event: SoundEvent) => {
    const ctx = this.context;
    if (
      !this.enabled ||
      this.blocks.size ||
      !ctx ||
      ctx.state !== "running" ||
      !this.master
    )
      return;
    const now = ctx.currentTime;
    if (event === "rupee" && now - this.lastRupee < 0.08) return;
    if (event === "rupee") this.lastRupee = now;
    if (this.active.size >= 4) this.active.values().next().value?.();
    const sources: AudioScheduledSourceNode[] = [];
    const nodes: AudioNode[] = [];
    let remaining = 0;
    const clean = () => {
      for (const source of sources) {
        source.onended = null;
        try {
          source.stop();
        } catch {
          /* Already ended. */
        }
      }
      nodes.forEach((node) => node.disconnect());
      this.active.delete(clean);
    };
    this.active.add(clean);
    const voice = (
      source: AudioScheduledSourceNode,
      start: number,
      duration: number,
      volume: number,
    ) => {
      sources.push(source);
      const gain = ctx.createGain();
      nodes.push(source, gain);
      source.connect(gain);
      gain.connect(this.master!);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration - 0.02);
      gain.gain.linearRampToValueAtTime(0, start + duration);
      remaining++;
      source.onended = () => {
        if (--remaining === 0) clean();
      };
      source.start(start);
      source.stop(start + duration);
    };
    try {
      if (event === "stone") {
        const buffer = ctx.createBuffer(
          1,
          Math.ceil(ctx.sampleRate * 0.32),
          ctx.sampleRate,
        );
        const samples = buffer.getChannelData(0);
        let smooth = 0;
        for (let i = 0; i < samples.length; i++) {
          smooth = smooth * 0.92 + (Math.random() * 2 - 1) * 0.08;
          samples[i] = smooth;
        }
        const scrape = ctx.createBufferSource();
        scrape.buffer = buffer;
        voice(scrape, now, 0.32, 0.8);
        const landing = ctx.createOscillator();
        landing.frequency.value = 145;
        voice(landing, now + 0.25, 0.18, 0.3);
      } else {
        const notes = melodies[event];
        const step = notes.length > 2 ? 0.15 : 0.09;
        const shift =
          event === "rupee" ? [1, 1.05946, 1.12246][this.variation++ % 3] : 1;
        notes.forEach((frequency, index) => {
          const oscillator = ctx.createOscillator();
          oscillator.type = "sine";
          oscillator.frequency.value = frequency * shift;
          voice(
            oscillator,
            now + index * step,
            notes.length > 2 ? 0.4 : 0.24,
            event === "retry" ? 0.28 : 0.45,
          );
        });
      }
    } catch {
      clean();
    }
  };
  stop() {
    [...this.active].forEach((clean) => clean());
    this.lastRupee = -Infinity;
  }
  dispose() {
    this.stop();
    if (this.context) {
      try {
        void this.context.close().catch(() => {});
      } catch {
        /* Already closed. */
      }
    }
    this.master?.disconnect();
    this.master = null;
    this.context = null;
    this.blocks.clear();
  }
}
let storage: Storage | undefined;
try {
  storage = window.localStorage;
} catch {
  /* Optional storage. */
}
export const sound = new SoundEngine(storage);
